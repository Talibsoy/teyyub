"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  bookings: {
    booking_number: string;
    customers: { first_name: string; last_name: string | null } | null;
    tours: { name: string } | null;
  } | null;
}

interface Booking { id: string; booking_number: string; total_price: number; }

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-400",
  paid: "bg-emerald-900/50 text-emerald-400",
  failed: "bg-red-900/50 text-red-400",
  refunded: "bg-gray-800 text-gray-400",
};
const STATUS_AZ: Record<string, string> = {
  pending: "Gözləyir",
  paid: "Ödənilib",
  failed: "Uğursuz",
  refunded: "Geri qaytarılıb",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    booking_id: "",
    amount: "",
    currency: "AZN",
    status: "paid",
    payment_method: "cash",
  });

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [paymentsRes, bookingsRes] = await Promise.all([
      supabase.from("payments").select("*, bookings(booking_number, customers(first_name,last_name), tours(name))").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id,booking_number,total_price"),
    ]);
    setPayments(paymentsRes.data || []);
    setBookings(bookingsRes.data || []);
    setLoading(false);
  }

  async function savePayment() {
    if (!form.booking_id || !form.amount) return;
    setSaving(true);
    const { error } = await supabase.from("payments").insert([{
      booking_id: form.booking_id,
      amount: parseFloat(form.amount),
      currency: form.currency,
      status: form.status,
      payment_method: form.payment_method,
      paid_at: form.status === "paid" ? new Date().toISOString() : null,
    }]);
    if (!error) {
      if (form.status === "paid") {
        await supabase.from("bookings").update({ status: "paid" }).eq("id", form.booking_id);
      }
      await loadAll();
      setShowModal(false);
      setForm({ booking_id: "", amount: "", currency: "AZN", status: "paid", payment_method: "cash" });
    }
    setSaving(false);
  }

  function onBookingSelect(id: string) {
    const b = bookings.find((b) => b.id === id);
    setForm({ ...form, booking_id: id, amount: b ? String(b.total_price) : "" });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Ödənişlər</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Yeni ödəniş
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Ümumi ödənilmiş</div>
          <div className="text-2xl font-bold text-emerald-400">{totalPaid.toFixed(2)} ₼</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Gözləyən</div>
          <div className="text-2xl font-bold text-yellow-400">{totalPending.toFixed(2)} ₼</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
        ) : payments.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600">Ödəniş tapılmadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">Rezervasiya</th>
                  <th className="text-left px-4 py-3 font-medium">Müştəri / Tur</th>
                  <th className="text-left px-4 py-3 font-medium">Məbləğ</th>
                  <th className="text-left px-4 py-3 font-medium">Üsul</th>
                  <th className="text-left px-4 py-3 font-medium">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-blue-400 font-mono text-xs">{p.bookings?.booking_number || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-white">
                        {p.bookings?.customers ? `${p.bookings.customers.first_name} ${p.bookings.customers.last_name || ""}` : "—"}
                      </div>
                      <div className="text-gray-500 text-xs">{p.bookings?.tours?.name || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">{p.amount} {p.currency}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{p.payment_method || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString("az-AZ") : new Date(p.created_at).toLocaleDateString("az-AZ")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status] || "bg-gray-800 text-gray-400"}`}>
                        {STATUS_AZ[p.status] || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Yeni Ödəniş</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Rezervasiya *</label>
                <select value={form.booking_id} onChange={(e) => onBookingSelect(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">— Seç —</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>{b.booking_number} — {b.total_price} ₼</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Məbləğ *</label>
                  <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Valyuta</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option>AZN</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ödəniş üsulu</label>
                  <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="cash">Nağd</option>
                    <option value="transfer">Köçürmə</option>
                    <option value="payriff">Payriff</option>
                    <option value="card">Kart</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="paid">Ödənilib</option>
                    <option value="pending">Gözləyir</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">
                Ləğv et
              </button>
              <button onClick={savePayment} disabled={saving || !form.booking_id || !form.amount}
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
