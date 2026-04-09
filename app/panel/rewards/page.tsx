"use client";
import { useState } from "react";
import { usePanelContext, TIERS } from "@/lib/panel-context";

export default function RewardsPage() {
  const { totalPoints, tier, nextTier, transactions, profile, darkMode } = usePanelContext();
  const [copiedRef, setCopiedRef] = useState(false);
  const d = darkMode;

  const referralLink = profile?.referral_code
    ? `https://natourefly.com/?ref=${profile.referral_code}`
    : null;

  const copyRef = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const earnTx    = transactions.filter((t) => t.type !== "redeem");
  const redeemTx  = transactions.filter((t) => t.type === "redeem");
  const totalEarned   = earnTx.reduce((s, t) => s + t.amount_points, 0);
  const totalRedeemed = redeemTx.reduce((s, t) => s + t.amount_points, 0);

  // Növbəti tier üçün neçə xal lazımdır
  const pointsToNext = nextTier ? nextTier.minPoints - totalPoints : 0;

  return (
    <div>
      {/* Points Overview */}
      <div style={{
        borderRadius: 20, padding: "24px 28px", marginBottom: 24,
        background: `linear-gradient(135deg, ${tier.color}20, ${tier.color}08)`,
        border: `1px solid ${tier.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 36 }}>{tier.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: tier.color }}>{tier.name} Üzv</div>
            <div style={{ fontSize: 13, color: d ? "#94a3b8" : "#64748b" }}>Natoure Loyallıq Proqramı</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: nextTier ? 16 : 0 }}>
          {[
            { label: "Cari Xallar",  value: totalPoints.toLocaleString(),   color: tier.color },
            { label: "Qazanılan",    value: totalEarned.toLocaleString(),    color: "#16a34a" },
            { label: "Xərclənən",    value: totalRedeemed.toLocaleString(),  color: "#dc2626" },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>{item.label}</div>
            </div>
          ))}
        </div>
        {nextTier && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: d ? "#94a3b8" : "#64748b" }}>{tier.name}</span>
              <span style={{ fontSize: 12, color: nextTier.color, fontWeight: 600 }}>
                {nextTier.icon} {nextTier.name} — {pointsToNext.toLocaleString()} xal qalıb
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: d ? "#1e293b" : "#e2e8f0", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                width: `${Math.min(100, (totalPoints / nextTier.minPoints) * 100)}%`,
                transition: "width 0.5s",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Tier Levels */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
          🏆 Status Səviyyələri
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TIERS.map((t_info) => {
            const isCurrent  = t_info.name === tier.name;
            const isAchieved = totalPoints >= t_info.minPoints;
            return (
              <div key={t_info.name} style={{
                borderRadius: 16, padding: "16px 20px",
                background: isCurrent ? t_info.bg : d ? "#0f172a" : "#ffffff",
                border: `${isCurrent ? "2px" : "1px"} solid ${isCurrent ? t_info.border : d ? "#1e293b" : "#e2e8f0"}`,
                opacity: isAchieved ? 1 : 0.6,
                boxShadow: isCurrent ? `0 4px 20px ${t_info.color}20` : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{t_info.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: isCurrent ? t_info.color : d ? "#e2e8f0" : "#0f172a" }}>
                        {t_info.name}
                        {isCurrent && <span style={{ fontSize: 11, marginLeft: 8, background: t_info.color, color: "white", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Aktiv</span>}
                      </div>
                      <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8" }}>
                        {t_info.maxPoints
                          ? `${t_info.minPoints.toLocaleString()} – ${t_info.maxPoints.toLocaleString()} xal`
                          : `${t_info.minPoints.toLocaleString()}+ xal`}
                      </div>
                    </div>
                  </div>
                  {isAchieved && !isCurrent && <span style={{ fontSize: 18 }}>✅</span>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {t_info.perks.map((perk) => (
                    <span key={perk} style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 20,
                      background: isCurrent ? `${t_info.color}18` : d ? "#1e293b" : "#f1f5f9",
                      color: isCurrent ? t_info.color : d ? "#94a3b8" : "#475569",
                      fontWeight: 500,
                    }}>
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Earn Points Guide */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
          💡 Xal Qazanma Yolları
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            {
              icon: "✈️",
              title: "Rezervasiya",
              desc: "Hər $1 ödəniş üçün 1 xal",
              detail: "1000 xal = $10 endirim dəyərindədir",
              tag: "Əsas",
            },
            {
              icon: "👥",
              title: "Referral",
              desc: "Aldığının 3%-i qədər xal",
              detail: "Dəvət olunan ilk $100+ alış etdikdə. Aylıq maks 10 referral",
              tag: "Bonus",
            },
            {
              icon: "⭐",
              title: "Rəy yaz",
              desc: "500 xal",
              detail: "Yalnız real (verified) sifarişə bağlı rəy. Hər sifariş üçün 1 dəfə",
              tag: "Bonus",
            },
            {
              icon: "🎂",
              title: "Doğum günü",
              desc: "1000 xal",
              detail: "Hər il doğum gününüzdə avtomatik. Ildə 1 dəfə",
              tag: "Hədiyyə",
            },
          ].map((item) => (
            <div key={item.title} style={{
              borderRadius: 14, padding: "16px 18px",
              background: d ? "#0f172a" : "#ffffff",
              border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#f0f9ff", color: "#0284c7", fontWeight: 700 }}>
                  {item.tag}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: d ? "#e2e8f0" : "#0f172a", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "#0284c7", fontWeight: 600, marginBottom: 3 }}>{item.desc}</div>
              <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Loyalty Usage Rules */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
          📋 Xal İstifadə Qaydaları
        </h2>
        <div style={{
          borderRadius: 16, padding: "20px 22px",
          background: d ? "#0f172a" : "#ffffff",
          border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            {[
              { label: "$100 sifariş", max: "$3 (300 xal)" },
              { label: "$500 sifariş", max: "$15 (1500 xal)" },
              { label: "$1000 sifariş", max: "$30 (3000 xal)" },
              { label: "$2000 sifariş", max: "$60 (6000 xal)" },
            ].map((ex) => (
              <div key={ex.label} style={{
                padding: "12px 14px", borderRadius: 12,
                background: d ? "#1e293b" : "#f8fafc",
                border: `1px solid ${d ? "#334155" : "#e2e8f0"}`,
              }}>
                <div style={{ fontSize: 12, color: d ? "#64748b" : "#94a3b8", marginBottom: 4 }}>{ex.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0284c7" }}>Maks: {ex.max}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Hər sifariş məbləğinin maksimum 3%-i qədər xal istifadə edilə bilər",
              "Xallar yalnız platform daxilində istifadə edilir — nağd pula çevrilmir",
              "İstifadə edilmədikdə xallar 12 ay sonra silinir",
              "Ləğv edilmiş və refund olunmuş sifarişlər üçün xal verilmir / geri alınır",
              "Yalnız təsdiqlənmiş (email + telefon) hesablar xal qazana bilər",
            ].map((rule) => (
              <div key={rule} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#0284c7", fontSize: 14, flexShrink: 0, marginTop: 1 }}>•</span>
                <span style={{ fontSize: 13, color: d ? "#94a3b8" : "#475569" }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
          🔗 Referral Linkiniz
        </h2>
        <div style={{
          borderRadius: 16, padding: "20px 22px",
          background: d ? "#0f172a" : "#ffffff",
          border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
        }}>
          <p style={{ fontSize: 13, color: d ? "#94a3b8" : "#475569", margin: "0 0 14px", lineHeight: 1.7 }}>
            Dostunuzu Natoure-ya dəvət edin. O ilk <strong style={{ color: "#0284c7" }}>$100+</strong> rezervasiya etdikdə:<br />
            • <strong style={{ color: "#16a34a" }}>Siz</strong> — alış məbləğinin <strong style={{ color: "#16a34a" }}>3%-i</strong> qədər xal qazanırsınız<br />
            • <strong style={{ color: "#0284c7" }}>Dostunuz</strong> — <strong style={{ color: "#0284c7" }}>500 xal</strong> bonus qazanır
          </p>
          {referralLink ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{
                flex: 1, padding: "11px 14px", borderRadius: 10, fontSize: 13,
                background: d ? "#1e293b" : "#f8fafc",
                border: `1px solid ${d ? "#334155" : "#e2e8f0"}`,
                color: d ? "#94a3b8" : "#475569",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {referralLink}
              </div>
              <button onClick={copyRef} style={{
                padding: "11px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: copiedRef ? "#16a34a" : "linear-gradient(135deg, #0284c7, #4f46e5)",
                color: "white", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}>
                {copiedRef ? "✓ Kopyalandı" : "Kopyala"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: d ? "#64748b" : "#94a3b8", margin: 0 }}>
              Referral kodu yaratmaq üçün profilinizi doldurun.
            </p>
          )}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: d ? "#e2e8f0" : "#0f172a", margin: "0 0 14px" }}>
          📋 Xal Tarixçəsi
        </h2>
        <div style={{
          borderRadius: 16,
          background: d ? "#0f172a" : "#ffffff",
          border: `1px solid ${d ? "#1e293b" : "#e2e8f0"}`,
          overflow: "hidden",
        }}>
          {transactions.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⭐</div>
              <p style={{ color: d ? "#64748b" : "#94a3b8", fontSize: 14, margin: 0 }}>
                Hələ xal əməliyyatı yoxdur.<br />İlk rezervasiyanızdan sonra xal qazanmağa başlayacaqsınız.
              </p>
            </div>
          ) : (
            transactions.map((tx, i) => {
              const typeIcons: Record<string, string> = {
                earn: "⬆️", redeem: "⬇️", bonus: "🎁", referral: "👥",
              };
              return (
                <div key={tx.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "13px 18px",
                  borderBottom: i < transactions.length - 1 ? `1px solid ${d ? "#1e293b" : "#f1f5f9"}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{typeIcons[tx.type] || "⭐"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: d ? "#e2e8f0" : "#0f172a" }}>{tx.description}</div>
                      <div style={{ fontSize: 11, color: d ? "#64748b" : "#94a3b8" }}>
                        {new Date(tx.created_at).toLocaleDateString("az-AZ", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: tx.type === "redeem" ? "#dc2626" : "#16a34a" }}>
                    {tx.type === "redeem" ? "−" : "+"}{tx.amount_points.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
