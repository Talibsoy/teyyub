"use client";
import { useState } from "react";
import { usePanelContext } from "@/lib/panel-context";

// 1 xal = $0.01 → 1000 xal = $10
const POINT_VALUE_USD = 0.01;

const MOCK_PAYMENTS = [
  { id: "p1", date: "2026-03-15", description: "Antalya – Rixos Premium", amount_usd: 1840, status: "paid", method: "Kart", points_earned: 18400 },
  { id: "p2", date: "2026-02-01", description: "Dubai – Atlantis The Palm", amount_usd: 3200, status: "paid", method: "Kart", points_earned: 32000 },
  { id: "p3", date: "2025-12-10", description: "İstanbul – Grand Hyatt", amount_usd: 950, status: "paid", method: "Xallar (950 xal)", points_earned: 9500 },
];

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  paid: { color: "#16a34a", bg: "#f0fdf4", label: "Ödənilib" },
  pending: { color: "#d97706", bg: "#fffbeb", label: "Gözlənilir" },
  refunded: { color: "#6366f1", bg: "#f0f9ff", label: "Geri qaytarılıb" },
};

function RedeemModal({ maxPoints, onClose }: { maxPoints: number; onClose: () => void }) {
  const { darkMode } = usePanelContext();
  const [amount, setAmount] = useState(1000);
  const d = darkMode;

  const maxRedeem = Math.floor(maxPoints / 1000) * 1000;
  const usdValue = (amount * POINT_VALUE_USD).toFixed(2);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: d ? "#0f172a" : "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a" }}>Xalları Xərclə</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94a3b8" }}>×</button>
        </div>
        <div style={{ background: d ? "#1e293b" : "#f8fafc", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: d ? "#94a3b8" : "#64748b", marginBottom: 4 }}>Çevirmə dərəcəsi</div>
          <div style={{ fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a" }}>1000 xal = $10.00 endirim</div>
          <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginTop: 6 }}>
            Hər sifariş üçün maks sifariş məbləğinin 3%-i qədər xal istifadə edilə bilər
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: d ? "#94a3b8" : "#475569", marginBottom: 8 }}>
            Xal miqdarı seçin (maks: {maxRedeem.toLocaleString()})
          </label>
          <input
            type="range"
            min={1000}
            max={maxRedeem || 1000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#0284c7" }}>{amount.toLocaleString()} xal</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>= ${usdValue}</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginBottom: 16 }}>
          Bu xallar növbəti rezervasiyanızda avtomatik endirim kimi tətbiq olunacaq. Menecerimiz əlaqə saxlayacaq.
        </p>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}
        >
          Tələbi Göndər — ${usdValue} endirim
        </button>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { totalPoints, tier, transactions, darkMode } = usePanelContext();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const d = darkMode;

  const cashbackUSD = (totalPoints * POINT_VALUE_USD).toFixed(2);
  const totalSpentUSD = MOCK_PAYMENTS.reduce((s, p) => s + p.amount_usd, 0);

  return (
    <div>
      {redeemOpen && <RedeemModal maxPoints={totalPoints} onClose={() => setRedeemOpen(false)} />}

      {/* Balance Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        {/* Points Balance */}
        <div style={{
          borderRadius: 18, padding: "22px 22px",
          background: "linear-gradient(135deg, #0284c7, #4f46e5)",
          color: "white",
        }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Xal Balansı</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{totalPoints.toLocaleString()}</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>≈ ${cashbackUSD} endirim dəyərindədir</div>
          <button
            onClick={() => totalPoints >= 1000 && setRedeemOpen(true)}
            disabled={totalPoints < 1000}
            style={{
              marginTop: 14, padding: "8px 16px", borderRadius: 10,
              background: totalPoints >= 1000 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white", cursor: totalPoints >= 1000 ? "pointer" : "not-allowed",
              fontSize: 12, fontWeight: 600,
            }}
          >
            {totalPoints >= 1000 ? "Xal Xərclə" : "Min. 1000 xal lazımdır"}
          </button>
        </div>

        {/* Total Spent */}
        <div style={{
          borderRadius: 18, padding: "22px 22px",
          background: d ? "#0f172a" : "#ffffff",
          border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
        }}>
          <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginBottom: 6 }}>Ümumi Xərclənən</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: d ? "#e2e8f0" : "#0f172a" }}>${totalSpentUSD.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8" }}>{MOCK_PAYMENTS.length} əməliyyat</div>
        </div>

        {/* Tier Cashback Rate */}
        <div style={{
          borderRadius: 18, padding: "22px 22px",
          background: tier.bg, border: `1px solid ${tier.border}`,
        }}>
          <div style={{ fontSize: 12, color: tier.color, opacity: 0.8, marginBottom: 6 }}>Cashback Dərəcəsi</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: tier.color }}>
            {tier.name === "Silver" ? "1%" : tier.name === "Gold" ? "2%" : "3%"}
          </div>
          <div style={{ fontSize: 12, color: tier.color, opacity: 0.75 }}>{tier.icon} {tier.name} üçün</div>
        </div>
      </div>

      {/* How to Use Points */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
          💡 Xallarınızı Necə İşlədə Bilərsiniz
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { icon: "✈️", title: "Uçuş Endirimi",  desc: "1000 xal = $10 endirim" },
            { icon: "🏨", title: "Otel Endirimi",  desc: "1000 xal = $10 endirim" },
            { icon: "🎁", title: "Paket Endirimi", desc: "Maks. sifariş məbləğinin 3%-i" },
          ].map((item) => (
            <div key={item.title} style={{
              borderRadius: 14, padding: "16px 18px",
              background: d ? "#0f172a" : "#ffffff",
              border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: d ? "#e2e8f0" : "#0f172a" }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#0284c7", fontWeight: 600 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment History */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: 0 }}>
            📄 Ödəniş Tarixçəsi
          </h2>
        </div>

        <div style={{
          borderRadius: 16,
          background: d ? "#0f172a" : "#ffffff",
          border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
          overflow: "hidden",
        }}>
          {MOCK_PAYMENTS.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
              <p style={{ color: d ? "#64748b" : "#94a3b8", fontSize: 14, margin: 0 }}>Hələ ödəniş tarixçəniz yoxdur.</p>
            </div>
          ) : (
            MOCK_PAYMENTS.map((p, i) => {
              const statusInfo = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
              return (
                <div key={p.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 18px", gap: 12,
                  borderBottom: i < MOCK_PAYMENTS.length - 1 ? `1px solid ${d ? "#1e293b" : "#f1f5f9"}` : "none",
                  flexWrap: "wrap",
                }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: d ? "#e2e8f0" : "#0f172a", marginBottom: 3 }}>
                      {p.description}
                    </div>
                    <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8" }}>
                      {new Date(p.date).toLocaleDateString("az-AZ", { year: "numeric", month: "long", day: "numeric" })}
                      {" · "}{p.method}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a" }}>
                      ${p.amount_usd.toLocaleString()}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 3 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: statusInfo.bg, color: statusInfo.color, fontWeight: 600 }}>
                        {statusInfo.label}
                      </span>
                      {p.points_earned > 0 && (
                        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>+{p.points_earned.toLocaleString()} xal</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginTop: 12, textAlign: "center" }}>
          PDF çıxarışı üçün menecerimizlə əlaqə saxlayın
        </p>
      </section>
    </div>
  );
}
