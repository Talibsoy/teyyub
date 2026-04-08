import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { Star, Calendar, Utensils, BedDouble } from "lucide-react";

export const revalidate = 3600; // hər saatda bir yenilə

interface Hotel {
  hotel_key: string;
  hotel_name: string;
  destination: string;
  checkin: string;
  checkout: string;
  price_usd: number;
  stars: number;
  room_type: string;
  meal: string;
  updated_at: string;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast:     "Səhər yeməyi",
  half_board:    "Yarım pansion",
  full_board:    "Tam pansion",
  all_inclusive: "Hər şey daxil",
  room_only:     "Yeməksiz",
};

const DEST_EMOJI: Record<string, string> = {
  "İstanbul":       "🇹🇷",
  "Dubai":          "🇦🇪",
  "Antalya":        "🇹🇷",
  "Şarm əl-Şeyx":  "🇪🇬",
  "Hurgada":        "🇪🇬",
  "Maldiv adaları": "🇲🇻",
  "Bali":           "🇮🇩",
  "Barselona":      "🇪🇸",
};

function nightCount(checkin: string, checkout: string): number {
  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("az-AZ", {
    day: "numeric", month: "short",
  });
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          fill={i < stars ? "#f59e0b" : "none"}
          stroke={i < stars ? "#f59e0b" : "#cbd5e1"}
        />
      ))}
    </span>
  );
}

export default async function OtellerPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("hotels")
    .select("*")
    .eq("status", "active")
    .order("price_usd", { ascending: true });

  if (destination) {
    query = query.eq("destination", destination);
  }

  const { data: hotels } = await query.limit(60);

  // Unikal destinasiyalar (filter üçün)
  const { data: destRows } = await supabase
    .from("hotels")
    .select("destination")
    .eq("status", "active");

  const destinations = [...new Set((destRows || []).map((r: { destination: string }) => r.destination))].sort();

  const whatsappBase = "https://wa.me/994517769632?text=";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* ── Başlıq ── */}
      <section style={{
        background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)",
        padding: "60px 24px 40px",
        textAlign: "center",
        color: "white",
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, opacity: 0.8, marginBottom: 12, textTransform: "uppercase" }}>
          Real-time qiymətlər
        </p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: "0 0 12px" }}>
          Otellər
        </h1>
        <p style={{ opacity: 0.85, maxWidth: 500, margin: "0 auto", lineHeight: 1.6, fontSize: 16 }}>
          RateHawk-dan hər 4 saatda bir yenilənən aktual qiymətlər
        </p>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        {/* ── Destination filter ── */}
        {destinations.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            <Link
              href="/oteller"
              style={{
                padding: "8px 18px",
                borderRadius: 24,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                background: !destination ? "linear-gradient(135deg,#0284c7,#4f46e5)" : "#fff",
                color: !destination ? "white" : "#475569",
                border: !destination ? "none" : "1.5px solid #e2e8f0",
                boxShadow: !destination ? "0 4px 12px rgba(2,132,199,0.25)" : "none",
              }}
            >
              Hamısı
            </Link>
            {destinations.map((d) => (
              <Link
                key={d}
                href={`/oteller?destination=${encodeURIComponent(d)}`}
                style={{
                  padding: "8px 18px",
                  borderRadius: 24,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: destination === d ? "linear-gradient(135deg,#0284c7,#4f46e5)" : "#fff",
                  color: destination === d ? "white" : "#475569",
                  border: destination === d ? "none" : "1.5px solid #e2e8f0",
                  boxShadow: destination === d ? "0 4px 12px rgba(2,132,199,0.25)" : "none",
                }}
              >
                {DEST_EMOJI[d] || "🏨"} {d}
              </Link>
            ))}
          </div>
        )}

        {/* ── Otel kartları ── */}
        {!hotels || hotels.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "#94a3b8" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🏨</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#475569" }}>Hazırda otel məlumatı yoxdur</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Sistem hər 4 saatda bir yenilənir</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}>
            {(hotels as Hotel[]).map((hotel) => {
              const nights = nightCount(hotel.checkin, hotel.checkout);
              const priceAzn = Math.round(hotel.price_usd * 1.7); // təxmini AZN
              const waText = encodeURIComponent(
                `Salam! ${hotel.hotel_name} oteli ilə maraqlanıram. ${formatDate(hotel.checkin)} - ${formatDate(hotel.checkout)} tarixi üçün qiymət soruşmaq istəyirəm.`
              );

              return (
                <div
                  key={hotel.hotel_key}
                  style={{
                    background: "white",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  {/* Başlıq zolağı */}
                  <div style={{
                    background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                    padding: "20px 20px 16px",
                    color: "white",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                          {DEST_EMOJI[hotel.destination] || "🏨"} {hotel.destination}
                        </p>
                        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                          {hotel.hotel_name}
                        </h3>
                      </div>
                      <StarRating stars={hotel.stars} />
                    </div>
                  </div>

                  {/* Məzmun */}
                  <div style={{ padding: "16px 20px" }}>
                    {/* Tarix + gecə sayı */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "#475569", fontSize: 13 }}>
                      <Calendar size={14} />
                      <span>
                        {formatDate(hotel.checkin)} — {formatDate(hotel.checkout)}
                        <span style={{ marginLeft: 6, background: "#f1f5f9", borderRadius: 6, padding: "2px 7px", fontSize: 12, fontWeight: 600 }}>
                          {nights} gecə
                        </span>
                      </span>
                    </div>

                    {/* Otaq tipi */}
                    {hotel.room_type && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "#475569", fontSize: 13 }}>
                        <BedDouble size={14} />
                        <span>{hotel.room_type}</span>
                      </div>
                    )}

                    {/* Yemək */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, color: "#475569", fontSize: 13 }}>
                      <Utensils size={14} />
                      <span>{MEAL_LABELS[hotel.meal] || hotel.meal}</span>
                    </div>

                    {/* Qiymət */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
                          {nights} gecə / 2 nəfər
                        </p>
                        <p style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                          ${hotel.price_usd.toLocaleString()}
                        </p>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                          ≈ {priceAzn.toLocaleString()} AZN
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "#cbd5e1" }}>
                          Yeniləndi: {new Date(hotel.updated_at).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp düyməsi */}
                    <a
                      href={`${whatsappBase}${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        padding: "12px",
                        borderRadius: 12,
                        background: "#25d366",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 14,
                        textDecoration: "none",
                        boxShadow: "0 4px 12px rgba(37,211,102,0.3)",
                      }}
                    >
                      WhatsApp-da Soruş
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
