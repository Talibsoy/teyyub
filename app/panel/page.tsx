"use client";
import { useState } from "react";
import Link from "next/link";
import { usePanelContext, TIERS } from "@/lib/panel-context";
import { getSupabase } from "@/lib/supabase";

// Mock active trips — replace with real Supabase query when bookings table exists
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
    image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400&q=80",
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
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80",
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Təsdiqləndi", color: "#16a34a", bg: "#f0fdf4" },
  pending: { label: "Gözlənilir", color: "#d97706", bg: "#fffbeb" },
  cancelled: { label: "Ləğv edildi", color: "#dc2626", bg: "#fef2f2" },
  completed: { label: "Tamamlandı", color: "#6366f1", bg: "#f0f9ff" },
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ChangeRequestModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const { user, darkMode } = usePanelContext();
  const [type, setType] = useState("date_change");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const d = darkMode;

  const submit = async () => {
    if (!details.trim() || !user) return;
    setLoading(true);
    const supabase = getSupabase();
    await supabase.from("trip_change_requests").insert({
      user_id: user.id,
      booking_id: tripId,
      change_type: type,
      details,
      status: "pending",
    });
    setLoading(false);
    setDone(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: d ? "#0f172a" : "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a" }}>Dəyişiklik Tələbi</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94a3b8" }}>×</button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: d ? "#94a3b8" : "#475569", fontSize: 14 }}>Tələbiniz göndərildi. 24 saat ərzində əlaqə saxlayacağıq.</p>
            <button onClick={onClose} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Bağla</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: d ? "#94a3b8" : "#475569", marginBottom: 6 }}>Dəyişiklik növü</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`, background: d ? "#1e293b" : "#f8fafc", color: d ? "#e2e8f0" : "#0f172a", fontSize: 14, outline: "none" }}
              >
                <option value="date_change">Tarix dəyişikliyi</option>
                <option value="hotel_change">Otel dəyişikliyi</option>
                <option value="pax_change">Sərnişin sayı dəyişikliyi</option>
                <option value="cancel">Ləğvetmə</option>
                <option value="other">Digər</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: d ? "#94a3b8" : "#475569", marginBottom: 6 }}>Ətraflı izah</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Nə dəyişdirmək istədiyinizi izah edin..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`, background: d ? "#1e293b" : "#f8fafc", color: d ? "#e2e8f0" : "#0f172a", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={submit}
              disabled={loading || !details.trim()}
              style={{ width: "100%", padding: "12px", borderRadius: 12, background: loading || !details.trim() ? "#94a3b8" : "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", border: "none", cursor: loading || !details.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 15 }}
            >
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

  const recentTx = transactions.slice(0, 5);
  const earnedTotal = transactions.filter((t) => t.type !== "redeem").reduce((s, t) => s + t.amount_points, 0);

  return (
    <div>
      {changeModal && <ChangeRequestModal tripId={changeModal} onClose={() => setChangeModal(null)} />}

      {/* Welcome Banner */}
      <div style={{
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        background: "linear-gradient(135deg, #0284c7, #4f46e5)",
        color: "white", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, right: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative" }}>
          <p style={{ margin: "0 0 4px", fontSize: 14, opacity: 0.85 }}>Xoş gəldiniz,</p>
          <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800 }}>
            {profile?.full_name || "Müştəri"} {tier.icon}
          </h1>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totalPoints.toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Cari xallar</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{earnedTotal.toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Ümumi qazanılan</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{MOCK_TRIPS.filter((t) => t.status !== "completed").length}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Aktiv səyahət</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { icon: "⭐", label: "Xallar", href: "/panel/rewards", color: "#d97706" },
          { icon: "💳", label: "Cüzdan", href: "/panel/wallet", color: "#0284c7" },
          { icon: "❤️", label: "Arzu Siyahısı", href: "/panel/wishlist", color: "#e11d48" },
          { icon: "👤", label: "Profil", href: "/panel/profil", color: "#7c3aed" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "18px 12px", borderRadius: 16,
              background: d ? "#0f172a" : "#ffffff",
              border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
              textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: d ? "#94a3b8" : "#475569" }}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Active Trips */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
          ✈️ Aktiv Səyahətlər
        </h2>
        {MOCK_TRIPS.length === 0 ? (
          <div style={{ borderRadius: 16, border: `1px dashed ${d ? "#1e293b" : "#e2e8f0"}`, padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🧳</div>
            <p style={{ color: d ? "#64748b" : "#94a3b8", fontSize: 14 }}>Aktiv səyahətiniz yoxdur</p>
            <Link href="/turlar" style={{ color: "#0284c7", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Turları kəşf et →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {MOCK_TRIPS.map((trip) => {
              const days = daysUntil(trip.checkin);
              const statusInfo = STATUS_MAP[trip.status] || STATUS_MAP.pending;
              return (
                <div key={trip.id} style={{
                  borderRadius: 16, overflow: "hidden",
                  background: d ? "#0f172a" : "#ffffff",
                  border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  display: "flex", flexDirection: "row",
                }}>
                  <div style={{ width: 100, minWidth: 100, backgroundImage: `url(${trip.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div style={{ flex: 1, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: d ? "#e2e8f0" : "#0f172a" }}>{trip.destination}</div>
                        <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8" }}>{trip.hotel}</div>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: statusInfo.bg, color: statusInfo.color, whiteSpace: "nowrap" }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginBottom: 10, flexWrap: "wrap" }}>
                      <span>📅 {trip.checkin} → {trip.checkout}</span>
                      <span>👥 {trip.pax} nəfər</span>
                      <span>💰 ${trip.price_usd.toLocaleString()}</span>
                      {days > 0 && <span style={{ color: "#0284c7", fontWeight: 600 }}>⏳ {days} gün qaldı</span>}
                    </div>
                    <button
                      onClick={() => setChangeModal(trip.id)}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
                        background: "transparent", color: d ? "#94a3b8" : "#475569",
                        cursor: "pointer",
                      }}
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

      {/* Recent Points Activity */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: 0 }}>
            ⭐ Son Xal Hərəkətləri
          </h2>
          <Link href="/panel/rewards" style={{ fontSize: 13, color: "#0284c7", textDecoration: "none", fontWeight: 600 }}>Hamısına bax →</Link>
        </div>

        <div style={{ borderRadius: 16, background: d ? "#0f172a" : "#ffffff", border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`, overflow: "hidden" }}>
          {recentTx.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ color: d ? "#64748b" : "#94a3b8", fontSize: 14, margin: 0 }}>
                Hələ heç bir xal əməliyyatı yoxdur. İlk rezervasiyanızdan sonra xal qazanacaqsınız!
              </p>
            </div>
          ) : (
            recentTx.map((tx, i) => (
              <div key={tx.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 18px",
                borderBottom: i < recentTx.length - 1 ? `1px solid ${d ? "#1e293b" : "#f1f5f9"}` : "none",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: d ? "#e2e8f0" : "#0f172a" }}>{tx.description}</div>
                  <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>
                    {new Date(tx.created_at).toLocaleDateString("az-AZ")}
                  </div>
                </div>
                <div style={{
                  fontWeight: 700, fontSize: 14,
                  color: tx.type === "redeem" ? "#dc2626" : "#16a34a",
                }}>
                  {tx.type === "redeem" ? "-" : "+"}{tx.amount_points} xal
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tier Progress Card */}
        {nextTier && (
          <div style={{
            marginTop: 16, borderRadius: 16, padding: "18px 20px",
            background: tier.bg, border: `1px solid ${tier.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: tier.color }}>
                {tier.icon} {tier.name} → {nextTier.icon} {nextTier.name}
              </span>
              <span style={{ fontSize: 12, color: tier.color, fontWeight: 600 }}>
                {totalPoints.toLocaleString()} / {nextTier.minPoints.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                width: `${Math.min(((totalPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100, 100)}%`,
                transition: "width 0.6s ease",
              }} />
            </div>
            <p style={{ fontSize: 12, color: tier.color, margin: "8px 0 0", opacity: 0.8 }}>
              {nextTier.name} səviyyəsinə çatmaq üçün daha {(nextTier.minPoints - totalPoints).toLocaleString()} xal lazımdır
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
