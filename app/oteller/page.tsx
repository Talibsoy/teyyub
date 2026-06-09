"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";

// /api/hotels/search cavabının forması (əvvəl lib/hotels-dən import olunurdu)
interface HotelOffer {
  id: string; name: string; destination: string; checkin: string; checkout: string;
  nights: number; price_original: number; price_marked_up: number; currency: string;
  stars: number | null; rating: number | null; review_count: number;
  booking_url: string; address: string; facilities: string[];
  book_hash?: string | null; meal?: string; room_type?: string;
}

const DESTINATIONS = [
  // 🇺🇸 Amerika
  "New York", "Los Angeles", "Miami", "Las Vegas", "Chicago",
  "San Francisco", "Orlando", "Boston", "Washington DC", "Seattle",
  "Houston", "Atlanta", "Denver", "Honolulu", "New Orleans",
  "Nashville", "Austin", "Phoenix", "San Diego", "Dallas",
  "Portland", "Salt Lake City", "Tampa", "Charlotte", "Minneapolis",
  // 🇨🇦 Kanada
  "Toronto", "Vancouver", "Montreal", "Calgary",
  // 🇲🇽 Meksika & Karib
  "Cancun", "Mexico City", "Playa del Carmen", "Punta Cana", "Havana",
  // 🌍 Avropa
  "Paris", "London", "Rome", "Barcelona", "Amsterdam",
  "Madrid", "Berlin", "Prague", "Vienna", "Lisbon",
  "Athens", "Budapest", "Zurich", "Milan", "Florence",
  "Brussels", "Copenhagen", "Stockholm", "Oslo", "Helsinki",
  "Warsaw", "Krakow", "Dubrovnik", "Split", "Porto",
  // 🌏 Asiya
  "Dubai", "Istanbul", "Bangkok", "Bali", "Tokyo",
  "Singapore", "Hong Kong", "Seoul", "Kuala Lumpur", "Phuket",
  "Maldives", "Doha", "Abu Dhabi", "Riyadh", "Muscat",
  "Colombo", "Ho Chi Minh City", "Hanoi", "Osaka", "Kyoto",
  // 🌍 Afrika & Orta Şərq
  "Cairo", "Marrakech", "Cape Town", "Nairobi", "Zanzibar",
  "Sharm El Sheikh", "Hurghada", "Casablanca", "Tunis", "Accra",
  // 🌏 Okeaniya
  "Sydney", "Melbourne", "Auckland", "Fiji",
];

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function HotelCard({ hotel, language, adults, children, childAges }: {
  hotel: HotelOffer;
  language: string;
  adults: number;
  children: number;
  childAges: number[];
}) {
  const perNight = Math.ceil(hotel.price_marked_up / hotel.nights);
  const starsStr = hotel.stars ? "⭐".repeat(Math.min(hotel.stars, 5)) : "";

  const waMsg = language === "az"
    ? `Salam! "${hotel.name}" oteli ilə maraqlanıram.\nMəkan: ${hotel.destination}\nGiriş: ${hotel.checkin} | Çıxış: ${hotel.checkout} (${hotel.nights} gecə)\nQiymət: ${hotel.price_marked_up.toLocaleString()} AZN\nRezervasiya etmək istəyirəm.`
    : language === "tr"
    ? `Merhaba! "${hotel.name}" oteli ile ilgileniyorum.\nBölge: ${hotel.destination}\nGiriş: ${hotel.checkin} | Çıkış: ${hotel.checkout} (${hotel.nights} gece)\nFiyat: ${hotel.price_marked_up.toLocaleString()} AZN\nRezervasyon yaptırmak istiyorum.`
    : `Hello! I'm interested in the "${hotel.name}" hotel.\nLocation: ${hotel.destination}\nCheck-in: ${hotel.checkin} | Check-out: ${hotel.checkout} (${hotel.nights} nights)\nPrice: ${hotel.price_marked_up.toLocaleString()} AZN\nI would like to make a booking.`;

  const bookingUrl = `/booking/prebook?hotel_id=${hotel.id}&checkin=${hotel.checkin}&checkout=${hotel.checkout}&hash=${encodeURIComponent(hotel.book_hash || "")}&hotel_name=${encodeURIComponent(hotel.name)}&price=${hotel.price_marked_up}&room=${encodeURIComponent(hotel.room_type || "")}&meal=${encodeURIComponent(hotel.meal || "")}&adults=${adults}&children=${children}&child_ages=${childAges.join(",")}`;

  return (
    <div style={{
      background: "white", borderRadius: 20,
      border: "1px solid #e2e8f0", overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      transition: "all 0.2s", display: "flex", flexDirection: "column",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
    >
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{hotel.destination}</p>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white", lineHeight: 1.3 }}>{hotel.name}</h3>
          </div>
          {starsStr && (
            <span style={{ fontSize: 11, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px", color: "#fbbf24", whiteSpace: "nowrap" }}>{starsStr}</span>
          )}
        </div>
        {hotel.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <span style={{ background: hotel.rating >= 9 ? "#16a34a" : hotel.rating >= 8 ? "#0284c7" : "#64748b", color: "white", borderRadius: 6, padding: "2px 8px", fontSize: 13, fontWeight: 700 }}>
              {hotel.rating.toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {hotel.rating >= 9
                ? (language === "az" ? "Əla" : language === "tr" ? "Harika" : "Exceptional")
                : hotel.rating >= 8
                ? (language === "az" ? "Çox yaxşı" : language === "tr" ? "Çok iyi" : "Very Good")
                : (language === "az" ? "Yaxşı" : language === "tr" ? "İyi" : "Good")}
              {hotel.review_count > 0 && ` · ${hotel.review_count.toLocaleString()} ${language === "az" ? "rəy" : language === "tr" ? "değerlendirme" : "reviews"}`}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            {
              label: language === "az" ? "Giriş" : language === "tr" ? "Giriş" : "Check-in",
              val: new Date(hotel.checkin).toLocaleDateString(language === "az" ? "az-AZ" : language === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short" })
            },
            {
              label: language === "az" ? "Çıxış" : language === "tr" ? "Çıkış" : "Check-out",
              val: new Date(hotel.checkout).toLocaleDateString(language === "az" ? "az-AZ" : language === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short" })
            },
            {
              label: language === "az" ? "Gecə" : language === "tr" ? "Gece" : "Nights",
              val: String(hotel.nights),
              hl: true
            },
          ].map(item => (
            <div key={item.label} style={{ flex: item.hl ? "0 0 auto" : 1, background: item.hl ? "#f0f9ff" : "#f8fafc", borderRadius: 10, padding: "9px 12px" }}>
              <p style={{ margin: 0, fontSize: 10, color: item.hl ? "#0284c7" : "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: item.hl ? "#0284c7" : "#0f172a" }}>{item.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 20px", flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{language === "az" ? "Gecəlik" : language === "tr" ? "Gecelik" : "Per night"}</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: "#64748b", fontWeight: 600 }}>{perNight.toLocaleString()} AZN</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
            {language === "az"
              ? `${hotel.nights} gecə üçün`
              : language === "tr"
              ? `${hotel.nights} gece için`
              : `for ${hotel.nights} nights`}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800, color: "#0284c7", lineHeight: 1 }}>
            {hotel.price_marked_up.toLocaleString()} <span style={{ fontSize: 14 }}>AZN</span>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>
            {language === "az" ? "Xidmət haqqı daxil" : language === "tr" ? "Hizmet bedeli dahil" : "Service fee included"}
          </p>
        </div>
      </div>

      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {hotel.book_hash && (
          <a href={bookingUrl}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg,#0284c7,#4f46e5)", color: "white", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 15px rgba(2,132,199,0.3)", textAlign: "center" }}>
            Onlayn Rezervasiya Et
          </a>
        )}
        <a href={`https://wa.me/447828721748?text=${encodeURIComponent(waMsg)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "white", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 15px rgba(37,211,102,0.3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {language === "az" ? "WhatsApp-da Rezervasiya Et" : language === "tr" ? "WhatsApp'tan Rezervasyon Et" : "Book on WhatsApp"}
        </a>
      </div>
    </div>
  );
}

export default function OtellerPage() {
  const { language } = useLanguage();
  const [destination, setDestination] = useState("");
  const [checkin,  setCheckin]  = useState(todayPlus(14));
  const [checkout, setCheckout] = useState(todayPlus(21));
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [residency, setResidency] = useState("az");
  const [stars,    setStars]    = useState(0);
  const [hotels,   setHotels]   = useState<HotelOffer[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [error,    setError]    = useState("");

  const STAR_OPTIONS = [
    { value: 0, label: language === "az" ? "Hamısı" : language === "tr" ? "Hepsi" : "All" },
    { value: 3, label: "⭐⭐⭐ 3+" },
    { value: 4, label: "⭐⭐⭐⭐ 4+" },
    { value: 5, label: "⭐⭐⭐⭐⭐ 5" },
  ];

  const nights = Math.max(1, Math.ceil(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
  ));

  function handleChildCountChange(count: number) {
    setChildren(count);
    setChildAges(Array.from({ length: count }, (_, i) => childAges[i] ?? 12));
  }

  async function search() {
    if (!destination.trim()) {
      setError(language === "az" ? "Zəhmət olmasa məkan daxil edin" : language === "tr" ? "Lütfen bir bölge girin" : "Please enter a destination");
      return;
    }
    if (checkin >= checkout)  {
      setError(language === "az" ? "Çıxış tarixi giriş tarixindən sonra olmalıdır" : language === "tr" ? "Çıkış tarihi giriş tarihinden sonra olmalıdır" : "Check-out date must be after check-in date");
      return;
    }
    setError(""); setLoading(true); setSearched(true);
    try {
      const res = await fetch("/api/hotels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          checkin,
          checkout,
          adults,
          childAges,
          residency,
          rooms: 1,
          stars: stars || undefined
        }),
      });
      const data = await res.json();
      setHotels(data.hotels || []);
    } catch {
      setError(language === "az" ? "Axtarış zamanı xəta baş verdi. Yenidən cəhd edin." : language === "tr" ? "Arama sırasında bir hata oluştu. Lütfen tekrar deneyin." : "An error occurred during the search. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fallbackWaMsg = language === "az"
    ? `Salam! ${destination} üçün ${checkin}–${checkout} tarixlərə ${adults} nəfər otel axtarıram.`
    : language === "tr"
    ? `Merhaba! ${destination} için ${checkin}–${checkout} tarihlerinde ${adults} kişi otel arıyorum.`
    : `Hello! I am looking for a hotel in ${destination} for dates ${checkin}–${checkout} for ${adults} guests.`;

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a",
    outline: "none", boxSizing: "border-box", background: "white",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: "#94a3b8", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>

      {/* ── HERO + FORM ─────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0284c7 0%,#4f46e5 100%)", padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Başlıq */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{ display: "inline-block", background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "5px 16px", borderRadius: 20, marginBottom: 14 }}>
              {language === "az" ? "Canlı Qiymətlər · Dünya Üzrə" : language === "tr" ? "Canlı Fiyatlar · Dünya Çapında" : "Live Rates · Worldwide"}
            </span>
            <h1 style={{ color: "white", fontWeight: 900, fontSize: 36, margin: "0 0 8px" }}>
              {language === "az" ? "Otel Axtarışı" : language === "tr" ? "Otel Arama" : "Hotel Search"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, margin: 0 }}>
              {language === "az"
                ? "Minlərlə otel — anlıq qiymətlər, xidmət haqqı daxil"
                : language === "tr"
                ? "Binlerce otel — anlık fiyatlar, hizmet bedeli dahil"
                : "Thousands of hotels — instant rates, service fee included"}
            </p>
          </div>

          {/* Form kartı */}
          <div style={{ background: "white", borderRadius: 20, padding: "24px 24px 20px", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>

            {/* Sıra 1 — mobil: bir sütun, desktop: 4 sütun */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>📍 {language === "az" ? "Məkan" : language === "tr" ? "Mekan/Bölge" : "Destination"}</label>
                <input list="dest-list" value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="New York, Dubai, Paris..."
                  style={{ ...inp, fontSize: 15 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
                <datalist id="dest-list">
                  {DESTINATIONS.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div>
                <label style={lbl}>📅 {language === "az" ? "Giriş" : language === "tr" ? "Giriş" : "Check-in"}</label>
                <input type="date" value={checkin} min={todayPlus(1)}
                  onChange={e => setCheckin(e.target.value)} style={inp}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
              </div>

              <div>
                <label style={lbl}>
                  📅 {language === "az" ? "Çıxış" : language === "tr" ? "Çıkış" : "Check-out"}{" "}
                  <span style={{ color: "#0284c7", textTransform: "none", fontSize: 11 }}>
                    · {language === "az" ? `${nights} gecə` : language === "tr" ? `${nights} gece` : `${nights} nights`}
                  </span>
                </label>
                <input type="date" value={checkout} min={checkin}
                  onChange={e => setCheckout(e.target.value)} style={inp}
                  onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
              </div>

              <div>
                <label style={lbl}>👥 {language === "az" ? "Nəfər" : language === "tr" ? "Kişi" : "Guests"}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                  <button onClick={() => setAdults(a => Math.max(1, a - 1))}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#475569" }}>−</button>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{adults}</span>
                  <button onClick={() => setAdults(a => Math.min(10, a + 1))}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#475569" }}>+</button>
                </div>
              </div>

              <div>
                <label style={lbl}>👶 {language === "az" ? "Uşaq" : language === "tr" ? "Çocuk" : "Children"}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
                  <button onClick={() => handleChildCountChange(Math.max(0, children - 1))}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#475569" }}>−</button>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{children}</span>
                  <button onClick={() => handleChildCountChange(Math.min(6, children + 1))}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#475569" }}>+</button>
                </div>
              </div>

              <div>
                <label style={lbl}>🛂 {language === "az" ? "Vətəndaşlıq" : language === "tr" ? "Vatandaşlık" : "Residency"}</label>
                <select value={residency} onChange={e => setResidency(e.target.value)} style={inp}>
                  <option value="az">Azərbaycan (AZ)</option>
                  <option value="mc">Monako (MC)</option>
                  <option value="tr">Türkiyə (TR)</option>
                  <option value="ae">BƏƏ (AE)</option>
                  <option value="us">ABŞ (US)</option>
                  <option value="gb">Böyük Britaniya (GB)</option>
                </select>
              </div>
            </div>

            {children > 0 && (
              <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", marginTop: 0, marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 12 }}>
                <div style={{ width: "100%", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                  {language === "az" ? "Uşaqların yaşları" : language === "tr" ? "Çocukların yaşları" : "Children ages"}
                </div>
                {childAges.map((age, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{language === "az" ? `${i+1}-ci uşaq` : language === "tr" ? `${i+1}. çocuk` : `Child ${i+1}`}</span>
                    <select value={age} onChange={e => {
                      const ages = [...childAges];
                      ages[i] = parseInt(e.target.value, 10);
                      setChildAges(ages);
                    }} style={{ ...inp, width: 90, padding: "6px 8px" }}>
                      {Array.from({ length: 18 }, (_, y) => y).map(y => (
                        <option key={y} value={y}>{y} {language === "az" ? "yaş" : language === "tr" ? "yaş" : "y.o."}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Sıra 2 */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
              <div style={{ width: 180 }}>
                <label style={lbl}>⭐ {language === "az" ? "Ulduz" : language === "tr" ? "Yıldız" : "Stars"}</label>
                <select value={stars} onChange={e => setStars(Number(e.target.value))} style={inp}>
                  {STAR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={search} disabled={loading} style={{
                padding: "13px 36px", borderRadius: 12, border: "none",
                background: loading ? "#cbd5e1" : "linear-gradient(135deg,#0284c7,#4f46e5)",
                color: "white", fontWeight: 800, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 6px 20px rgba(2,132,199,0.4)",
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10,
              }}>
                {loading ? (
                  <>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                    {language === "az" ? "Axtarılır..." : language === "tr" ? "Aranıyor..." : "Searching..."}
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    {language === "az" ? "Otel Axtar" : language === "tr" ? "Otel Ara" : "Search Hotels"}
                  </>
                )}
              </button>
            </div>

            {error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 12, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── NƏTİCƏLƏR ──────────────────── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 48px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#0284c7", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#64748b", fontSize: 15 }}>
              {language === "az"
                ? "Otellər axtarılır..."
                : language === "tr"
                ? "Oteller aranıyor..."
                : "Searching hotels..."}
            </p>
          </div>
        )}

        {!loading && searched && hotels.length > 0 && (
          <>
            <p style={{ fontSize: 15, color: "#475569", fontWeight: 600, marginBottom: 20 }}>
              <span style={{ color: "#0284c7", fontWeight: 800 }}>
                {language === "az" ? `${hotels.length} otel` : language === "tr" ? `${hotels.length} otel` : `${hotels.length} hotels`}{" "}
              </span>
              {language === "az"
                ? "tapıldı"
                : language === "tr"
                ? "bulundu"
                : "found"}{" "}
              · {destination} · {language === "az" ? `${nights} gecə` : language === "tr" ? `${nights} gece` : `${nights} nights`} · {language === "az" ? `${adults} nəfər` : language === "tr" ? `${adults} kişi` : `${adults} guests`}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {hotels.map(h => <HotelCard key={h.id} hotel={h} language={language} adults={adults} children={children} childAges={childAges} />)}
            </div>
          </>
        )}

        {!loading && searched && hotels.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "#f1f5f9", border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
              {language === "az" ? "Nəticə tapılmadı" : language === "tr" ? "Sonuç bulunamadı" : "No results found"}
            </p>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
              {language === "az"
                ? "Tarixləri dəyişin və ya ulduz filtrini azaldın"
                : language === "tr"
                ? "Tarihleri değiştirin veya yıldız filtresini azaltın"
                : "Change travel dates or reduce the star filter"}
            </p>
            <a href={`https://wa.me/447828721748?text=${encodeURIComponent(fallbackWaMsg)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "white", borderRadius: 12, padding: "12px 24px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              {language === "az" ? "Komandamızla əlaqə saxlayın" : language === "tr" ? "Ekibimizle iletişime geçin" : "Contact our support team"}
            </a>
          </div>
        )}

        {!loading && !searched && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#0284c7,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(2,132,199,0.3)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              {language === "az" ? "Otel axtarışını başladın" : language === "tr" ? "Otel aramasını başlatın" : "Start your hotel search"}
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 360, margin: "0 auto" }}>
              {language === "az"
                ? "Məkan, tarix və nəfər sayını seçin — anlıq qiymətlər göstəriləcək"
                : language === "tr"
                ? "Bölge, tarih ve kişi sayısını seçin — anlık fiyatlar gösterilecektir"
                : "Select destination, dates, and guest count — live prices will be shown instantly"}
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
