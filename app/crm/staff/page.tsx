"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStaff } from "@/lib/use-staff";
import { Plus, X, Shield, User, Briefcase } from "lucide-react";

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  email?: string;
}

const ROLE_AZ: Record<string, string> = {
  admin: "Admin",
  manager: "Menecer",
  agent: "Agent",
};

const ROLE_COLOR: Record<string, string> = {
  admin: "bg-red-900/50 text-red-400",
  manager: "bg-blue-900/50 text-blue-400",
  agent: "bg-gray-800 text-gray-400",
};

const ROLE_ICON: Record<string, React.ElementType> = {
  admin: Shield,
  manager: Briefcase,
  agent: User,
};

export default function StaffPage() {
  const { staff: currentStaff, isAdmin } = useStaff();
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", full_name: "", role: "agent", phone: "" });

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    // staff + auth.users join (email almaq üçün)
    const { data } = await supabase.from("staff").select("*").order("created_at");
    setMembers(data || []);
    setLoading(false);
  }

  async function inviteStaff() {
    if (!form.email || !form.full_name) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/crm/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      await loadStaff();
      setShowModal(false);
      setForm({ email: "", full_name: "", role: "agent", phone: "" });
    }
    setSaving(false);
  }

  async function updateRole(id: string, role: string) {
    await supabase.from("staff").update({ role }).eq("id", id);
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m));
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("staff").update({ is_active: !current }).eq("id", id);
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, is_active: !current } : m));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">İşçilər</h2>
        {isAdmin && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> İşçi dəvət et
          </button>
        )}
      </div>

      {/* Role legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(ROLE_AZ).map(([role, label]) => {
          const Icon = ROLE_ICON[role];
          return (
            <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${ROLE_COLOR[role]}`}>
              <Icon size={13} /> {label}
            </div>
          );
        })}
      </div>

      {/* Staff grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
      ) : members.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-48 text-gray-600">
          İşçi tapılmadı
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const Icon = ROLE_ICON[m.role] || User;
            const isMe = m.id === currentStaff?.id;
            return (
              <div key={m.id} className={`bg-gray-900 border rounded-xl p-5 ${m.is_active ? "border-gray-800" : "border-gray-800/40 opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ROLE_COLOR[m.role]}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {m.full_name}
                        {isMe && <span className="ml-1.5 text-xs text-gray-500">(sən)</span>}
                      </div>
                      {m.phone && <div className="text-gray-500 text-xs">{m.phone}</div>}
                    </div>
                  </div>
                  {m.is_active ? (
                    <span className="text-xs text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-full">Aktiv</span>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Deaktiv</span>
                  )}
                </div>

                {isAdmin && !isMe && (
                  <div className="flex gap-2 mt-3">
                    <select value={m.role} onChange={(e) => updateRole(m.id, e.target.value)}
                      className={`flex-1 text-xs font-medium px-2 py-1.5 rounded-lg border-0 focus:outline-none cursor-pointer ${ROLE_COLOR[m.role]}`}>
                      <option value="admin" className="bg-gray-900 text-white">Admin</option>
                      <option value="manager" className="bg-gray-900 text-white">Menecer</option>
                      <option value="agent" className="bg-gray-900 text-white">Agent</option>
                    </select>
                    <button onClick={() => toggleActive(m.id, m.is_active)}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-colors">
                      {m.is_active ? "Deaktiv et" : "Aktiv et"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">İşçi Dəvət Et</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <p className="text-sm text-gray-400 mb-4">İşçiyə dəvət emaili göndəriləcək. Email linkə basaraq şifrə qoyacaq.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ad Soyad *</label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Əli Əliyev"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email" placeholder="ali@natoure.az"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefon</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+994501234567"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="agent">Agent</option>
                  <option value="manager">Menecer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Ləğv et
              </button>
              <button onClick={inviteStaff} disabled={saving || !form.email || !form.full_name}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {saving ? "Göndərilir..." : "Dəvət göndər"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
