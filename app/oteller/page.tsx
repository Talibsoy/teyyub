"use client";

import { useState } from "react";
import type { HotelOffer } from "@/lib/hotels";

const DESTINATIONS = [
  "Antalya", "Dubai", "Istanbul", "Bali", "Paris",
  "Barcelona", "Rome", "Maldives", "Bangkok", "Cairo",
];

const STAR_OPTIONS = [
  { value: 0, label: "Hamısı" },
  { value: 3, label: "⭐⭐⭐ 3+" },
  { value: 4, label: "⭐⭐⭐⭐ 4+" },
  { value: 5, label: "⭐⭐⭐⭐⭐ 5" },
];

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function HotelCard({ hotel }: { hotel: HotelOffer }) {
  const perNight = Math.ceil(hotel.price_marked_up / hotel.nights);
  const stars = hotel.stars ? "⭐".repeat(Math.min(hotel.stars, 5)) : "";
  const waMsg = `Salam! "${hotel.name}" oteli ilə maraqlanıram.\nMəkan: ${hotel.destination}\nGiriş: ${hotel.checkin} | Çıxış: ${hotel.checkout} (${hotel.nights} gecə)\nQiymət: ${hotel.price_marked_up.toLocaleString()} AZN\nRezervasiya etmək istəyirəm.`;

  return (
    <div
      style={{
        background: "white", borderRadius: 20,
        border: "1px solid #e2e8f0", overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "all 0.2s", display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
              {hotel.destination}
            </p>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.3 }}>
              {hotel.name}
            </h3>
          </div>
          {stars && (
            <span style={{ fontSize: 11, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px", color: "#fbbf24", whiteSpace: "nowrap" }}>
              {stars}
            </span>
          )}
        </div>
        {hotel.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <span style={{
              background: hotel.rating >= 9 ? "#16a34a" : hotel.rating >= 8 ? "#0284c7" : "#64748b",
              color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 13, fontWeight: 700,
            }}>
              {hotel.rating.toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {hotel.rating >= 9 ? "Əla" : hotel.rating >= 8 ? "Çox yaxşı" : "Yaxşı"}
              {hotel.review_count > 0 && ` · ${hotel.review_count.toLocaleString()} rəy`}
            </span>
          </div>
        )}
      </div>

      {/* Dates */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Giriş", val: new Date(hotel.checkin).toLocaleDateString("az-AZ", { day: "numeric", month: "short" }) },
            { label: "Çıxış", val: new Date(hotel.checkout).toLocaleDateString("az-AZ", { day: "numeric", month: "short" }) },
            { label: "Gecə", val: String(hotel.nights), highlight: true },
          ].map(item => (
            <div key={item.label} style={{
              flex: item.highlight ? "0 0 auto" : 1,
              background: item.highlight ? "#f0f9ff" : "#f8fafc",
              borderRadius: 10, padding: "9px 12px",
            }}>
              <p style={{ margin: 0, fontSize: 10, color: item.highlight ? "#0284c7" : "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: item.highlight ? "#0284c7" : "#0f172a" }}>{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Price */}
      <div style={{ padding: "14px 20px", flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Gecəlik</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: "#64748b", fontWeight: 600 }}>{perNight.toLocaleString()} AZN</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{hotel.nights} gecə üçün</p>
          <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800, color: "#0284c7", lineHeight: 1 }}>
            {hotel.price_marked_up.toLocaleString()} <span style={{ fontSize: 14 }}>AZN</span>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>Xidmət haqqı daxil</p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 16px 16px" }}>
        <a
          href={`https://wa.me/994517769632?text=${encodeURIComponent(waMsg)}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#25D366", color: "white", borderRadius: 12,
            padding: "12px", fontWeight: 700, fontSize: 14, textDecoration: "none",
            boxShadow: "0 4px 15px rgba(37,211,102,0.3)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp-da Rezervasiya Et
        </a>
      </div>
    </div>
  );
}

export default function OtellerPage() {
  const [destination, setDestination] = useState("");
  const [checkin,  setCheckin]  = useState(todayPlus(14));
  const [checkout, setCheckout] = useState(todayPlus(21));
  const [adults,   setAdults]   = useState(2);
  const [stars,    setStars]    = useState(0);
  const [hotels,   setHotels]   = useState<HotelOffer[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [error,    setError]    = useState("");

  async function search() {
    if (!destination.trim()) { setError("Zəhmət olmasa məkan daxil edin"); return; }
    if (checkin >= checkout)  { setError("Çıxış tarixi giriş tarixindən sonra olmalıdır"); return; }
    setError(""); setLoading(true); setSearched(true);
    try {
      const res = await fetch("/api/hotels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, checkin, checkout, adults, rooms: 1, stars: stars || undefined }),
      });
      const data = await res.json();
      setHotels(data.hotels || []);
    } catch {
      setError("Axtarış zamanı xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  const nights = Math.max(1, Math.ceil(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
  ));

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
    outline: "none", boxSizing: "border-box" as const, background: "white",
  };
  const labelStyle = {
    display: "block" as const, fontSize: 11, fontWeight: 600 as const,
    color: "#64748b", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

      {/* Hero + Search */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0284c7 100%)", padding: "56px 24px 44px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <p style={{ color: "#38bdf8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>
            Booking.com · Real Qiymətlər
          </p>
          <h1 style={{ color: "white", fontWeight: 900, fontSize: 34, margin: "0 0 6px", lineHeight: 1.2 }}>
            Otel Axtarışı
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, margin: "0 0 28px" }}>
            Dünya üzrə minlərlə otel — xidmət haqqı daxil qiymətlər
          </p>

          {/* Form */}
          <div style={{ background: "white", borderRadius: 20, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>

              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Məkan</label>
                <input
                  list="dest-list"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="Antalya, Dubai, Istanbul..."
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <datalist id="dest-list">
                  {DESTINATIONS.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div>
                <label style={labelStyle}>Giriş</label>
                <input type="date" value={checkin} min={todayPlus(1)}
                  onChange={e => setCheckin(e.target.value)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
              </div>

              <div>
                <label style={labelStyle}>Çıxış · {nights} gecə</label>
                <input type="date" value={checkout} min={checkin}
                  onChange={e => setCheckout(e.target.value)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
              </div>

              <div>
                <label style={labelStyle}>Nəfər</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                  <button onClick={() => setAdults(a => Math.max(1, a - 1))}
                    style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{adults}</span>
                  <button onClick={() => setAdults(a => Math.min(10, a + 1))}
                    style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Ulduz</label>
                <select value={stars} onChange={e => setStars(Number(e.target.value))} style={inputStyle}>
                  {STAR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button onClick={search} disabled={loading} style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: loading ? "#cbd5e1" : "linear-gradient(135deg,#0284c7,#4f46e5)",
                  color: "white", fontWeight: 700, fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 15px rgba(2,132,199,0.35)",
                  transition: "all 0.2s",
                }}>
                  {loading ? "Axtarılır..." : "Axtar"}
                </button>
              </div>
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 10, textAlign: "center" }}>{error}</p>}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0284c7", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#64748b" }}>Booking.com-dan otellər yüklənir...</p>
          </div>
        )}

        {!loading && searched && hotels.length > 0 && (
          <>
            <p style={{ fontSize: 15, color: "#475569", fontWeight: 600, marginBottom: 20 }}>
              <span style={{ color: "#0284c7", fontWeight: 800 }}>{hotels.length} otel</span> tapıldı
              {" · "}{destination} · {nights} gecə · {adults} nəfər
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {hotels.map(h => <HotelCard key={h.id} hotel={h} />)}
            </div>
          </>
        )}

        {!loading && searched && hotels.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🏨</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Nəticə tapılmadı</p>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Tarixləri dəyişin və ya ulduz filtrini azaldın</p>
            <a href={`https://wa.me/994517769632?text=${encodeURIComponent(`Salam! ${destination} üçün ${checkin}–${checkout} tarixlərə ${adults} nəfər otel axtarıram.`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "white", borderRadius: 12, padding: "12px 24px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Komandamızla əlaqə saxlayın
            </a>
          </div>
        )}

        {!loading && !searched && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>🏨</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Otel axtarışını başladın</h2>
            <p style={{ color: "#64748b", fontSize: 15 }}>Məkan, tarix və nəfər sayını seçin — real qiymətlər göstəriləcək</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
