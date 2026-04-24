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

function isoWeek(d: Date): number {
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const w1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

interface DestConfig {
  slug: string; labelAz: string; iata: string;
  hotelQuery: string; unsplashQuery: string;
  stars: number; nights: number;
}

function getDestinations(today: Date): DestConfig[] {
  const evenWeek = isoWeek(today) % 2 === 0;
  return [
    { slug: "antalya",  labelAz: "Antalya",        iata: "AYT", hotelQuery: "Antalya",         unsplashQuery: "Antalya Turkey beach resort",  stars: 5, nights: 7 },
    { slug: "dubai",    labelAz: "Dubai",           iata: "DXB", hotelQuery: "Dubai",            unsplashQuery: "Dubai skyline luxury hotel",   stars: 4, nights: 5 },
    { slug: "istanbul", labelAz: "İstanbul",        iata: "IST", hotelQuery: "Istanbul",         unsplashQuery: "Istanbul Bosphorus city",      stars: 4, nights: 4 },
    evenWeek
      ? { slug: "cairo", labelAz: "Qahirə",         iata: "CAI", hotelQuery: "Cairo",            unsplashQuery: "Cairo Egypt pyramids",         stars: 4, nights: 6 }
      : { slug: "sharm", labelAz: "Şarm əş-Şeyx",   iata: "SSH", hotelQuery: "Sharm El Sheikh",  unsplashQuery: "Sharm El Sheikh Red Sea beach", stars: 5, nights: 7 },
  ];
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
  const secret      = process.env.GENERATE_TOURS_SECRET;

  const authorized  = authHeader === `Bearer ${secret}` || querySecret === secret;
  if (!secret || !authorized) {
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
