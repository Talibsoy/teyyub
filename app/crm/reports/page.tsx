"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, DollarSign, Package, Users } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ef4444", "#ec4899"];

interface TourStat {
  name: string;
  bookings: number;
  revenue: number;
  leads: number;
}

interface MonthStat {
  month: string;
  revenue: number;
  bookings: number;
}

interface FinancialSummary {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalBookings: number;
  paidBookings: number;
  avgBookingValue: number;
  conversionRate: number;
}

export default function ReportsPage() {
  const [tourStats, setTourStats] = useState<TourStat[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStat[]>([]);
  const [destStats, setDestStats] = useState<{ name: string; value: number }[]>([]);
  const [platformStats, setPlatformStats] = useState<{ name: string; value: number; converted: number }[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);

  async function loadReports() {
    const [bookingsRes, paymentsRes, leadsRes, toursRes] = await Promise.all([
      supabase.from("bookings").select("*, tours(name, destination), payments(amount, status)").order("created_at", { ascending: false }),
      supabase.from("payments").select("amount, status, created_at"),
      supabase.from("leads").select("destination, platform, status, created_at"),
      supabase.from("tours").select("id, name, destination"),
    ]);

    const bookings = bookingsRes.data || [];
    const payments = paymentsRes.data || [];
    const leads = leadsRes.data || [];

    // ===== FİNANS XÜLASƏSI =====
    const paidPayments = payments.filter((p) => p.status === "paid");
    const pendingPayments = payments.filter((p) => p.status === "pending");
    const totalRevenue = paidPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingRevenue = pendingPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const paidBookings = bookings.filter((b) => b.status === "paid").length;
    const convertedLeads = leads.filter((l) => l.status === "converted").length;

    setSummary({
      totalRevenue,
      paidRevenue: totalRevenue,
      pendingRevenue,
      totalBookings: bookings.length,
      paidBookings,
      avgBookingValue: bookings.length > 0 ? totalRevenue / (paidBookings || 1) : 0,
      conversionRate: leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0,
    });

    // ===== TUR STATİSTİKASI =====
    const tourMap: Record<string, TourStat> = {};
    bookings.forEach((b) => {
      const tourName = b.tours?.name || "Naməlum";
      if (!tourMap[tourName]) {
        tourMap[tourName] = { name: tourName, bookings: 0, revenue: 0, leads: 0 };
      }
      tourMap[tourName].bookings++;
      tourMap[tourName].revenue += b.total_price || 0;
    });
    // Lead-lərdən tour tələbatı
    leads.forEach((l) => {
      const dest = l.destination || "Digər";
      const key = Object.keys(tourMap).find((k) => k.toLowerCase().includes(dest.toLowerCase()));
      if (key) tourMap[key].leads++;
    });
    const tourArr = Object.values(tourMap).sort((a, b) => b.bookings - a.bookings).slice(0, 8);
    setTourStats(tourArr);

    // ===== AYLIQ GƏLİR =====
    const monthMap: Record<string, MonthStat> = {};
    paidPayments.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("az", { month: "short", year: "2-digit" });
      if (!monthMap[key]) monthMap[key] = { month: label, revenue: 0, bookings: 0 };
      monthMap[key].revenue += p.amount || 0;
    });
    bookings.forEach((b) => {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthMap[key]) monthMap[key].bookings++;
    });
    const monthArr = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    setMonthStats(monthArr);

    // ===== DESTİNASİYA TƏLƏBATI =====
    const destMap: Record<string, number> = {};
    leads.forEach((l) => {
      const d = l.destination || "Digər";
      destMap[d] = (destMap[d] || 0) + 1;
    });
    setDestStats(Object.entries(destMap).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value })));

    // ===== PLATFORM KONVERSİYA =====
    const platMap: Record<string, { total: number; converted: number }> = {};
    leads.forEach((l) => {
      const p = l.platform || "digər";
      if (!platMap[p]) platMap[p] = { total: 0, converted: 0 };
      platMap[p].total++;
      if (l.status === "converted") platMap[p].converted++;
    });
    setPlatformStats(
      Object.entries(platMap).map(([name, v]) => ({
        name,
        value: v.total,
        converted: v.converted,
      }))
    );

    setLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Hesabat hazırlanır...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Hesabatlar</h2>

      {/* Maliyyə Xülasəsi */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ümumi Gəlir (AZN)", value: summary.totalRevenue.toFixed(0), sub: "ödənilmiş", icon: DollarSign, color: "text-emerald-400" },
            { label: "Gözlənilən Gəlir", value: summary.pendingRevenue.toFixed(0), sub: "AZN — gözləyir", icon: TrendingUp, color: "text-yellow-400" },
            { label: "Orta Rezervasiya", value: summary.avgBookingValue.toFixed(0), sub: "AZN / rezervasiya", icon: Package, color: "text-blue-400" },
            { label: "Konversiya", value: `${summary.conversionRate}%`, sub: `${summary.paidBookings}/${summary.totalBookings} booking`, icon: Users, color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">{s.label}</span>
                <s.icon size={16} className={s.color} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Aylıq Gəlir Trendi */}
      {monthStats.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Aylıq Gəlir (AZN)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} name="Gəlir (AZN)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tur Satış Sıralaması */}
        {tourStats.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Tur Satış Sıralaması</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tourStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                <Bar dataKey="bookings" fill="#3b82f6" name="Rezervasiya" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Destinasiya Tələbatı */}
        {destStats.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Destinasiya Tələbatı (Leadlər)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={destStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                  {destStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tur Gəlir Cədvəli */}
      {tourStats.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Tur Üzrə Mühasib Hesabatı</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 pr-4 font-medium">Tur</th>
                  <th className="text-right py-2 pr-4 font-medium">Rezervasiya</th>
                  <th className="text-right py-2 pr-4 font-medium">Tələbat (Lead)</th>
                  <th className="text-right py-2 pr-4 font-medium">Gəlir (AZN)</th>
                  <th className="text-right py-2 font-medium">Orta Qiymət</th>
                </tr>
              </thead>
              <tbody>
                {tourStats.map((t, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4 text-white font-medium">{t.name}</td>
                    <td className="py-3 pr-4 text-right">
                      <span className="px-2 py-0.5 bg-blue-900/40 text-blue-400 rounded-full text-xs">{t.bookings}</span>
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-400">{t.leads}</td>
                    <td className="py-3 pr-4 text-right text-emerald-400 font-semibold">{t.revenue.toFixed(0)}</td>
                    <td className="py-3 text-right text-gray-400">
                      {t.bookings > 0 ? (t.revenue / t.bookings).toFixed(0) : "—"}
                    </td>
                  </tr>
                ))}
                {/* Yekun sətir */}
                <tr className="border-t-2 border-gray-700 font-bold">
                  <td className="py-3 pr-4 text-white">CƏMİ</td>
                  <td className="py-3 pr-4 text-right text-blue-400">{tourStats.reduce((s, t) => s + t.bookings, 0)}</td>
                  <td className="py-3 pr-4 text-right text-gray-400">{tourStats.reduce((s, t) => s + t.leads, 0)}</td>
                  <td className="py-3 pr-4 text-right text-emerald-400">{tourStats.reduce((s, t) => s + t.revenue, 0).toFixed(0)}</td>
                  <td className="py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Platform Konversiya */}
      {platformStats.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Platform Konversiya Analizi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {platformStats.map((p) => (
              <div key={p.name} className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-white capitalize">{p.name}</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">{p.value}</div>
                <div className="text-xs text-gray-500 mt-1">lead</div>
                <div className="text-sm text-emerald-400 mt-2 font-semibold">
                  {p.value > 0 ? Math.round((p.converted / p.value) * 100) : 0}% konversiya
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tourStats.length === 0 && destStats.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          Hələ kifayət qədər məlumat yoxdur. Rezervasiya və leadlər əlavə olunduqca hesabat formalaşacaq.
        </div>
      )}
    </div>
  );
}
