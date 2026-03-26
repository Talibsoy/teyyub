"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity } from "lucide-react";

interface Log {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: Record<string, string> | null;
  new_value: Record<string, string> | null;
  created_at: string;
  staff: { full_name: string } | null;
}

const ENTITY_AZ: Record<string, string> = {
  lead: "Lead",
  booking: "Rezervasiya",
  customer: "Müştəri",
  payment: "Ödəniş",
  tour: "Tur",
};

const ACTION_AZ: Record<string, string> = {
  status_changed: "status dəyişdi",
  created: "yaradıldı",
  updated: "yeniləndi",
};

const STATUS_AZ: Record<string, string> = {
  new: "Yeni",
  contacted: "Əlaqə saxlanılıb",
  confirmed: "Təsdiqlənib",
  paid: "Ödənilib",
  cancelled: "Ləğv edilib",
  converted: "Çevrildi",
  lost: "İtirildi",
};

const ENTITY_COLOR: Record<string, string> = {
  lead: "bg-blue-900/50 text-blue-400",
  booking: "bg-emerald-900/50 text-emerald-400",
  customer: "bg-violet-900/50 text-violet-400",
  payment: "bg-yellow-900/50 text-yellow-400",
  tour: "bg-orange-900/50 text-orange-400",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, []);

  async function loadLogs() {
    const { data } = await supabase
      .from("activity_logs")
      .select("*, staff(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  }

  function formatTime(d: string) {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff} saniyə əvvəl`;
    if (diff < 3600) return `${Math.floor(diff / 60)} dəqiqə əvvəl`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
    return date.toLocaleDateString("az-AZ", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
  }

  function describeAction(log: Log) {
    if (log.action === "status_changed" && log.old_value && log.new_value) {
      const from = STATUS_AZ[log.old_value.status] || log.old_value.status;
      const to = STATUS_AZ[log.new_value.status] || log.new_value.status;
      return (
        <span>
          <span className="text-gray-400">{from}</span>
          {" → "}
          <span className="text-white font-medium">{to}</span>
        </span>
      );
    }
    return <span className="text-gray-400">{ACTION_AZ[log.action] || log.action}</span>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Fəaliyyət Loqu</h2>
        <span className="text-sm text-gray-500">{logs.length} qeyd</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Yüklənir...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-600">
            <Activity size={32} />
            <span>Hələ heç bir fəaliyyət yoxdur</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                {/* Entity badge */}
                <span className={`mt-0.5 shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${ENTITY_COLOR[log.entity_type] || "bg-gray-800 text-gray-400"}`}>
                  {ENTITY_AZ[log.entity_type] || log.entity_type}
                </span>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="text-white font-medium">
                      {log.staff?.full_name || "Sistem"}
                    </span>
                    {" "}
                    {describeAction(log)}
                  </div>
                  <div className="text-xs text-gray-600 font-mono mt-0.5 truncate">
                    ID: {log.entity_id}
                  </div>
                </div>

                {/* Time */}
                <span className="shrink-0 text-xs text-gray-500 whitespace-nowrap">
                  {formatTime(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
