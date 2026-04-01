import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Tour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  price_usd: number | null;
  start_date: string | null;
  end_date: string | null;
  max_seats: number;
  booked_seats: number;
  hotel: string | null;
  description: string | null;
  image_url: string | null;
  itinerary: string | null;
  includes: string | null;
  excludes: string | null;
}

function getDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return { days, nights: days - 1 };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase.from("tours").select("*").eq("id", id).single();
  if (!data) return { title: "Tur tapılmadı" };

  const dur = getDuration(data.start_date, data.end_date);
  const desc = data.description ||
    `${data.destination} turu — ${dur ? `${dur.days} gün / ${dur.nights} gecə` : ""} ${data.price_azn} AZN-dən başlayan qiymətlərlə. Natoure ilə rezervasiya edin.`;

  return {
    title: `${data.name} | Natoure`,
    description: desc.slice(0, 160),
    openGraph: {
      title: data.name,
      description: desc.slice(0, 160),
      images: data.image_url ? [{ url: data.image_url }] : [],
      type: "website",
      locale: "az_AZ",
    },
    keywords: `${data.destination} turu, ${data.destination} paket tur, Bakıdan ${data.destination}, ${data.name}, Natoure`,
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: tour } = await supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single<Tour>();

  if (!tour) notFound();

  const dur = getDuration(tour.start_date, tour.end_date);
  const seatsLeft = tour.max_seats - tour.booked_seats;
  const waMsg = encodeURIComponent(`Salam, "${tour.name}" turu haqqında məlumat almaq istəyirəm`);

  const includesList = tour.includes
    ? tour.includes.split("\n").map(s => s.trim()).filter(Boolean)
    : [];
  const excludesList = tour.excludes
    ? tour.excludes.split("\n").map(s => s.trim()).filter(Boolean)
    : [];
  const itineraryList = tour.itinerary
    ? tour.itinerary.split("\n").map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Hero */}
      {tour.image_url ? (
        <div style={{ width: "100%", height: 380, overflow: "hidden", position: "relative" }}>
          <img src={tour.image_url} alt={tour.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 30%, #0b0b0b 100%)"
          }} />
          <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, padding: "0 24px", maxWidth: 900, margin: "0 auto" }}>
            <p style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
              {tour.destination}
            </p>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, lineHeight: 1.3 }}>{tour.name}</h1>
          </div>
        </div>
      ) : (
        <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", padding: "48px 24px 32px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {tour.destination}
            </p>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, lineHeight: 1.3 }}>{tour.name}</h1>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {/* Back */}
        <Link href="/turlar" style={{ color: "#555", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
          ← Bütün turlar
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

          {/* Key info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>QİYMƏT</p>
              <p style={{ color: "#D4AF37", fontSize: 22, fontWeight: 800 }}>{tour.price_azn} <span style={{ fontSize: 14 }}>AZN</span></p>
              {tour.price_usd && <p style={{ color: "#555", fontSize: 12 }}>~${tour.price_usd}</p>}
              <p style={{ color: "#555", fontSize: 11 }}>/nəfər</p>
            </div>

            {dur && (
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>MÜDDƏT</p>
                <p style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{dur.days} <span style={{ fontSize: 14 }}>gün</span></p>
                <p style={{ color: "#555", fontSize: 12 }}>{dur.nights} gecə</p>
              </div>
            )}

            {(tour.start_date || tour.end_date) && (
              <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>TARİX</p>
                {tour.start_date && <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
                  {new Date(tour.start_date).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
                </p>}
                {tour.end_date && <p style={{ color: "#555", fontSize: 12 }}>
                  — {new Date(tour.end_date).toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" })}
                </p>}
              </div>
            )}

            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ color: "#555", fontSize: 11, marginBottom: 4 }}>YER</p>
              <p style={{
                color: seatsLeft > 5 ? "#4ade80" : seatsLeft > 0 ? "#facc15" : "#f87171",
                fontSize: 22, fontWeight: 800
              }}>{seatsLeft}</p>
              <p style={{ color: "#555", fontSize: 11 }}>boş yer / {tour.max_seats}</p>
            </div>
          </div>

          {/* Hotel */}
          {tour.hotel && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>OTEL</p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>🏨 {tour.hotel}</p>
            </div>
          )}

          {/* Description */}
          {tour.description && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>TUR HAQQINDA</p>
              <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{tour.description}</p>
            </div>
          )}

          {/* Includes / Excludes */}
          {(includesList.length > 0 || excludesList.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {includesList.length > 0 && (
                <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "18px 20px" }}>
                  <p style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>DAXİLDİR ✓</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {includesList.map((item, i) => (
                      <li key={i} style={{ color: "#4ade80", fontSize: 13, display: "flex", gap: 8 }}>
                        <span>✓</span><span style={{ color: "#bbb" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {excludesList.length > 0 && (
                <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "18px 20px" }}>
                  <p style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>DAXİL DEYİL ✗</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {excludesList.map((item, i) => (
                      <li key={i} style={{ color: "#f87171", fontSize: 13, display: "flex", gap: 8 }}>
                        <span>✗</span><span style={{ color: "#bbb" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Itinerary */}
          {itineraryList.length > 0 && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>GÜNDƏLIK PROQRAM</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {itineraryList.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 16, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "#D4AF37", color: "#000",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                      }}>{i + 1}</div>
                      {i < itineraryList.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: "#1a1a1a", marginTop: 4 }} />
                      )}
                    </div>
                    <p style={{ color: "#ccc", fontSize: 14, lineHeight: 1.7, paddingTop: 4 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ background: "#111", border: "1px solid #D4AF37", borderRadius: 16, padding: "24px 28px", textAlign: "center" }}>
            {seatsLeft > 0 ? (
              <>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                  Bu tura qoşulmaq istəyirsiniz?
                </p>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>
                  Yalnız <span style={{ color: "#facc15", fontWeight: 700 }}>{seatsLeft} yer</span> qalıb — indi rezervasiya edin
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Bu tur dolub</p>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>Növbəti tur üçün bizimlə əlaqə saxlayın</p>
              </>
            )}
            <a href={`https://wa.me/994517769632?text=${waMsg}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#25D366", color: "#fff", borderRadius: 10,
                padding: "13px 32px", fontWeight: 700, fontSize: 14,
                textDecoration: "none",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp-da Rezervasiya Et
            </a>
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            "name": tour.name,
            "description": tour.description || `${tour.destination} turu`,
            "touristType": "Leisure",
            "itinerary": {
              "@type": "ItemList",
              "itemListElement": itineraryList.map((item, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": item,
              })),
            },
            "offers": {
              "@type": "Offer",
              "price": tour.price_azn,
              "priceCurrency": "AZN",
              "availability": seatsLeft > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            },
            "provider": {
              "@type": "TravelAgency",
              "name": "Natoure",
              "url": "https://www.natourefly.com",
            },
          }),
        }}
      />
    </div>
  );
}
