"use client";

import { useEffect, useState } from "react";
import ReviewForm from "./ReviewForm";
import { getSupabase } from "@/lib/supabase";

interface Review {
  id: string;
  name: string;
  destination: string | null;
  rating: number;
  message: string;
  image_urls?: string[];
  created_at: string;
}

// Fallback static reviews if DB is empty
const STATIC = [
  { id: "s1", name: "Aytən X.",  destination: "Dubai",   rating: 5, message: "Hər şey mükəmməl idi — otel, transfer, ekskursiyalar. Natoure komandası 24/7 əlaqədə idi.", created_at: "" },
  { id: "s2", name: "Müşfiq A.", destination: "Türkiyə", rating: 5, message: "İlk dəfə xarici turda idim, heç problem yaşamadım. Çox professional yanaşdılar.",          created_at: "" },
  { id: "s3", name: "Leyla M.",  destination: "Misir",   rating: 5, message: "Qiymət-keyfiyyət nisbəti əla idi. Ailə ilə getdik, hamı razı qaldı.",                       created_at: "" },
];

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? "#D4AF37" : "#333", fontSize: 16 }}>★</span>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    try {
      const { data } = await getSupabase()
        .from("reviews")
        .select("id, name, destination, rating, message, image_urls, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setReviews(data && data.length > 0 ? data : STATIC);
    } catch {
      setReviews(STATIC);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="px-4 py-12 md:py-16 md:px-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Müştərilərimiz Nə Deyir?</h2>
            <p className="text-sm" style={{ color: "#666" }}>Real müştərilərin rəyləri</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              background: showForm ? "#1a1a1a" : "#D4AF37",
              color: showForm ? "#fff" : "#0b0b0b",
              border: showForm ? "1px solid #333" : "none",
              borderRadius: 10, padding: "10px 20px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            {showForm ? "✕ Bağla" : "✍️ Rəy Yaz"}
          </button>
        </div>

        {/* Form (toggleable) */}
        {showForm && (
          <div style={{ marginBottom: 32, maxWidth: 560 }}>
            <ReviewForm onSuccess={() => { setShowForm(false); load(); }} />
          </div>
        )}

        {/* Reviews grid */}
        {!loaded ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#555" }}>Yüklənir...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl" style={{ background: "#111", border: "1px solid #1a1a1a", overflow: "hidden" }}>
                {/* Images */}
                {r.image_urls && r.image_urls.length > 0 && (
                  <div style={{ display: "flex", gap: 2, height: 140 }}>
                    {r.image_urls.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt=""
                        style={{
                          flex: 1, objectFit: "cover", minWidth: 0,
                          borderRadius: i === 0 && r.image_urls!.length === 1 ? "0" : "0",
                        }} />
                    ))}
                  </div>
                )}
                <div className="p-5">
                  <Stars n={r.rating} />
                  <p className="my-3 text-sm leading-relaxed" style={{ color: "#aaa" }}>
                    &ldquo;{r.message}&rdquo;
                  </p>
                  <div className="font-semibold text-white text-sm">{r.name}</div>
                  {r.destination && (
                    <div className="text-xs mt-0.5" style={{ color: "#555" }}>{r.destination} səfəri</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
