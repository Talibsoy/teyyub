"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Package, Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface PrivatePackage {
  id: string;
  name: string;
  destination: string;
  package_type: "combo" | "flight_only" | "hotel_only";
  price_azn: number;
  price_usd: number | null;
  duration_nights: number | null;
  flight_info: string | null;
  hotel_name: string | null;
  hotel_stars: number | null;
  includes: string | null;
  excludes: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const empty: {
  name: string; destination: string;
  package_type: "combo" | "flight_only" | "hotel_only";
  price_azn: number; price_usd: number; duration_nights: number;
  flight_info: string; hotel_name: string; hotel_stars: number;
  includes: string; excludes: string; valid_until: string;
} = {
  name: "", destination: "", package_type: "combo",
  price_azn: 0, price_usd: 0, duration_nights: 0,
  flight_info: "", hotel_name: "", hotel_stars: 4,
  includes: "", excludes: "", valid_until: "",
};

const typeLabel: Record<string, string> = {
  combo: "Kombo (Uçuş + Otel)",
  flight_only: "Yalnız Uçuş",
  hotel_only: "Yalnız Otel",
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<PrivatePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const db = getSupabase();

  async function load() {
    setLoading(true);
    const { data } = await db.from("private_packages").select("*").order("created_at", { ascending: false });
    setPackages(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name || !form.destination || !form.price_azn) return;
    setSaving(true);
    await db.from("private_packages").insert({
      ...form,
      price_usd: form.price_usd || null,
      duration_nights: form.duration_nights || null,
      flight_info: form.flight_info || null,
      hotel_name: form.hotel_name || null,
      hotel_stars: form.hotel_stars || null,
      includes: form.includes || null,
      excludes: form.excludes || null,
      valid_until: form.valid_until || null,
      is_active: true,
    });
    setForm(empty);
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function toggleActive(id: string, current: boolean) {
    await db.from("private_packages").update({ is_active: !current }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu paketi silmək istəyirsiniz?")) return;
    await db.from("private_packages").delete().eq("id", id);
    load();
  }

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500";
  const lbl = "block text-xs text-gray-400 mb-1";

  return (
    <div style={{ padding: "32px 24px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>Gizli Paketlər</h1>
          <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
            Bu paketlər saytda görünmür — yalnız AI müştərilərə təklif edir
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: showForm ? "#1a1a1a" : "#D4AF37", color: showForm ? "#fff" : "#000",
            border: showForm ? "1px solid #333" : "none", borderRadius: 10,
            padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Plus size={15} /> Yeni Paket
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Yeni Gizli Paket</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className={lbl}>Paket adı *</label>
              <input className={inp} placeholder="məs: Antalya Sərfəli Paket" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>İstiqamət *</label>
              <input className={inp} placeholder="məs: Antalya, Türkiyə" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Növ *</label>
              <select className={inp} value={form.package_type} onChange={e => setForm(f => ({ ...f, package_type: e.target.value as "combo" | "flight_only" | "hotel_only" }))}>
                <option value="combo">Kombo (Uçuş + Otel)</option>
                <option value="flight_only">Yalnız Uçuş</option>
                <option value="hotel_only">Yalnız Otel</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Müddət (gecə)</label>
              <input className={inp} type="number" placeholder="7" value={form.duration_nights} onChange={e => setForm(f => ({ ...f, duration_nights: +e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Qiymət (AZN) *</label>
              <input className={inp} type="number" placeholder="850" value={form.price_azn} onChange={e => setForm(f => ({ ...f, price_azn: +e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Qiymət (USD)</label>
              <input className={inp} type="number" placeholder="500" value={form.price_usd || ""} onChange={e => setForm(f => ({ ...f, price_usd: +e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Uçuş məlumatı</label>
              <input className={inp} placeholder="Bakı → Antalya, birbaşa" value={form.flight_info || ""} onChange={e => setForm(f => ({ ...f, flight_info: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Otel adı</label>
              <input className={inp} placeholder="Rixos Premium Belek" value={form.hotel_name || ""} onChange={e => setForm(f => ({ ...f, hotel_name: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Otel ulduzu</label>
              <select className={inp} value={form.hotel_stars || 4} onChange={e => setForm(f => ({ ...f, hotel_stars: +e.target.value }))}>
                {[2,3,4,5].map(s => <option key={s} value={s}>{s} ★</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Etibarlılıq tarixi</label>
              <input className={inp} type="date" value={form.valid_until || ""} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={lbl}>Daxildir (vergüllə ayırın)</label>
              <input className={inp} placeholder="Uçuş, otel, transfer, səhər yeməyi" value={form.includes || ""} onChange={e => setForm(f => ({ ...f, includes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className={lbl}>Daxil deyil</label>
              <input className={inp} placeholder="Ekskursiyalar, viza" value={form.excludes || ""} onChange={e => setForm(f => ({ ...f, excludes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={save}
              disabled={saving || !form.name || !form.destination || !form.price_azn}
              style={{
                background: "#D4AF37", color: "#000", border: "none", borderRadius: 8,
                padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saxlanır..." : "Saxla"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(empty); }}
              style={{
                background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a",
                borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer",
              }}
            >
              Ləğv et
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: "#555", textAlign: "center", padding: "40px 0" }}>Yüklənir...</div>
      ) : packages.length === 0 ? (
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "48px 32px", textAlign: "center" }}>
          <Package size={32} style={{ color: "#333", marginBottom: 12 }} />
          <p style={{ color: "#555", margin: 0 }}>Hələ gizli paket yoxdur. Yeni paket əlavə edin.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {packages.map(p => (
            <div key={p.id} style={{
              background: "#111", border: "1px solid",
              borderColor: p.is_active ? "#1a2a1a" : "#1a1a1a",
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 16,
              opacity: p.is_active ? 1 : 0.5,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                  <span style={{ background: "#1a1a2a", color: "#8888ff", borderRadius: 99, padding: "1px 8px", fontSize: 11 }}>
                    {typeLabel[p.package_type]}
                  </span>
                  {p.is_active && (
                    <span style={{ background: "#0d1a0d", color: "#25D366", borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>
                      Aktiv
                    </span>
                  )}
                </div>
                <div style={{ color: "#666", fontSize: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span>📍 {p.destination}</span>
                  {p.duration_nights && <span>📅 {p.duration_nights} gecə</span>}
                  {p.hotel_name && <span>🏨 {p.hotel_name} {p.hotel_stars ? "★".repeat(p.hotel_stars) : ""}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "#D4AF37", fontWeight: 700, fontSize: 16 }}>{p.price_azn.toLocaleString()} AZN</div>
                {p.price_usd && <div style={{ color: "#555", fontSize: 11 }}>(~${p.price_usd.toLocaleString()})</div>}
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => toggleActive(p.id, p.is_active)}
                  title={p.is_active ? "Deaktiv et" : "Aktiv et"}
                  style={{
                    background: "#1a1a1a", border: "1px solid #2a2a2a", color: p.is_active ? "#25D366" : "#666",
                    borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                  }}
                >
                  {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => remove(p.id)}
                  style={{
                    background: "#1a0a0a", border: "1px solid #c0392b", color: "#e74c3c",
                    borderRadius: 8, padding: "7px 10px", cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
