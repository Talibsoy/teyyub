"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

interface Post {
  id: string;
  country: string;
  emoji: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default function MelumatlarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Post | null>(null);

  useEffect(() => {
    getSupabase()
      .from("travel_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ background: "#0b0b0b", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "40px 24px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Səyahət Dünyası
          </p>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: 0 }}>
            Turizm Məlumatları ✈️
          </h1>
          <p style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
            Hər gün yeni ölkə, yeni kəşf — Natoure ekspertlərindən
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#555", padding: "60px 0" }}>Yüklənir...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", color: "#555", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
            <p>Hələ məlumat yoxdur. Tezliklə əlavə ediləcək.</p>
          </div>
        ) : selected ? (
          /* Detail view */
          <div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: "none", border: "1px solid #2a2a2a", color: "#888",
                borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                fontSize: 13, marginBottom: 24,
              }}
            >
              ← Geri
            </button>
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, overflow: "hidden" }}>
              {selected.image_url && (
                <img src={selected.image_url} alt={selected.country}
                  style={{ width: "100%", height: 280, objectFit: "cover" }} />
              )}
              <div style={{ padding: "28px 28px 32px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{selected.emoji}</div>
                <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                  {selected.country}
                </span>
                <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "8px 0 20px" }}>
                  {selected.title}
                </h2>
                <div style={{ color: "#aaa", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                  {selected.content}
                </div>
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #1a1a1a" }}>
                  <p style={{ color: "#555", fontSize: 12, marginBottom: 12 }}>
                    {new Date(selected.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <a
                    href={`https://wa.me/994517769632?text=${encodeURIComponent(`Salam, ${selected.country} turu haqqında məlumat almaq istəyirəm`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "#25D366", color: "#fff", borderRadius: 10,
                      padding: "12px 24px", fontWeight: 700, fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    💬 {selected.country} turu üçün təklif al
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Grid view */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {posts.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  background: "#111", border: "1px solid #1a1a1a", borderRadius: 14,
                  overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#D4AF37")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a1a")}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.country}
                    style={{ width: "100%", height: 160, objectFit: "cover" }} />
                ) : (
                  <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, background: "#0d0d0d" }}>
                    {p.emoji}
                  </div>
                )}
                <div style={{ padding: "16px 18px" }}>
                  <span style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                    {p.emoji} {p.country}
                  </span>
                  <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: "6px 0 10px", lineHeight: 1.4 }}>
                    {p.title}
                  </h3>
                  <p style={{ color: "#666", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    {p.content.slice(0, 100)}...
                  </p>
                  <p style={{ color: "#444", fontSize: 11, marginTop: 12 }}>
                    {new Date(p.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "long" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
