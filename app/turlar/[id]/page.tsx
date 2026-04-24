import { getSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ItineraryButton from "@/components/ItineraryButton";
import BookingCTA from "@/components/BookingCTA";
import { ArrowLeft, Building2, Check, X } from "lucide-react";

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
  const { data } = await getSupabase().from("tours").select("*").eq("id", id).single();
  if (!data) return { title: "Tur tapılmadı" };

  const dur = getDuration(data.start_date, data.end_date);
  const desc = data.description ||
    `${data.destination} turu — ${dur ? `${dur.days} gün / ${dur.nights} gecə` : ""} ${data.price_azn} AZN-dən başlayan qiymətlərlə. Natoure ilə rezervasiya edin.`;

  const canonical = `https://www.natourefly.com/turlar/${id}`;
  return {
    title: `${data.name} | Natoure`,
    description: desc.slice(0, 160),
    alternates: { canonical },
    openGraph: {
      title: data.name,
      description: desc.slice(0, 160),
      images: data.image_url ? [{ url: data.image_url, width: 1200, height: 630, alt: data.name }] : [],
      type: "website",
      locale: "az_AZ",
      url: canonical,
      siteName: "Natoure",
    },
    twitter: {
      card: "summary_large_image",
      title: data.name,
      description: desc.slice(0, 160),
      images: data.image_url ? [data.image_url] : [],
    },
    keywords: `${data.destination} turu, ${data.destination} paket tur, Bakıdan ${data.destination}, ${data.name}, Natoure, tur paket Azərbaycan`,
  };
}

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: tour } = await getSupabase()
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
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Hero */}
      {tour.image_url ? (
        <div style={{ width: "100%", height: 380, overflow: "hidden", position: "relative" }}>
          <img src={tour.image_url} alt={tour.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.65) 100%)"
          }} />
          <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, padding: "0 24px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                {tour.destination}
              </p>
              <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, lineHeight: 1.3 }}>{tour.name}</h1>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "linear-gradient(135deg, #0284c7, #4f46e5)", padding: "48px 24px 32px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {tour.destination}
            </p>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, lineHeight: 1.3 }}>{tour.name}</h1>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {/* Back */}
        <Link href="/turlar" style={{ color: "#64748b", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
          <ArrowLeft size={14} /> Bütün turlar
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

          {/* Key info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>QİYMƏT</p>
              <p style={{ color: "#0284c7", fontSize: 22, fontWeight: 800 }}>{tour.price_azn} <span style={{ fontSize: 14 }}>AZN</span></p>
              {tour.price_usd && <p style={{ color: "#94a3b8", fontSize: 12 }}>~${tour.price_usd}</p>}
              <p style={{ color: "#94a3b8", fontSize: 11 }}>/nəfər</p>
            </div>

            {dur && (
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>MÜDDƏT</p>
                <p style={{ color: "#0f172a", fontSize: 20, fontWeight: 700 }}>{dur.days} <span style={{ fontSize: 14 }}>gün</span></p>
                <p style={{ color: "#94a3b8", fontSize: 12 }}>{dur.nights} gecə</p>
              </div>
            )}

            {(tour.start_date || tour.end_date) && (
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>TARİX</p>
                {tour.start_date && <p style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>
                  {new Date(tour.start_date).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
                </p>}
                {tour.end_date && <p style={{ color: "#94a3b8", fontSize: 12 }}>
                  — {new Date(tour.end_date).toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" })}
                </p>}
              </div>
            )}

            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ color: "#64748b", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>YER</p>
              <p style={{
                color: seatsLeft > 5 ? "#16a34a" : seatsLeft > 0 ? "#ca8a04" : "#ef4444",
                fontSize: 22, fontWeight: 800
              }}>{seatsLeft}</p>
              <p style={{ color: "#94a3b8", fontSize: 11 }}>boş yer / {tour.max_seats}</p>
            </div>
          </div>

          {/* Hotel */}
          {tour.hotel && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Building2 size={18} color="#0284c7" />
              </div>
              <div>
                <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: "0 0 2px", textTransform: "uppercase" }}>OTEL</p>
                <p style={{ color: "#0f172a", fontSize: 15, fontWeight: 600, margin: 0 }}>{tour.hotel}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {tour.description && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>TUR HAQQINDA</p>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>{tour.description}</p>
            </div>
          )}

          {/* Includes / Excludes */}
          {(includesList.length > 0 || excludesList.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {includesList.length > 0 && (
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
                  <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>DAXİLDİR</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {includesList.map((item, i) => (
                      <li key={i} style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ color: "#475569" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {excludesList.length > 0 && (
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
                  <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>DAXİL DEYİL</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {excludesList.map((item, i) => (
                      <li key={i} style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <X size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ color: "#475569" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Itinerary */}
          {itineraryList.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px" }}>
              <p style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" }}>GÜNDƏLIK PROQRAM</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {itineraryList.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 16, position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                      }}>{i + 1}</div>
                      {i < itineraryList.length - 1 && (
                        <div style={{ width: 1, flex: 1, background: "#e2e8f0", marginTop: 4 }} />
                      )}
                    </div>
                    <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, paddingTop: 4, margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Itinerary */}
          <div style={{ background: "linear-gradient(135deg, #f0f9ff, #f0f4ff)", border: "1px solid #bae6fd", borderRadius: 16, padding: "20px 24px" }}>
            <p style={{ color: "#0284c7", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>YENİ</p>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>AI ilə Günlük Proqram</p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 0 }}>
              Claude AI {tour.destination} üçün detallı günlük aktivlik proqramı hazırlayır — vaxt, yer, qiymət və məsləhətlərlə.
            </p>
            <ItineraryButton
              destination={tour.destination}
              start_date={tour.start_date}
              end_date={tour.end_date}
              duration_days={dur?.days ?? null}
            />
          </div>

          {/* CTA */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 28px" }}>
            <BookingCTA tourId={tour.id} seatsLeft={seatsLeft} tourName={tour.name} />
          </div>

          {/* Paylaş */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 28px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>Bu turu paylaş</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* WhatsApp */}
              <a href={`https://wa.me/?text=${encodeURIComponent(`${tour.name} — ${tour.price_azn} AZN\nhttps://www.natourefly.com/turlar/${tour.id}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "#25D366", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              {/* Facebook */}
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.natourefly.com/turlar/${tour.id}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "#1877F2", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                Facebook
              </a>
              {/* Link kopyala */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://www.natourefly.com/turlar/${tour.id}`);
                }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 13, border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Linki kopyala
              </button>
            </div>
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
            ...(tour.image_url && { "image": tour.image_url }),
            ...(tour.start_date && { "startDate": tour.start_date }),
            ...(tour.end_date && { "endDate": tour.end_date }),
            "url": `https://www.natourefly.com/turlar/${tour.id}`,
            "itinerary": itineraryList.length > 0 ? {
              "@type": "ItemList",
              "itemListElement": itineraryList.map((item, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": item,
              })),
            } : undefined,
            "offers": {
              "@type": "Offer",
              "price": tour.price_azn,
              "priceCurrency": "AZN",
              "availability": seatsLeft > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
              "url": `https://www.natourefly.com/turlar/${tour.id}`,
              "validFrom": tour.start_date ?? undefined,
            },
            "provider": {
              "@type": "TravelAgency",
              "name": "Natoure",
              "url": "https://www.natourefly.com",
              "telephone": "+994504888080",
            },
          }),
        }}
      />
    </div>
  );
}
