import { NextRequest, NextResponse } from "next/server";
import { searchFlights }             from "@/lib/duffel";
import { searchHotels }              from "@/lib/hotels";
import { getSupabaseAdmin }          from "@/lib/supabase";
import type { FlightOffer }          from "@/lib/duffel";
import type { HotelOffer }           from "@/lib/hotels";

export const maxDuration = 90;

// ─── helpers ──────────────────────────────────────────────────────────────────

const AZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","İyun",
  "İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr",
];

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}


interface DestConfig {
  slug: string; labelAz: string; iata: string;
  hotelQuery: string; unsplashQuery: string;
  stars: number; nights: number;
}

// Qlobal destination hovuzu — hər gün fərqli 6 seçilir
const ALL_DESTINATIONS: DestConfig[] = [
  // ── Orta Şərq ─────────────────────────────────────────────────────────────
  { slug: "dubai",       labelAz: "Dubai",             iata: "DXB", hotelQuery: "Dubai",              unsplashQuery: "Dubai skyline luxury",         stars: 4, nights: 5 },
  { slug: "abu-dhabi",   labelAz: "Əbu Dabi",          iata: "AUH", hotelQuery: "Abu Dhabi",           unsplashQuery: "Abu Dhabi skyline UAE",        stars: 5, nights: 5 },
  { slug: "doha",        labelAz: "Doha",              iata: "DOH", hotelQuery: "Doha",                unsplashQuery: "Doha Qatar skyline",           stars: 5, nights: 5 },
  { slug: "muscat",      labelAz: "Muskat",            iata: "MCT", hotelQuery: "Muscat",              unsplashQuery: "Muscat Oman sea",              stars: 4, nights: 6 },
  { slug: "riyadh",      labelAz: "Riyad",             iata: "RUH", hotelQuery: "Riyadh",              unsplashQuery: "Riyadh Saudi Arabia city",     stars: 4, nights: 5 },
  // ── Türkiyə ───────────────────────────────────────────────────────────────
  { slug: "antalya",     labelAz: "Antalya",           iata: "AYT", hotelQuery: "Antalya",             unsplashQuery: "Antalya Turkey beach",         stars: 5, nights: 7 },
  { slug: "istanbul",    labelAz: "İstanbul",          iata: "IST", hotelQuery: "Istanbul",            unsplashQuery: "Istanbul Bosphorus city",      stars: 4, nights: 4 },
  { slug: "bodrum",      labelAz: "Bodrum",            iata: "BJV", hotelQuery: "Bodrum",              unsplashQuery: "Bodrum Turkey coast",          stars: 5, nights: 7 },
  // ── Afrika ────────────────────────────────────────────────────────────────
  { slug: "cairo",       labelAz: "Qahirə",            iata: "CAI", hotelQuery: "Cairo",               unsplashQuery: "Cairo Egypt pyramids",         stars: 4, nights: 6 },
  { slug: "sharm",       labelAz: "Şarm əş-Şeyx",      iata: "SSH", hotelQuery: "Sharm El Sheikh",     unsplashQuery: "Sharm El Sheikh Red Sea",      stars: 5, nights: 7 },
  { slug: "marrakech",   labelAz: "Marakeş",           iata: "RAK", hotelQuery: "Marrakech",           unsplashQuery: "Marrakech Morocco medina",     stars: 4, nights: 6 },
  { slug: "cape-town",   labelAz: "Kəp Toun",          iata: "CPT", hotelQuery: "Cape Town",           unsplashQuery: "Cape Town South Africa",       stars: 4, nights: 8 },
  { slug: "nairobi",     labelAz: "Nairobi",           iata: "NBO", hotelQuery: "Nairobi",             unsplashQuery: "Nairobi Kenya safari",         stars: 4, nights: 7 },
  { slug: "zanzibar",    labelAz: "Zənzibar",          iata: "ZNZ", hotelQuery: "Zanzibar",            unsplashQuery: "Zanzibar beach island",        stars: 4, nights: 8 },
  // ── Avropa ────────────────────────────────────────────────────────────────
  { slug: "paris",       labelAz: "Paris",             iata: "CDG", hotelQuery: "Paris",               unsplashQuery: "Paris Eiffel Tower France",    stars: 4, nights: 5 },
  { slug: "london",      labelAz: "London",            iata: "LHR", hotelQuery: "London",              unsplashQuery: "London Big Ben Thames",        stars: 4, nights: 5 },
  { slug: "barcelona",   labelAz: "Barselona",         iata: "BCN", hotelQuery: "Barcelona",           unsplashQuery: "Barcelona Spain Sagrada",      stars: 4, nights: 5 },
  { slug: "rome",        labelAz: "Roma",              iata: "FCO", hotelQuery: "Rome",                unsplashQuery: "Rome Colosseum Italy",         stars: 4, nights: 5 },
  { slug: "amsterdam",   labelAz: "Amsterdam",         iata: "AMS", hotelQuery: "Amsterdam",           unsplashQuery: "Amsterdam canals Netherlands", stars: 4, nights: 4 },
  { slug: "prague",      labelAz: "Praqa",             iata: "PRG", hotelQuery: "Prague",              unsplashQuery: "Prague castle Czech Republic", stars: 4, nights: 5 },
  { slug: "vienna",      labelAz: "Vyana",             iata: "VIE", hotelQuery: "Vienna",              unsplashQuery: "Vienna Austria city",          stars: 4, nights: 5 },
  { slug: "athens",      labelAz: "Afina",             iata: "ATH", hotelQuery: "Athens",              unsplashQuery: "Athens Acropolis Greece",      stars: 4, nights: 5 },
  { slug: "lisbon",      labelAz: "Lissabon",          iata: "LIS", hotelQuery: "Lisbon",              unsplashQuery: "Lisbon Portugal city",         stars: 4, nights: 5 },
  { slug: "santorini",   labelAz: "Santorini",         iata: "JTR", hotelQuery: "Santorini",           unsplashQuery: "Santorini Greece sunset",      stars: 4, nights: 6 },
  { slug: "zurich",      labelAz: "Sürix",             iata: "ZRH", hotelQuery: "Zurich",              unsplashQuery: "Zurich Switzerland Alps",      stars: 4, nights: 5 },
  // ── Asiya-Sakit Okean ─────────────────────────────────────────────────────
  { slug: "bangkok",     labelAz: "Bangkok",           iata: "BKK", hotelQuery: "Bangkok",             unsplashQuery: "Bangkok Thailand temple",      stars: 4, nights: 7 },
  { slug: "bali",        labelAz: "Bali",              iata: "DPS", hotelQuery: "Bali",                unsplashQuery: "Bali Indonesia temple rice",   stars: 4, nights: 8 },
  { slug: "singapore",   labelAz: "Sinqapur",          iata: "SIN", hotelQuery: "Singapore",           unsplashQuery: "Singapore skyline Gardens",    stars: 5, nights: 6 },
  { slug: "tokyo",       labelAz: "Tokio",             iata: "NRT", hotelQuery: "Tokyo",               unsplashQuery: "Tokyo Japan cherry blossom",   stars: 4, nights: 7 },
  { slug: "seoul",       labelAz: "Seul",              iata: "ICN", hotelQuery: "Seoul",               unsplashQuery: "Seoul South Korea city",       stars: 4, nights: 7 },
  { slug: "kuala-lumpur",labelAz: "Kuala Lumpur",      iata: "KUL", hotelQuery: "Kuala Lumpur",        unsplashQuery: "Kuala Lumpur Malaysia towers", stars: 4, nights: 6 },
  { slug: "maldives",    labelAz: "Maldiv adaları",    iata: "MLE", hotelQuery: "Maldives",            unsplashQuery: "Maldives overwater bungalow",  stars: 5, nights: 7 },
  { slug: "sydney",      labelAz: "Sidney",            iata: "SYD", hotelQuery: "Sydney",              unsplashQuery: "Sydney Opera House Australia", stars: 4, nights: 9 },
  { slug: "phuket",      labelAz: "Phuket",            iata: "HKT", hotelQuery: "Phuket",              unsplashQuery: "Phuket Thailand beach",        stars: 4, nights: 7 },
  { slug: "hong-kong",   labelAz: "Honq Konq",         iata: "HKG", hotelQuery: "Hong Kong",           unsplashQuery: "Hong Kong skyline harbour",    stars: 4, nights: 5 },
  // ── Amerika ───────────────────────────────────────────────────────────────
  { slug: "new-york",    labelAz: "Nyu-York",          iata: "JFK", hotelQuery: "New York",            unsplashQuery: "New York Manhattan skyline",   stars: 4, nights: 7 },
  { slug: "miami",       labelAz: "Mayami",            iata: "MIA", hotelQuery: "Miami",               unsplashQuery: "Miami beach Florida sunset",   stars: 4, nights: 7 },
  { slug: "los-angeles", labelAz: "Los-Anceles",       iata: "LAX", hotelQuery: "Los Angeles",         unsplashQuery: "Los Angeles Hollywood sunset", stars: 4, nights: 8 },
  { slug: "cancun",      labelAz: "Kankun",            iata: "CUN", hotelQuery: "Cancun",              unsplashQuery: "Cancun Mexico beach resort",   stars: 5, nights: 8 },
  { slug: "toronto",     labelAz: "Toronto",           iata: "YYZ", hotelQuery: "Toronto",             unsplashQuery: "Toronto Canada city skyline",  stars: 4, nights: 7 },
  { slug: "sao-paulo",   labelAz: "San-Paulo",         iata: "GRU", hotelQuery: "Sao Paulo",           unsplashQuery: "Sao Paulo Brazil city",        stars: 4, nights: 8 },
  { slug: "buenos-aires",labelAz: "Buenos-Aires",      iata: "EZE", hotelQuery: "Buenos Aires",        unsplashQuery: "Buenos Aires Argentina city",  stars: 4, nights: 9 },
];

// Hər gün ilin günündən asılı olaraq 6 unikal destination seç (fırlanma)
function getDestinations(today: Date): DestConfig[] {
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const total = ALL_DESTINATIONS.length;
  const picked: DestConfig[] = [];
  for (let i = 0; i < 6; i++) {
    picked.push(ALL_DESTINATIONS[(dayOfYear + i * 7) % total]);
  }
  return picked;
}

function buildDescription(dest: DestConfig, flight: FlightOffer, hotel: HotelOffer): string {
  const stops = flight.stops === 0 ? "birbaşa uçuş" : `${flight.stops} dayanacaq`;
  return (
    `${dest.labelAz} istiqamətinə ${dest.nights} gecəlik tur paketi. ` +
    `Uçuş: ${flight.airline} (${stops}, gediş-dönüş, 2 nəfər). ` +
    `Otel: ${hotel.name}${hotel.stars ? ` (${hotel.stars}★)` : ""}. ` +
    `Qiymətə uçuş və ${dest.nights} gecəlik otel daxildir.`
  );
}

async function fetchUnsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=10`,
      { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as { results?: Array<{ urls?: { regular?: string } }> };
    const results = data.results ?? [];
    if (!results.length) return null;
    const pick = results[Math.floor(Math.random() * Math.min(results.length, 5))];
    return pick.urls?.regular ?? null;
  } catch {
    return null;
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader  = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret      = process.env.HOTELS_CRONSECRET;
  const cronSecret  = process.env.CRON_SECRET;

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAuthorizedSecret = secret && (authHeader === `Bearer ${secret}` || querySecret === secret);

  if (!isVercelCron && !isAuthorizedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db           = getSupabaseAdmin();
  const today        = new Date();
  const todayStr     = fmt(today);
  const departDate   = addDays(today, 30); // 30 gün sonra — Duffel "too soon" xətasından qaçmaq üçün
  const destinations = getDestinations(today);

  // Əvvəlki günün auto-turlarını deaktiv et
  await db
    .from("tours")
    .update({ is_active: false })
    .eq("auto_generated", true)
    .eq("is_active", true)
    .lt("created_at", `${todayStr}T00:00:00.000Z`);

  type Result = { destination: string; status: "ok" | "skipped"; price_azn?: number; tour_id?: string; reason?: string };
  const results: Result[] = [];

  await Promise.allSettled(
    destinations.map(async (dest) => {
      const checkin  = fmt(departDate);
      const checkout = fmt(addDays(departDate, dest.nights));

      const [flightRes, hotelRes] = await Promise.allSettled([
        searchFlights({ origin: "GYD", destination: dest.iata, date: checkin, return_date: checkout, passengers: 2 }),
        searchHotels({ destination: dest.hotelQuery, checkin, checkout, adults: 2, rooms: 1, stars: dest.stars }),
      ]);

      if (flightRes.status === "rejected" || !flightRes.value.length) {
        const reason = flightRes.status === "rejected" ? String((flightRes as PromiseRejectedResult).reason) : "no_results";
        console.warn(`[generate-tours] ${dest.slug}: uçuş tapılmadı — ${reason}`);
        results.push({ destination: dest.slug, status: "skipped", reason: `flight: ${reason}` });
        return;
      }

      if (hotelRes.status === "rejected" || !hotelRes.value.length) {
        const reason = hotelRes.status === "rejected" ? String((hotelRes as PromiseRejectedResult).reason) : "no_results";
        console.warn(`[generate-tours] ${dest.slug}: otel tapılmadı — ${reason}`);
        results.push({ destination: dest.slug, status: "skipped", reason: `hotel: ${reason}` });
        return;
      }

      const flight       = flightRes.value[0];
      const hotel        = hotelRes.value[0];
      const PAX          = 2; // cron hər zaman 2 nəfər üçün axtarır
      const totalAzn     = Math.ceil(flight.price_azn + hotel.price_marked_up);
      const priceAzn     = Math.ceil(totalAzn / PAX); // nəfər başına
      const monthLbl  = `${AZ_MONTHS[departDate.getMonth()]} ${departDate.getFullYear()}`;
      const tourName  = `${dest.labelAz} Turu — ${dest.nights} gecə / ${monthLbl}`;
      const desc      = buildDescription(dest, flight, hotel);
      const imageUrl  = await fetchUnsplashImage(dest.unsplashQuery);
      const expiresAt = addDays(today, 2).toISOString();

      const { data: inserted, error: err } = await db
        .from("tours")
        .insert({
          name:           tourName,
          destination:    dest.labelAz,
          price_azn:      priceAzn,
          start_date:     checkin,
          end_date:       checkout,
          max_seats:      10,
          booked_seats:   0,
          hotel:          hotel.name,
          description:    desc,
          image_url:      imageUrl,
          is_active:      true,
          auto_generated: true,
          expires_at:     expiresAt,
        })
        .select("id")
        .single();

      if (err || !inserted) {
        console.error(`[generate-tours] ${dest.slug} insert xətası:`, err?.message);
        results.push({ destination: dest.slug, status: "skipped", reason: `db: ${err?.message}` });
        return;
      }

      console.log(`[generate-tours] ✓ ${tourName} — ${priceAzn} AZN | id=${inserted.id}`);
      results.push({ destination: dest.slug, status: "ok", price_azn: priceAzn, tour_id: inserted.id });
    })
  );

  const created = results.filter(r => r.status === "ok").length;
  const skipped = results.filter(r => r.status === "skipped").length;

  return NextResponse.json({ ok: true, date: todayStr, created, skipped, results });
}
