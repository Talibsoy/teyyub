"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { waLink } from "@/lib/whatsapp";
import WishlistButton from "@/components/WishlistButton";
import { Heart, ArrowLeft, Inbox } from "lucide-react";

const KEY = "natoure_wishlist";

interface Tour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  end_date: string | null;
  max_seats: number;
  booked_seats: number;
  hotel: string | null;
  description: string | null;
}

function getStoredIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function getDurationLabel(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const d = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return d ? `${d} gün / ${d - 1} gecə` : "";
}

export default function WishlistPage() {
  const [tours, setTours]     = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [ids, setIds]         = useState<string[]>([]);

  useEffect(() => {
    const stored = getStoredIds();
    setIds(stored);
    if (stored.length === 0) { setLoading(false); return; }

    supabase.from("tours").select("*").in("id", stored).eq("is_active", true)
      .then(({ data }) => {
        const map = Object.fromEntries((data || []).map(t => [t.id, t]));
        setTours(stored.map(id => map[id]).filter(Boolean));
        setLoading(false);
      });
  }, []);

  // Real-time silmə: WishlistButton-a basdıqda kartı siyahıdan çıxar
  useEffect(() => {
    const timer = setInterval(() => {
      const newIds = getStoredIds();
      if (newIds.length !== ids.length) {
        setIds(newIds);
        setTours(prev => prev.filter(t => newIds.includes(t.id)));
      }
    }, 400);
    return () => clearInterval(timer);
  }, [ids]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 20px" }}>
          <Link href="/turlar" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#64748b", textDecoration: "none", marginBottom: 16,
          }}>
            <ArrowLeft size={14} /> Turlara qayıt
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #0284c7, #4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Heart size={20} color="white" fill="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Bəyənilənlərim
              </h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                {loading ? "Yüklənir..." : `${tours.length} tur saxlanılıb`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Skeleton loader */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 220, borderRadius: 16, background: "#e2e8f0",
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }} />
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          </div>
        )}

        {/* Boş vəziyyət */}
        {!loading && ids.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, margin: "0 auto 20px",
              background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Inbox size={36} style={{ color: "#cbd5e1" }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Hələ heç nə saxlanılmayıb
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
              Turlar siyahısında ❤️ düyməsinə basaraq turları buraya əlavə et.
            </p>
            <Link href="/turlar" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #0284c7, #4f46e5)",
              color: "white", textDecoration: "none",
              padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700,
            }}>
              Turlara Bax
            </Link>
          </div>
        )}

        {/* Deaktiv olunub */}
        {!loading && ids.length > 0 && tours.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ color: "#64748b", marginBottom: 16 }}>Saxladığın turlar artıq aktiv deyil.</p>
            <Link href="/turlar" style={{ color: "#0284c7", fontSize: 14, fontWeight: 600 }}>
              Yeni turlara bax →
            </Link>
          </div>
        )}

        {/* Kartlar */}
        {!loading && tours.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {tours.map((tour) => {
                const durationLabel = getDurationLabel(tour.start_date, tour.end_date);
                const seatsLeft = tour.max_seats - tour.booked_seats;
                const almostFull = seatsLeft <= 3 && seatsLeft > 0;

                return (
                  <div key={tour.id} style={{
                    background: "white", borderRadius: 16,
                    border: "1px solid #e2e8f0", overflow: "hidden",
                    display: "flex", flexDirection: "column",
                  }}>
                    {almostFull && (
                      <div style={{
                        background: "#ef4444", color: "white",
                        fontSize: 11, fontWeight: 700, textAlign: "center", padding: 6,
                      }}>
                        Son {seatsLeft} yer!
                      </div>
                    )}
                    <div style={{ padding: "16px 16px 0", flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{
                          fontSize: 11, color: "#0284c7", fontWeight: 600,
                          background: "rgba(2,132,199,0.08)", borderRadius: 20, padding: "3px 10px",
                        }}>
                          {tour.destination}
                        </span>
                        <WishlistButton tourId={tour.id} />
                      </div>
                      <Link href={`/turlar/${tour.id}`} style={{ textDecoration: "none" }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.4, cursor: "pointer" }}>
                          {tour.name}
                        </h3>
                      </Link>
                      {durationLabel && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>⏱ {durationLabel}</p>}
                      {tour.hotel && <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>🏨 {tour.hotel}</p>}
                      {tour.description && (
                        <p style={{
                          fontSize: 12, color: "#94a3b8", lineHeight: 1.5, margin: "4px 0 0",
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {tour.description}
                        </p>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        borderTop: "1px solid #f1f5f9", paddingTop: 12, marginBottom: 12,
                      }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#0284c7" }}>
                          {tour.price_azn} AZN
                        </span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>/nəfər</span>
                      </div>
                      <a href={waLink(`Salam, "${tour.name}" turu haqqında məlumat almaq istəyirəm`)}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          width: "100%", padding: "10px 0", borderRadius: 10,
                          background: "#25D366", color: "white",
                          fontSize: 13, fontWeight: 700, textDecoration: "none",
                        }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp-da Sifariş Et
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 28, background: "white", borderRadius: 16,
              border: "1px solid #e2e8f0", padding: "24px", textAlign: "center",
            }}>
              <p style={{ fontSize: 14, color: "#475569", margin: "0 0 14px" }}>Daha çox tur görmək istəyirsən?</p>
              <Link href="/turlar" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                color: "white", textDecoration: "none",
                padding: "11px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700,
              }}>
                Bütün Turlara Bax
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
