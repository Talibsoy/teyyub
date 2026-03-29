"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { Check, X, Star } from "lucide-react";

interface Review {
  id: string;
  name: string;
  destination: string | null;
  rating: number;
  message: string;
  image_urls?: string[];
  is_approved: boolean;
  created_at: string;
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#D4AF37", letterSpacing: 1 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let q = supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false });
    if (filter === "pending")  q = q.eq("is_approved", false);
    if (filter === "approved") q = q.eq("is_approved", true);
    const { data } = await q;
    setReviews(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function approve(id: string) {
    await supabaseAdmin.from("reviews").update({ is_approved: true }).eq("id", id);
    load();
  }

  async function reject(id: string) {
    if (!confirm("Bu rəyi silmək istəyirsiniz?")) return;
    await supabaseAdmin.from("reviews").delete().eq("id", id);
    load();
  }

  const counts = {
    all: undefined,
    pending: reviews.filter(r => !r.is_approved).length,
    approved: reviews.filter(r => r.is_approved).length,
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900 }}>
      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Müştəri Rəyləri</h1>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
        Gözləyən rəyləri təsdiq edin və ya silin
      </p>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["pending", "approved", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? "#D4AF37" : "#1a1a1a",
              color: filter === f ? "#0b0b0b" : "#aaa",
              border: "1px solid " + (filter === f ? "#D4AF37" : "#2a2a2a"),
              borderRadius: 8, padding: "7px 16px", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            {f === "pending" ? "Gözləyən" : f === "approved" ? "Təsdiqlənmiş" : "Hamısı"}
            {f !== "all" && counts[f] !== undefined && (
              <span style={{
                marginLeft: 6, background: filter === f ? "#0b0b0b33" : "#2a2a2a",
                borderRadius: 99, padding: "1px 7px", fontSize: 11,
              }}>{counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#555", padding: "40px 0", textAlign: "center" }}>Yüklənir...</div>
      ) : reviews.length === 0 ? (
        <div style={{
          background: "#111", border: "1px solid #1a1a1a", borderRadius: 12,
          padding: "48px 32px", textAlign: "center", color: "#555",
        }}>
          <Star size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>Heç bir rəy yoxdur</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map(r => (
            <div key={r.id} style={{
              background: "#111", border: "1px solid",
              borderColor: r.is_approved ? "#1a2a1a" : "#1a1a1a",
              borderRadius: 12, padding: "18px 20px",
              display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              {/* Left */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                  {r.destination && (
                    <span style={{ color: "#555", fontSize: 12 }}>· {r.destination}</span>
                  )}
                  <Stars n={r.rating} />
                  {r.is_approved && (
                    <span style={{
                      background: "#0d1a0d", color: "#25D366",
                      borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 600,
                    }}>Saytda göstərilir</span>
                  )}
                </div>
                <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
                  {r.message}
                </p>
                {r.image_urls && r.image_urls.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {r.image_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" style={{
                          width: 64, height: 64, objectFit: "cover",
                          borderRadius: 6, border: "1px solid #2a2a2a",
                        }} />
                      </a>
                    ))}
                  </div>
                )}
                <span style={{ color: "#444", fontSize: 11 }}>
                  {new Date(r.created_at).toLocaleString("az-AZ")}
                </span>
              </div>

              {/* Actions */}
              {!r.is_approved && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => approve(r.id)}
                    title="Təsdiqlə"
                    style={{
                      background: "#0d1a0d", border: "1px solid #25D366",
                      color: "#25D366", borderRadius: 8, padding: "8px 14px",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      fontSize: 12, fontWeight: 600,
                    }}
                  >
                    <Check size={14} /> Təsdiqlə
                  </button>
                  <button
                    onClick={() => reject(r.id)}
                    title="Sil"
                    style={{
                      background: "#1a0a0a", border: "1px solid #c0392b",
                      color: "#e74c3c", borderRadius: 8, padding: "8px 14px",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                      fontSize: 12, fontWeight: 600,
                    }}
                  >
                    <X size={14} /> Sil
                  </button>
                </div>
              )}
              {r.is_approved && (
                <button
                  onClick={() => reject(r.id)}
                  title="Saytdan çıxar"
                  style={{
                    background: "#1a1a1a", border: "1px solid #2a2a2a",
                    color: "#666", borderRadius: 8, padding: "8px 12px",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
