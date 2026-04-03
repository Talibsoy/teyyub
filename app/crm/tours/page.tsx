"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, MapPin, Users, Calendar } from "lucide-react";

interface Tour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  end_date: string | null;
  max_seats: number;
  booked_seats: number;
  hotel: string | null;
  is_active: boolean;
  description: string | null;
}

const emptyForm = {
  name: "",
  destination: "",
  price_azn: "",
  price_usd: "",
  start_date: "",
  end_date: "",
  max_seats: "20",
  hotel: "",
  description: "",
  image_url: "",
  itinerary: "",
  includes: "",
  excludes: "",
  is_active: true,
};

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTours(); }, []);

  async function loadTours() {
    const { data } = await supabase.from("tours").select("*").order("created_at", { ascending: false });
    setTours(data || []);
    setLoading(false);
  }

  async function saveTour() {
    if (!form.name || !form.destination || !form.price_azn) return;
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/crm/tours", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      await loadTours();
      setShowModal(false);
      setForm(emptyForm);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || `Xəta: ${res.status}`);
    }
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("tours").update({ is_active: !current }).eq("id", id);
    setTours((prev) => prev.map((t) => t.id === id ? { ...t, is_active: !current } : t));
  }

  const available = (t: Tour) => t.max_seats - t.booked_seats;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Turlar</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Yeni tur
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
      ) : tours.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-600">Tur tapılmadı</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tours.map((tour) => (
            <div key={tour.id} className={`bg-gray-900 border rounded-xl p-5 ${tour.is_active ? "border-gray-800" : "border-gray-800/50 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{tour.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-sm mt-0.5">
                    <MapPin size={13} />
                    {tour.destination}
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(tour.id, tour.is_active)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    tour.is_active ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {tour.is_active ? "Aktiv" : "Deaktiv"}
                </button>
              </div>

              <div className="text-2xl font-bold text-white mb-3">{tour.price_azn} ₼</div>

              <div className="space-y-1.5 text-sm text-gray-400">
                {(tour.start_date || tour.end_date) && (
                  <div className="flex items-center gap-2">
                    <Calendar size={13} />
                    <span>
                      {tour.start_date ? new Date(tour.start_date).toLocaleDateString("az-AZ") : "?"} —{" "}
                      {tour.end_date ? new Date(tour.end_date).toLocaleDateString("az-AZ") : "?"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users size={13} />
                  <span>
                    <span className={available(tour) > 5 ? "text-emerald-400" : available(tour) > 0 ? "text-yellow-400" : "text-red-400"}>
                      {available(tour)} boş yer
                    </span>
                    {" "}/ {tour.max_seats} yer
                  </span>
                </div>
                {tour.hotel && <div className="text-gray-500 text-xs">🏨 {tour.hotel}</div>}
              </div>

              {/* Capacity bar */}
              <div className="mt-3 bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((tour.booked_seats / tour.max_seats) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Tour Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Yeni Tur</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tur adı *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Türkiyə - Antalya 7 gecə"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Destinasiya *</label>
                <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="Antalya, Türkiyə"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Qiymət (AZN) *</label>
                  <input value={form.price_azn} onChange={(e) => setForm({ ...form, price_azn: e.target.value })}
                    type="number" placeholder="1200"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Qiymət (USD)</label>
                  <input value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: e.target.value })}
                    type="number" placeholder="700"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Başlama tarixi</label>
                  <input value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    type="date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Bitmə tarixi</label>
                  <input value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    type="date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Maksimum yer</label>
                  <input value={form.max_seats} onChange={(e) => setForm({ ...form, max_seats: e.target.value })}
                    type="number" placeholder="20"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Otel</label>
                  <input value={form.hotel} onChange={(e) => setForm({ ...form, hotel: e.target.value })}
                    placeholder="Titanic Beach Hotel"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Təsvir</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} placeholder="Tur haqqında qısa məlumat..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Şəkil URL</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Daxildir (hər sətirdə 1 maddə)</label>
                <textarea value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })}
                  rows={3} placeholder={"Uçuş\nOtel (all inclusive)\nTransfer"}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Daxil deyil (hər sətirdə 1 maddə)</label>
                <textarea value={form.excludes} onChange={(e) => setForm({ ...form, excludes: e.target.value })}
                  rows={2} placeholder={"Viza\nŞəxsi xərclər"}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gündəlik proqram (hər sətirdə 1 gün)</label>
                <textarea value={form.itinerary} onChange={(e) => setForm({ ...form, itinerary: e.target.value })}
                  rows={4} placeholder={"Bakıdan uçuş, hoteldə yerləşmə\nŞəhər turu, nahar\nAzad gün\nEv yolu"}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Ləğv et
              </button>
              <button onClick={saveTour} disabled={saving || !form.name || !form.destination || !form.price_azn}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {saving ? "Saxlanır..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
