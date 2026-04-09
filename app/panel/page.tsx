"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Star, CreditCard, Heart, User, Plane, Clock,
  Users, DollarSign, TrendingUp, ChevronRight,
  MapPin, Calendar, ArrowUpRight, ArrowDownRight,
  Shield, Gift,
} from "lucide-react";
import { usePanelContext, TIERS } from "@/lib/panel-context";
import { getSupabase } from "@/lib/supabase";

const MOCK_TRIPS = [
  {
    id: "1",
    destination: "Antalya, Türkiyə",
    hotel: "Rixos Premium Belek",
    checkin: "2026-05-15",
    checkout: "2026-05-22",
    status: "confirmed",
    pax: 2,
    price_usd: 1840,
    image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=600&q=80",
  },
  {
    id: "2",
    destination: "Dubai, BƏƏ",
    hotel: "Atlantis The Palm",
    checkin: "2026-07-10",
    checkout: "2026-07-17",
    status: "pending",
    pax: 2,
    price_usd: 3200,
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  confirmed: { label: "Təsdiqləndi",  color: "#16a34a", bg: "#f0fdf4", dot: "#22c55e" },
  pending:   { label: "Gözlənilir",   color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  cancelled: { label: "Ləğv edildi",  color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
  completed: { label: "Tamamlandı",   color: "#6366f1", bg: "#f0f9ff", dot: "#818cf8" },
};

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" });
}

function ChangeRequestModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const { user, darkMode } = usePanelContext();
  const [type, setType]       = useState("date_change");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const d = darkMode;

  const submit = async () => {
    if (!details.trim() || !user) return;
    setLoading(true);
    await getSupabase().from("trip_change_requests").insert({
      user_id: user.id, booking_id: tripId,
      change_type: type, details, status: "pending",
    });
    setLoading(false);
    setDone(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: d ? "#0f172a" : "#fff", borderRadius: 20, padding: "28px 28px", width: "100%", maxWidth: 440, boxShadow: "0 32px 80px rgba(0,0,0,0.25)", border: `1px solid ${d ? "#1e293b" : "#f1f5f9"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: d ? "#f1f5f9" : "#0f172a" }}>Dəyişiklik Tələbi</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: d ? "#64748b" : "#94a3b8" }}>24 saat ərzində cavab veriləcək</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: d ? "#1e293b" : "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: d ? "#94a3b8" : "#64748b", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Shield size={26} color="#16a34a" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: d ? "#f1f5f9" : "#0f172a", margin: "0 0 8px" }}>Tələb göndərildi</p>
            <p style={{ color: d ? "#94a3b8" : "#64748b", fontSize: 13, margin: "0 0 20px" }}>24 saat ərzində komandamız sizinlə əlaqə saxlayacaq.</p>
            <button onClick={onClose} style={{ padding: "10px 28px", borderRadius: 10, background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Bağla</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: d ? "#64748b" : "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dəyişiklik növü</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`, background: d ? "#1e293b" : "#f8fafc", color: d ? "#e2e8f0" : "#0f172a", fontSize: 14, outline: "none" }}>
                <option value="date_change">Tarix dəyişikliyi</option>
                <option value="hotel_change">Otel dəyişikliyi</option>
                <option value="pax_change">Sərnişin sayı</option>
                <option value="cancel">Ləğvetmə</option>
                <option value="other">Digər</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: d ? "#64748b" : "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ətraflı izah</label>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4}
                placeholder="Nə dəyişdirmək istədiyinizi yazın..."
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`, background: d ? "#1e293b" : "#f8fafc", color: d ? "#e2e8f0" : "#0f172a", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <button onClick={submit} disabled={loading || !details.trim()}
              style={{ width: "100%", padding: "13px", borderRadius: 12, background: loading || !details.trim() ? "#cbd5e1" : "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", border: "none", cursor: loading || !details.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 15, transition: "all 0.2s" }}>
              {loading ? "Göndərilir..." : "Tələbi Göndər"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PanelHubPage() {
  const { profile, totalPoints, tier, nextTier, transactions, darkMode } = usePanelContext();
  const [changeModal, setChangeModal] = useState<string | null>(null);
  const d = darkMode;

  const recentTx    = transactions.slice(0, 4);
  const earnedTotal = transactions.filter((t) => t.type !== "redeem").reduce((s, t) => s + t.amount_points, 0);
  const activeTrips = MOCK_TRIPS.filter((t) => t.status !== "completed");

  const progress = nextTier
    ? Math.min(Math.round(((totalPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100), 100)
    : 100;

  const quickActions = [
    { icon: Star,   label: "Xallar & Loyallıq", sub: `${totalPoints.toLocaleString()} xal`,   href: "/panel/rewards",  accent: "#d97706", bg: "#fffbeb",  border: "#fcd34d" },
    { icon: CreditCard, label: "Cüzdan",        sub: `$${(totalPoints * 0.01).toFixed(0)} dəyər`, href: "/panel/wallet",   accent: "#0284c7", bg: "#f0f9ff",  border: "#bae6fd" },
    { icon: Heart,  label: "Arzu Siyahısı",     sub: "Seçilmiş turlar",                        href: "/panel/wishlist", accent: "#e11d48", bg: "#fff1f2",  border: "#fecdd3" },
    { icon: User,   label: "Profil",             sub: "Şəxsi məlumatlar",                       href: "/panel/profil",   accent: "#7c3aed", bg: "#f5f3ff",  border: "#ddd6fe" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {changeModal && <ChangeRequestModal tripId={changeModal} onClose={() => setChangeModal(null)} />}

      {/* ── WELCOME BANNER ── */}
      <div style={{
        borderRadius: 20, padding: "28px 32px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1e40af 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 80,  width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <div style={{ position: "absolute", top: 20,   right: 120,  width:  60, height:  60, borderRadius: "50%", background: "rgba(99,102,241,0.25)" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
              Xoş gəldiniz
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 26, color: "white", marginBottom: 4, letterSpacing: -0.5 }}>
            {profile?.full_name || "Müştəri"}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: `${tier.color}30`, border: `1px solid ${tier.color}50`, marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>{tier.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.name} Üzv</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0 }}>
            {[
              { label: "Cari Xallar",    value: totalPoints.toLocaleString(), icon: Star },
              { label: "Qazanılan",      value: earnedTotal.toLocaleString(),  icon: TrendingUp },
              { label: "Aktiv Səyahət",  value: String(activeTrips.length),    icon: Plane },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                padding: "14px 0",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                paddingLeft: i > 0 ? 20 : 0,
                paddingRight: 20,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2, fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {nextTier && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{tier.icon} {tier.name}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                  {(nextTier.minPoints - totalPoints).toLocaleString()} xal qalır → {nextTier.icon} {nextTier.name}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: `${progress}%`, background: "linear-gradient(90deg, #38bdf8, #818cf8)", transition: "width 0.8s ease" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {quickActions.map(({ icon: Icon, label, sub, href, accent, bg, border }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div style={{
              padding: "18px 16px", borderRadius: 16,
              background: d ? "#0f172a" : "#ffffff",
              border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
              transition: "all 0.2s", cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 10,
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${accent}20`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = d ? "#1e293b" : "#e2e8f0"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: d ? `${accent}18` : bg, border: `1px solid ${d ? `${accent}30` : border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={accent} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>{sub}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: accent }}>Bax</span>
                <ChevronRight size={12} color={accent} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── ACTIVE TRIPS ── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: d ? "#f1f5f9" : "#0f172a" }}>Aktiv Səyahətlər</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: d ? "#64748b" : "#94a3b8" }}>{activeTrips.length} planlaşdırılmış səyahət</p>
          </div>
          <Link href="/turlar" style={{ fontSize: 12, color: "#0284c7", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            Tur axtar <ChevronRight size={14} />
          </Link>
        </div>

        {activeTrips.length === 0 ? (
          <div style={{ borderRadius: 16, border: `1px dashed ${d ? "#1e293b" : "#e2e8f0"}`, padding: "40px 20px", textAlign: "center", background: d ? "#0f172a" : "#fafafa" }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: d ? "#1e293b" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Plane size={22} color={d ? "#64748b" : "#94a3b8"} />
            </div>
            <p style={{ color: d ? "#64748b" : "#94a3b8", fontSize: 14, margin: "0 0 12px", fontWeight: 500 }}>Aktiv səyahətiniz yoxdur</p>
            <Link href="/turlar" style={{ fontSize: 13, color: "#0284c7", textDecoration: "none", fontWeight: 600 }}>Turları kəşf edin →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MOCK_TRIPS.map((trip) => {
              const days = daysUntil(trip.checkin);
              const st   = STATUS_MAP[trip.status] || STATUS_MAP.pending;
              return (
                <div key={trip.id} style={{
                  borderRadius: 16, overflow: "hidden",
                  background: d ? "#0f172a" : "#ffffff",
                  border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
                  display: "flex",
                }}>
                  {/* Image */}
                  <div style={{ width: 110, minWidth: 110, backgroundImage: `url(${trip.image})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent, rgba(0,0,0,0.1))" }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, padding: "16px 18px", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: d ? "#f1f5f9" : "#0f172a", marginBottom: 2 }}>{trip.destination}</div>
                        <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} />
                          {trip.hotel}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: st.bg, flexShrink: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: st.color }}>{st.label}</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: d ? "#94a3b8" : "#64748b" }}>
                        <Calendar size={11} color={d ? "#64748b" : "#94a3b8"} />
                        {formatDate(trip.checkin)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: d ? "#94a3b8" : "#64748b" }}>
                        <Users size={11} color={d ? "#64748b" : "#94a3b8"} />
                        {trip.pax} nəfər
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: d ? "#94a3b8" : "#64748b" }}>
                        <DollarSign size={11} color={d ? "#64748b" : "#94a3b8"} />
                        ${trip.price_usd.toLocaleString()}
                      </div>
                      {days > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#0284c7", fontWeight: 600 }}>
                          <Clock size={11} color="#0284c7" />
                          {days} gün qaldı
                        </div>
                      )}
                    </div>

                    <button onClick={() => setChangeModal(trip.id)}
                      style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${d ? "#334155" : "#e2e8f0"}`, background: "transparent", color: d ? "#94a3b8" : "#64748b", cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#0284c7"; (e.currentTarget as HTMLElement).style.color = "#0284c7"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = d ? "#334155" : "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = d ? "#94a3b8" : "#64748b"; }}
                    >
                      Dəyişiklik tələb et
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── RECENT ACTIVITY + TIER ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>

        {/* Points Activity */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: d ? "#f1f5f9" : "#0f172a" }}>Son Əməliyyatlar</h2>
            <Link href="/panel/rewards" style={{ fontSize: 12, color: "#0284c7", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              Hamısı <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ borderRadius: 16, background: d ? "#0f172a" : "#ffffff", border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`, overflow: "hidden" }}>
            {recentTx.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: d ? "#1e293b" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Gift size={20} color={d ? "#64748b" : "#94a3b8"} />
                </div>
                <p style={{ color: d ? "#64748b" : "#94a3b8", fontSize: 13, margin: 0 }}>
                  Hələ xal əməliyyatı yoxdur.<br />İlk rezervasiyanızdan sonra xal qazanacaqsınız.
                </p>
              </div>
            ) : (
              recentTx.map((tx, i) => {
                const isEarn = tx.type !== "redeem";
                return (
                  <div key={tx.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "13px 18px",
                    borderBottom: i < recentTx.length - 1 ? `1px solid ${d ? "#1e293b" : "#f8fafc"}` : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: isEarn ? "#f0fdf4" : "#fef2f2", flexShrink: 0 }}>
                        {isEarn
                          ? <ArrowUpRight size={16} color="#16a34a" />
                          : <ArrowDownRight size={16} color="#dc2626" />
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: d ? "#e2e8f0" : "#0f172a" }}>{tx.description}</div>
                        <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8", marginTop: 1 }}>
                          {new Date(tx.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isEarn ? "#16a34a" : "#dc2626", flexShrink: 0 }}>
                      {isEarn ? "+" : "−"}{tx.amount_points.toLocaleString()} xal
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Tier Progress */}
        {nextTier && (
          <div style={{
            borderRadius: 16, padding: "20px 22px",
            background: d ? "#0f172a" : "#ffffff",
            border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a" }}>Növbəti Səviyyə</div>
                <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8", marginTop: 2 }}>
                  {(nextTier.minPoints - totalPoints).toLocaleString()} xal qalır
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20 }}>{tier.icon}</div>
                  <div style={{ fontSize: 10, color: tier.color, fontWeight: 600 }}>{tier.name}</div>
                </div>
                <div style={{ width: 20, height: 2, background: d ? "#334155" : "#e2e8f0", borderRadius: 1 }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20 }}>{nextTier.icon}</div>
                  <div style={{ fontSize: 10, color: nextTier.color, fontWeight: 600 }}>{nextTier.name}</div>
                </div>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: d ? "#1e293b" : "#f1f5f9", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, width: `${progress}%`, background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`, transition: "width 0.8s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>{totalPoints.toLocaleString()} xal</span>
              <span style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>{nextTier.minPoints.toLocaleString()} xal</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
