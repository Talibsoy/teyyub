"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Plane, MessageCircle } from "lucide-react";

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
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", padding: "40px 24px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ color: "#0284c7", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Səyahət Dünyası
          </p>
          <h1 style={{ color: "#1e40af", fontSize: 32, fontWeight: 800, margin: 0 }}>
            Turizm Məlumatları
          </h1>
          <p style={{ color: "#475569", fontSize: 14, marginTop: 8 }}>
            Hər gün yeni ölkə, yeni kəşf — Natoure ekspertlərindən
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "60px 0" }}>Yüklənir...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "60px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <Plane size={40} color="#94a3b8" />
            </div>
            <p>Hələ məlumat yoxdur. Tezliklə əlavə ediləcək.</p>
          </div>
        ) : selected ? (
          /* Detail view */
          <div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: "none", border: "1px solid #e2e8f0", color: "#64748b",
                borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                fontSize: 13, marginBottom: 24,
              }}
            >
              ← Geri
            </button>
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
              {selected.image_url && (
                <img src={selected.image_url} alt={selected.country}
                  style={{ width: "100%", height: 280, objectFit: "cover" }} />
              )}
              <div style={{ padding: "28px 28px 32px" }}>
                <span style={{ color: "#0284c7", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                  {selected.country}
                </span>
                <h2 style={{ color: "#0f172a", fontSize: 22, fontWeight: 700, margin: "8px 0 20px" }}>
                  {selected.title}
                </h2>
                <div style={{ color: "#64748b", fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                  {selected.content}
                </div>
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
                  <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
                    {new Date(selected.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <a
                    href={`https://wa.me/994517769632?text=${encodeURIComponent(`Salam, ${selected.country} turu haqqında məlumat almaq istəyirəm`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "#25D366", borderRadius: 10,
                      padding: "12px 24px", fontWeight: 700, fontSize: 14,
                      textDecoration: "none", color: "white",
                    }}
                  >
                    <MessageCircle size={16} />
                    {selected.country} turu üçün təklif al
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Grid view */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {posts.map((p) => (
              <a
                key={p.id}
                href={`/melumatlar/${p.id}`}
                style={{
                  background: "white", border: "1px solid #e2e8f0", borderRadius: 14,
                  overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s, box-shadow 0.2s",
                  textDecoration: "none", display: "block",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#0284c7";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(2,132,199,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.country}
                    style={{ width: "100%", height: 160, objectFit: "cover" }} />
                ) : (
                  <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
                    <Plane size={40} color="#94a3b8" />
                  </div>
                )}
                <div style={{ padding: "16px 18px" }}>
                  <span style={{ color: "#0284c7", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                    {p.country}
                  </span>
                  <h3 style={{ color: "#0f172a", fontSize: 15, fontWeight: 600, margin: "6px 0 10px", lineHeight: 1.4 }}>
                    {p.title}
                  </h3>
                  <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    {p.content.slice(0, 100)}...
                  </p>
                  <p style={{ color: "#64748b", fontSize: 11, marginTop: 12 }}>
                    {new Date(p.created_at).toLocaleDateString("az-AZ", { day: "numeric", month: "long" })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
