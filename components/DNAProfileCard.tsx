"use client";
import { useEffect, useState } from "react";

export interface DNAScores {
  adventure: number;
  cultural:  number;
  comfort:   number;
  social:    number;
  budget:    number;
}

const BARS = [
  { key: "adventure" as const, label: "Macəra" },
  { key: "cultural"  as const, label: "Mədəniyyət" },
  { key: "comfort"   as const, label: "Rahatlıq" },
  { key: "social"    as const, label: "Sosiallik" },
  { key: "budget"    as const, label: "Büdcə" },
];

function toPercent(raw: number): number {
  return Math.min(99, Math.max(15, Math.round((raw + 0.5) / 1.5 * 100)));
}

export function parseDNAScores(raw: Record<string, number>): DNAScores {
  return {
    adventure: toPercent(raw.pref_adventure_level  ?? 0.2),
    cultural:  toPercent(raw.pref_cultural_depth   ?? 0.1),
    comfort:   toPercent(raw.pref_comfort_priority  ?? 0.3),
    social:    toPercent((raw.pref_social_atmosphere ?? 0) + 0.3),
    budget:    toPercent(raw.pref_budget_sensitivity ?? 0.2),
  };
}

export default function DNAProfileCard({ archetypeName }: { archetypeName?: string }) {
  const [scores, setScores] = useState<DNAScores | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("nf_dna_scores");
    if (raw) {
      try { setScores(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setTimeout(() => setVisible(true), 100);
  }, []);

  if (!scores) return null;

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: 20,
      padding: "24px 28px",
      width: "100%",
      maxWidth: 400,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      <p style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 14px", fontWeight: 600 }}>
        TRAVEL DNA — PSİXOMETRİK PROFİL
      </p>

      {archetypeName && (
        <h3 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: "0 0 20px", lineHeight: 1.2 }}>
          {archetypeName.split(" ").map((word, i) => (
            i === 1
              ? <em key={i} style={{ fontStyle: "italic", color: "#60a5fa" }}> {word}</em>
              : <span key={i}>{word}</span>
          ))}
        </h3>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BARS.map(b => (
          <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 80, fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${scores[b.key]}%`,
                background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                borderRadius: 4,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            <span style={{ width: 36, fontSize: 12, color: "#94a3b8", textAlign: "right" }}>{scores[b.key]}%</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 18,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#1e3a5f",
        borderRadius: 20,
        padding: "6px 14px",
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
        <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600, letterSpacing: 1 }}>OCEAN + Plog modeli</span>
      </div>
    </div>
  );
}
