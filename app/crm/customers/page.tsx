"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, X, Upload, FileText, Eye, Star, Globe } from "lucide-react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  passport_url: string | null;
  tags: string[];
  source: string | null;
  notes: string | null;
  auth_user_id: string | null;
  loyalty_points: number | null;
  created_at: string;
}

const TAG_COLOR: Record<string, string> = {
  vip:       "bg-yellow-900/50 text-yellow-400",
  repeat:    "bg-purple-900/50 text-purple-400",
  potential: "bg-blue-900/50 text-blue-400",
};

const TAG_AZ: Record<string, string> = {
  vip: "VIP",
  repeat: "Təkrar",
  potential: "Potensial",
};

const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  passport_number: "",
  passport_expiry: "",
  tags: [] as string[],
  notes: "",
  source: "manual",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New customer modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Passport upload modal
  const [uploadModal, setUploadModal] = useState<Customer | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadCustomers(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(customers);
    const q = search.toLowerCase();
    setFiltered(customers.filter((c) =>
      c.first_name.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.passport_number?.includes(q)
    ));
  }, [customers, search]);

  async function loadCustomers() {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  }

  async function saveCustomer() {
    if (!form.first_name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("customers").insert([form]);
    if (!error) {
      await loadCustomers();
      setShowModal(false);
      setForm(emptyForm);
    }
    setSaving(false);
  }

  async function uploadPassport(file: File) {
    if (!uploadModal) return;
    setUploading(true);
    setUploadDone(false);

    const ext = file.name.split(".").pop();
    const path = `${uploadModal.id}/passport.${ext}`;

    // Supabase Storage-a yüklə
    const { error: uploadError } = await supabase.storage
      .from("passports")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      setUploading(false);
      return;
    }

    // URL-i customers cədvəlinə yaz
    await supabase.from("customers").update({ passport_url: path }).eq("id", uploadModal.id);
    setCustomers((prev) => prev.map((c) => c.id === uploadModal.id ? { ...c, passport_url: path } : c));
    setUploadDone(true);
    setUploading(false);
  }

  async function getPassportUrl(path: string) {
    const { data } = await supabase.storage.from("passports").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Müştərilər</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Yeni müştəri
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Ad, telefon, email, pasport axtar..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600">Müştəri tapılmadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Ad Soyad</th>
                  <th className="text-left px-4 py-3 font-medium">Əlaqə</th>
                  <th className="text-left px-4 py-3 font-medium">Pasport</th>
                  <th className="text-left px-4 py-3 font-medium">Teqlər</th>
                  <th className="text-left px-4 py-3 font-medium">Mənbə / Xallar</th>
                  <th className="text-left px-4 py-3 font-medium">Skan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{c.first_name} {c.last_name || ""}</span>
                      </div>
                      {c.notes && <div className="text-gray-500 text-xs line-clamp-1 mt-0.5">{c.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{c.phone || "—"}</div>
                      <div className="text-gray-500 text-xs">{c.email || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      {c.passport_number ? (
                        <div>
                          <div className="text-gray-300 font-mono text-xs">{c.passport_number}</div>
                          {c.passport_expiry && (
                            <div className={`text-xs ${new Date(c.passport_expiry) < new Date() ? "text-red-400" : "text-gray-500"}`}>
                              {new Date(c.passport_expiry).toLocaleDateString("az-AZ")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags || []).map((tag) => (
                          <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLOR[tag] || "bg-gray-800 text-gray-400"}`}>
                            {TAG_AZ[tag] || tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {c.auth_user_id ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-400 border border-blue-800/50 w-fit">
                            <Globe size={10} /> Panel Üzvü
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs capitalize">{c.source || "—"}</span>
                        )}
                        {c.loyalty_points != null && c.loyalty_points > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                            <Star size={10} className="fill-amber-400" />
                            {c.loyalty_points.toLocaleString()} xal
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.passport_url ? (
                          <>
                            <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FileText size={10} /> Var
                            </span>
                            <button onClick={() => getPassportUrl(c.passport_url!)}
                              className="text-gray-400 hover:text-white transition-colors">
                              <Eye size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-600">Yoxdur</span>
                        )}
                        <button onClick={() => { setUploadModal(c); setUploadDone(false); }}
                          className="text-gray-500 hover:text-blue-400 transition-colors ml-1">
                          <Upload size={14} />
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

      {/* New Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Yeni Müştəri</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ad *</label>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Soyad</label>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefon</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+994501234567"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Pasport №</label>
                  <input value={form.passport_number} onChange={(e) => setForm({ ...form, passport_number: e.target.value })}
                    placeholder="AZE1234567"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Bitmə tarixi</label>
                  <input value={form.passport_expiry} onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })}
                    type="date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Teqlər</label>
                <div className="flex gap-2">
                  {Object.entries(TAG_AZ).map(([val, label]) => (
                    <button key={val} onClick={() => toggleTag(val)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.tags.includes(val) ? TAG_COLOR[val] : "bg-gray-800 text-gray-500 hover:bg-gray-700"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Qeyd</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Ləğv et
              </button>
              <button onClick={saveCustomer} disabled={saving || !form.first_name.trim()}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {saving ? "Saxlanır..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passport Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Pasport Skanı</h3>
              <button onClick={() => setUploadModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              <span className="text-white font-medium">{uploadModal.first_name} {uploadModal.last_name || ""}</span>
              {" "}üçün pasport skanı yüklə
            </p>

            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) uploadPassport(e.target.files[0]); }} />

            {uploadDone ? (
              <div className="flex items-center justify-center gap-2 py-8 text-emerald-400">
                <FileText size={20} />
                <span className="font-medium">Uğurla yükləndi!</span>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50">
                <Upload size={24} />
                <span className="text-sm">{uploading ? "Yüklənir..." : "Fayl seç (şəkil və ya PDF)"}</span>
              </button>
            )}

            <button onClick={() => setUploadModal(null)}
              className="w-full mt-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
              Bağla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
