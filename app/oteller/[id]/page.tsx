"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MapPin, Star, Check, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

interface RoomRate {
  book_hash: string;
  room_name: string;
  meal: string;
  rg_ext: Record<string, number>;
  price_usd: number;
  price_azn: number;
  free_cancellation_until: string | null;
  cancellation_penalty: string | null;
  images: string[];
}
interface HotelStatic {
  hotel_id: string; name: string; stars: number; address: string;
  description: string; photos: string[]; amenities: string[];
}

export default function HotelDetailPage() {
  const params = useParams();
  const sp = useSearchParams();
  const hotelId = decodeURIComponent(String(params.id || ""));

  const checkin  = sp.get("checkin")  || "";
  const checkout = sp.get("checkout") || "";
  const adults   = sp.get("adults")   || "2";
  const children = sp.get("children") || "0";
  const childAges = sp.get("child_ages") || "";
  const residency = sp.get("residency") || "az";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<HotelStatic | null>(null);
  const [rooms, setRooms] = useState<RoomRate[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!hotelId || !checkin || !checkout) { setError("Axtarış məlumatları tam deyil."); setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch("/api/hotels/hotel", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotel_id: hotelId, checkin, checkout,
            adults: parseInt(adults, 10),
            childAges: childAges ? childAges.split(",").map(Number) : [],
            residency,
          }),
        });
        const data = await res.json();
        if (!data.ok) { setError("Otel məlumatı yüklənmədi."); }
        else { setInfo(data.static); setRooms(data.rooms || []); }
      } catch { setError("Yükləmə zamanı xəta baş verdi."); }
      finally { setLoading(false); }
    })();
  }, [hotelId, checkin, checkout, adults, childAges, residency]);

  const nights = Math.max(1, Math.ceil((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));

  function bookUrl(r: RoomRate) {
    const q = new URLSearchParams({
      hotel_id: hotelId, checkin, checkout, hash: r.book_hash,
      hotel_name: info?.name || "Otel", price: String(r.price_usd),
      room: r.room_name, meal: r.meal, adults, children, child_ages: childAges,
    });
    return `/booking/prebook?${q.toString()}`;
  }

  if (loading) return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <RefreshCw className="animate-spin" size={42} color="#0284c7" style={{ margin: "0 auto 14px" }} />
        <p style={{ color: "#64748b" }}>Otel və otaqlar yüklənir...</p>
      </div>
    </div>
  );

  if (error || !info) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <XCircle size={40} color="#ef4444" style={{ margin: "0 auto 12px" }} />
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{error || "Otel tapılmadı"}</h2>
        <a href="/oteller" style={{ color: "#0284c7", fontWeight: 700, textDecoration: "none" }}>← Axtarışa qayıt</a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 60px" }}>
      <a href="/oteller" style={{ color: "#0284c7", fontWeight: 600, textDecoration: "none", fontSize: 14 }}>← Axtarışa qayıt</a>

      {/* Header */}
      <div style={{ margin: "14px 0 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          {Array.from({ length: info.stars || 0 }).map((_, i) => <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />)}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>{info.name}</h1>
        {info.address && <p style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 14, margin: "6px 0 0" }}><MapPin size={15} /> {info.address}</p>}
      </div>

      {/* Photo gallery */}
      {info.photos.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={info.photos[activePhoto]} alt={info.name} style={{ width: "100%", height: 380, objectFit: "cover", borderRadius: 18 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto" }}>
            {info.photos.slice(0, 8).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt="" onClick={() => setActivePhoto(i)}
                style={{ width: 90, height: 64, objectFit: "cover", borderRadius: 10, cursor: "pointer", flexShrink: 0, border: activePhoto === i ? "2px solid #0284c7" : "2px solid transparent" }} />
            ))}
          </div>
        </div>
      )}

      {/* Description + amenities */}
      {info.description && <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-line" }}>{info.description.slice(0, 600)}</p>}
      {info.amenities.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {info.amenities.slice(0, 12).map((a, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f1f5f9", color: "#334155", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}><Check size={13} color="#16a34a" /> {a}</span>
          ))}
        </div>
      )}

      {/* Rooms */}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>
        Otaqlar <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 15 }}>({rooms.length} variant · {nights} gecə)</span>
      </h2>

      {rooms.length === 0 ? (
        <p style={{ color: "#64748b" }}>Bu tarixlərə otaq tapılmadı. Tarixləri dəyişib yenidən cəhd edin.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {rooms.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 16, background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
              {r.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.images[0]} alt={r.room_name} style={{ width: 180, height: "auto", minHeight: 150, objectFit: "cover", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{r.room_name}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", color: "#1d4ed8", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>🍽 {r.meal}</span>
                  {r.free_cancellation_until ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0fdf4", color: "#15803d", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}><ShieldCheck size={13} /> Pulsuz ləğv ({new Date(r.free_cancellation_until).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}-ə qədər)</span>
                  ) : (
                    <span style={{ background: "#fef2f2", color: "#b91c1c", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>Geri ödənişsiz{r.cancellation_penalty ? ` · ləğv cəzası ${r.cancellation_penalty}` : ""}</span>
                  )}
                </div>
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0284c7", lineHeight: 1 }}>{r.price_usd.toLocaleString()} <span style={{ fontSize: 13 }}>USD</span></p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{nights} gecə · vergi və xidmət haqqı daxil</p>
                  </div>
                  <a href={bookUrl(r)} style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", color: "white", borderRadius: 12, padding: "11px 22px", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(2,132,199,0.3)" }}>Bron et →</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
