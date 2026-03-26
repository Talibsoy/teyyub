"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, CalendarCheck, CreditCard, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Stats {
  totalLeads: number;
  newLeads: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalCustomers: number;
}

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#f59e0b",
  confirmed: "#10b981",
  paid: "#6366f1",
  cancelled: "#ef4444",
};

const STATUS_AZ: Record<string, string> = {
  new: "Yeni",
  contacted: "Əlaqə saxlanılıb",
  confirmed: "Təsdiqlənib",
  paid: "Ödənilib",
  cancelled: "Ləğv edilib",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    newLeads: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  });
  const [bookingsByStatus, setBookingsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [leadsByPlatform, setLeadsByPlatform] = useState<{ name: string; value: number }[]>([]);
  const [recentLeads, setRecentLeads] = useState<{ id: string; name: string; platform: string; destination: string; status: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [leadsRes, bookingsRes, paymentsRes, customersRes] = await Promise.all([
      supabase.from("leads").select("id, status, platform, name, destination, created_at").order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, status, total_price"),
      supabase.from("payments").select("amount, status").eq("status", "paid"),
      supabase.from("customers").select("id", { count: "exact" }),
    ]);

    const leads = leadsRes.data || [];
    const bookings = bookingsRes.data || [];
    const payments = paymentsRes.data || [];

    // Stats
    setStats({
      totalLeads: leads.length,
      newLeads: leads.filter((l) => l.status === "new").length,
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter((b) => b.status === "confirmed" || b.status === "paid").length,
      totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalCustomers: customersRes.count || 0,
    });

    // Bookings by status
    const statusCount: Record<string, number> = {};
    bookings.forEach((b) => {
      statusCount[b.status] = (statusCount[b.status] || 0) + 1;
    });
    setBookingsByStatus(
      Object.entries(statusCount).map(([k, v]) => ({ name: STATUS_AZ[k] || k, value: v }))
    );

    // Leads by platform
    const platformCount: Record<string, number> = {};
    leads.forEach((l) => {
      platformCount[l.platform] = (platformCount[l.platform] || 0) + 1;
    });
    setLeadsByPlatform(
      Object.entries(platformCount).map(([k, v]) => ({ name: k, value: v }))
    );

    // Recent leads
    setRecentLeads(leads.slice(0, 8) as typeof recentLeads);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Yüklənir...</div>
      </div>
    );
  }

  const statCards = [
    { label: "Ümumi Leadlər", value: stats.totalLeads, sub: `${stats.newLeads} yeni`, icon: Users, color: "text-blue-400" },
    { label: "Rezervasiyalar", value: stats.totalBookings, sub: `${stats.confirmedBookings} təsdiqlənib`, icon: CalendarCheck, color: "text-emerald-400" },
    { label: "Gəlir (AZN)", value: stats.totalRevenue.toFixed(0), sub: "ödənilmiş", icon: CreditCard, color: "text-violet-400" },
    { label: "Müştərilər", value: stats.totalCustomers, sub: "ümumi", icon: TrendingUp, color: "text-orange-400" },
  ];

  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ef4444"];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{s.label}</span>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Bookings by status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Rezervasiya statusları</h3>
          {bookingsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={bookingsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {bookingsByStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">Məlumat yoxdur</div>
          )}
        </div>

        {/* Leads by platform */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Leadlər platformaya görə</h3>
          {leadsByPlatform.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leadsByPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {leadsByPlatform.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
                <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-600 text-sm">Məlumat yoxdur</div>
          )}
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Son leadlər</h3>
        {recentLeads.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Hələ lead yoxdur</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 pr-4 font-medium">Ad</th>
                  <th className="text-left py-2 pr-4 font-medium">Platform</th>
                  <th className="text-left py-2 pr-4 font-medium">Destinasiya</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-800/50">
                    <td className="py-2.5 pr-4 text-white">{lead.name || "—"}</td>
                    <td className="py-2.5 pr-4 text-gray-400 capitalize">{lead.platform}</td>
                    <td className="py-2.5 pr-4 text-gray-400">{lead.destination || "—"}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === "new" ? "bg-blue-900/50 text-blue-400" :
                        lead.status === "converted" ? "bg-emerald-900/50 text-emerald-400" :
                        lead.status === "lost" ? "bg-red-900/50 text-red-400" :
                        "bg-yellow-900/50 text-yellow-400"
                      }`}>
                        {STATUS_AZ[lead.status] || lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
