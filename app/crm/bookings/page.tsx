"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Search, FileDown, Mail } from "lucide-react";
import { logActivity } from "@/lib/activity";

interface Booking {
  id: string;
  booking_number: string;
  status: string;
  total_price: number;
  currency: string;
  notes: string | null;
  created_at: string;
  customers: { first_name: string; last_name: string | null; phone: string | null } | null;
  tours: { name: string; destination: string } | null;
}

interface Tour { id: string; name: string; destination: string; price_azn: number; }
interface Customer { id: string; first_name: string; last_name: string | null; phone: string | null; }

const STATUS_OPTIONS = ["new", "contacted", "confirmed", "paid", "cancelled"];
const STATUS_AZ: Record<string, string> = {
  new: "Yeni",
  contacted: "Əlaqə saxlanılıb",
  confirmed: "Təsdiqlənib",
  paid: "Ödənilib",
  cancelled: "Ləğv edilib",
};
const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-900/50 text-blue-400",
  contacted: "bg-yellow-900/50 text-yellow-400",
  confirmed: "bg-emerald-900/50 text-emerald-400",
  paid: "bg-violet-900/50 text-violet-400",
  cancelled: "bg-red-900/50 text-red-400",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [emailing, setEmailing] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_id: "",
    tour_id: "",
    total_price: "",
    currency: "AZN",
    notes: "",
    status: "new",
  });

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!search) return setFiltered(bookings);
    const q = search.toLowerCase();
    setFiltered(bookings.filter((b) =>
      b.booking_number.toLowerCase().includes(q) ||
      b.customers?.first_name.toLowerCase().includes(q) ||
      b.tours?.name.toLowerCase().includes(q)
    ));
  }, [bookings, search]);

  async function loadAll() {
    const [bookingsRes, toursRes, customersRes] = await Promise.all([
      supabase.from("bookings").select("*, customers(first_name,last_name,phone), tours(name,destination)").order("created_at", { ascending: false }),
      supabase.from("tours").select("id,name,destination,price_azn").eq("is_active", true),
      supabase.from("customers").select("id,first_name,last_name,phone"),
    ]);
    setBookings(bookingsRes.data || []);
    setTours(toursRes.data || []);
    setCustomers(customersRes.data || []);
    setLoading(false);
  }

  async function saveBooking() {
    if (!form.tour_id || !form.total_price) return;
    setSaving(true);
    const { error } = await supabase.from("bookings").insert([{
      customer_id: form.customer_id || null,
      tour_id: form.tour_id,
      total_price: parseFloat(form.total_price),
      currency: form.currency,
      notes: form.notes || null,
      status: form.status,
      booking_number: "",
    }]);
    if (!error) {
      await loadAll();
      setShowModal(false);
      setForm({ customer_id: "", tour_id: "", total_price: "", currency: "AZN", notes: "", status: "new" });
    }
    setSaving(false);
  }

  async function sendEmail(bookingId: string, type: string) {
    setEmailing(bookingId);
    await fetch("/api/crm/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, bookingId }),
    });
    setEmailing(null);
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const booking = bookings.find((b) => b.id === id);
    await supabase.from("bookings").update({ status }).eq("id", id);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    await logActivity("booking", id, "status_changed", { status: booking?.status }, { status });
    setUpdating(null);
  }

  function onTourSelect(tourId: string) {
    const tour = tours.find((t) => t.id === tourId);
    setForm({ ...form, tour_id: tourId, total_price: tour ? String(tour.price_azn) : "" });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Rezervasiyalar</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Yeni rezervasiya
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Nömrə, müştəri, tur axtar..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600">Rezervasiya tapılmadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Nömrə</th>
                  <th className="text-left px-4 py-3 font-medium">Müştəri</th>
                  <th className="text-left px-4 py-3 font-medium">Tur</th>
                  <th className="text-left px-4 py-3 font-medium">Məbləğ</th>
                  <th className="text-left px-4 py-3 font-medium">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-blue-400 font-mono text-xs">{b.booking_number}</td>
                    <td className="px-4 py-3">
                      <div className="text-white">{b.customers ? `${b.customers.first_name} ${b.customers.last_name || ""}` : "—"}</div>
                      <div className="text-gray-500 text-xs">{b.customers?.phone || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{b.tours?.name || "—"}</div>
                      <div className="text-gray-500 text-xs">{b.tours?.destination || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{b.total_price} {b.currency}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString("az-AZ")}
                    </td>
                    <td className="px-4 py-3">
                      <select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)}
                        disabled={updating === b.id}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${STATUS_COLOR[b.status] || "bg-gray-800 text-gray-400"}`}>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-gray-900 text-white">{STATUS_AZ[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <a href={`/api/crm/invoice?id=${b.id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1.5 rounded-lg transition-colors">
                          <FileDown size={12} /> PDF
                        </a>
                        <button
                          onClick={() => sendEmail(b.id, b.status === "paid" ? "payment_receipt" : "booking_confirm")}
                          disabled={emailing === b.id}
                          title={b.status === "paid" ? "Ödəniş qəbzi göndər" : "Təsdiq emaili göndər"}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 bg-gray-800 hover:bg-gray-700 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                          <Mail size={12} /> {emailing === b.id ? "..." : "Email"}
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

      {/* New Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Yeni Rezervasiya</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Müştəri</label>
                <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">— Seç —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name || ""} {c.phone ? `(${c.phone})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tur *</label>
                <select value={form.tour_id} onChange={(e) => onTourSelect(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">— Seç —</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.price_azn} ₼</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Məbləğ *</label>
                  <input value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })}
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Valyuta</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option>AZN</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
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
              <button onClick={saveBooking} disabled={saving || !form.tour_id || !form.total_price}
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
