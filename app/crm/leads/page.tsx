"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Send, X, Star, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { logActivity } from "@/lib/activity";

const PAGE_SIZE = 20;

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  platform: string;
  sender_id: string;
  destination: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["all", "new", "contacted", "converted", "lost"];
const PLATFORM_OPTIONS = ["all", "whatsapp", "facebook", "instagram"];

const STATUS_AZ: Record<string, string> = {
  new: "Yeni",
  contacted: "Əlaqə saxlanılıb",
  converted: "Çevrildi",
  lost: "İtirildi",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-900/50 text-blue-400",
  contacted: "bg-yellow-900/50 text-yellow-400",
  converted: "bg-emerald-900/50 text-emerald-400",
  lost: "bg-red-900/50 text-red-400",
};

const PLATFORM_COLOR: Record<string, string> = {
  whatsapp: "bg-green-900/50 text-green-400",
  facebook: "bg-blue-900/50 text-blue-400",
  instagram: "bg-pink-900/50 text-pink-400",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [markResult, setMarkResult] = useState<Record<string, "ok" | "err">>({});
  const [page, setPage] = useState(1);

  // Mesaj göndər modal
  const [msgModal, setMsgModal] = useState<Lead | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<"ok" | "err" | null>(null);

  useEffect(() => { loadLeads(); }, []);

  useEffect(() => {
    let data = leads;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.phone?.includes(q) ||
          l.destination?.toLowerCase().includes(q) ||
          l.message?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") data = data.filter((l) => l.status === statusFilter);
    if (platformFilter !== "all") data = data.filter((l) => l.platform === platformFilter);
    setFiltered(data);
    setPage(1);
  }, [leads, search, statusFilter, platformFilter]);

  async function loadLeads() {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const lead = leads.find((l) => l.id === id);
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await logActivity("lead", id, "status_changed", { status: lead?.status }, { status });
    fetch("/api/crm/run-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "lead.status_changed",
        data: {
          id,
          status,
          old_status: lead?.status,
          name: lead?.name ?? undefined,
          platform: lead?.platform ?? undefined,
          sender_id: lead?.sender_id ?? undefined,
          destination: lead?.destination ?? undefined,
        },
      }),
    }).catch(() => {});
    setUpdating(null);
  }

  async function sendMessage() {
    if (!msgModal || !msgText.trim()) return;
    setSending(true);
    setSendResult(null);
    const res = await fetch("/api/crm/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: msgModal.platform,
        sender_id: msgModal.sender_id,
        message: msgText,
      }),
    });
    const data = await res.json();
    setSendResult(data.success ? "ok" : "err");
    if (data.success) {
      setMsgText("");
      // Statusu "contacted"-a yenilə
      if (msgModal.status === "new") {
        await updateStatus(msgModal.id, "contacted");
      }
      setTimeout(() => { setMsgModal(null); setSendResult(null); }, 1000);
    }
    setSending(false);
  }

  async function markAsExample(lead: Lead) {
    setMarking(lead.id);
    try {
      const res = await fetch("/api/crm/mark-example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: lead.platform,
          senderId: lead.sender_id,
          destination: lead.destination,
        }),
      });
      const data = await res.json();
      setMarkResult((prev) => ({ ...prev, [lead.id]: data.success ? "ok" : "err" }));
      setTimeout(() => setMarkResult((prev) => { const n = { ...prev }; delete n[lead.id]; return n; }), 2000);
    } catch {
      setMarkResult((prev) => ({ ...prev, [lead.id]: "err" }));
    }
    setMarking(null);
  }

  function exportCSV() {
    const headers = ["Ad", "Telefon", "Email", "Platform", "Destinasiya", "Mesaj", "Status", "Tarix"];
    const rows = filtered.map((l) => [
      l.name || "",
      l.phone || "",
      l.email || "",
      l.platform,
      l.destination || "",
      (l.message || "").replace(/,/g, " "),
      STATUS_AZ[l.status] || l.status,
      formatDate(l.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("az-AZ", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Leadlər</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filtered.length} nəticə</span>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
            <Download size={13} /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, telefon, destinasiya axtar..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "all" ? "Bütün statuslar" : STATUS_AZ[s]}</option>
          ))}
        </select>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none">
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>{p === "all" ? "Bütün platformalar" : p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600">Lead tapılmadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Ad / Telefon</th>
                  <th className="text-left px-4 py-3 font-medium">Platform</th>
                  <th className="text-left px-4 py-3 font-medium">Destinasiya</th>
                  <th className="text-left px-4 py-3 font-medium">Mesaj</th>
                  <th className="text-left px-4 py-3 font-medium">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{lead.name || "—"}</div>
                      <div className="text-gray-500 text-xs">{lead.phone || lead.sender_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PLATFORM_COLOR[lead.platform] || "bg-gray-800 text-gray-400"}`}>
                        {lead.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{lead.destination || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs">
                      <span className="line-clamp-1">{lead.message || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <select value={lead.status} onChange={(e) => updateStatus(lead.id, e.target.value)}
                        disabled={updating === lead.id}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${STATUS_COLOR[lead.status] || "bg-gray-800 text-gray-400"}`}>
                        {Object.entries(STATUS_AZ).map(([val, label]) => (
                          <option key={val} value={val} className="bg-gray-900 text-white">{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.platform === "whatsapp" && (
                          <button onClick={() => { setMsgModal(lead); setMsgText(""); setSendResult(null); }}
                            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-900/50 px-2.5 py-1.5 rounded-lg transition-colors">
                            <Send size={12} /> Mesaj
                          </button>
                        )}
                        <button
                          onClick={() => markAsExample(lead)}
                          disabled={marking === lead.id}
                          title="Uğurlu nümunə kimi işarələ"
                          className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg transition-colors ${
                            markResult[lead.id] === "ok"
                              ? "text-yellow-300 bg-yellow-900/50"
                              : markResult[lead.id] === "err"
                              ? "text-red-400 bg-red-900/30"
                              : "text-gray-500 hover:text-yellow-400 hover:bg-yellow-900/20"
                          }`}>
                          <Star size={12} />
                          {markResult[lead.id] === "ok" ? "Saxlandı" : markResult[lead.id] === "err" ? "Xəta" : ""}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-400">{page} / {Math.ceil(filtered.length / PAGE_SIZE)}</span>
            <button onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / PAGE_SIZE), p + 1))} disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">WhatsApp Mesajı</h3>
                <p className="text-sm text-gray-400 mt-0.5">{msgModal.name || msgModal.sender_id}</p>
              </div>
              <button onClick={() => setMsgModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <textarea
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              rows={4}
              placeholder="Mesajınızı yazın..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
            />

            {sendResult === "ok" && <p className="text-emerald-400 text-sm mt-2">✓ Mesaj göndərildi</p>}
            {sendResult === "err" && <p className="text-red-400 text-sm mt-2">✗ Göndərilmədi, yoxla</p>}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setMsgModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Ləğv et
              </button>
              <button onClick={sendMessage} disabled={sending || !msgText.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                <Send size={14} /> {sending ? "Göndərilir..." : "Göndər"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
