import { NextRequest, NextResponse } from "next/server";
import { searchHotels, TRACKED_DESTINATIONS, getDefaultDates, HotelOffer } from "@/lib/ratehawk";
import { getSupabaseAdmin } from "@/lib/supabase";

// Vercel Cron: hər gün saat 08:00 UTC (vercel.json-da təyin edilib)
// Əl ilə çağırmaq üçün: GET /api/cron/hotels?secret=HOTELS_CRON_SECRET
//
// ARXITEKTURA QEYDI:
// googleapis (lib/google-sheets.ts-dən) statik import edilsə, serverless
// modul init zamanı OpenSSL-i dəyişir → sonrakı RateHawk HTTPS sorğusu
// ERR_OSSL_UNSUPPORTED ilə məhv olur.
// HƏLLİ: əvvəlcə BÜTÜN RateHawk sorğularını tamamla,
// SONRA lib/google-sheets-i dinamik import et.

type DestResult = {
  destination: string;
  found: number;
  updated: number;
  added: number;
  error?: string;
};

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const cronHeader = req.headers.get("authorization");

  const isVercelCron = cronHeader === `Bearer ${process.env.HOTELS_CRON_SECRET}`;
  const isManual = secret === process.env.HOTELS_CRON_SECRET;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RATEHAWK_API_KEY || !process.env.RATEHAWK_SECRET) {
    return NextResponse.json(
      { error: "RATEHAWK_API_KEY və ya RATEHAWK_SECRET təyin edilməyib" },
      { status: 500 }
    );
  }

  const { checkin, checkout } = getDefaultDates();
  const results: DestResult[] = [];
  const successfulOffers: { destName: string; offers: HotelOffer[] }[] = [];

  // ── MƏRHƏLƏ 1: Bütün RateHawk sorğuları (googleapis yoxdur) ─────────────────
  for (const dest of TRACKED_DESTINATIONS) {
    try {
      const offers = await searchHotels(dest, checkin, checkout);

      if (offers.length === 0) {
        results.push({ destination: dest.name, found: 0, updated: 0, added: 0 });
        continue;
      }

      successfulOffers.push({ destName: dest.name, offers });
      // updated/added 2ci mərhələdə doldurulacaq
      results.push({ destination: dest.name, found: offers.length, updated: 0, added: 0 });
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      const msg = `${e.message} | code=${e.code}`;
      console.error(`hotels cron — ${dest.name}:`, msg, e.stack?.slice(0, 300));
      results.push({
        destination: dest.name,
        found: -1,
        updated: 0,
        added: 0,
        error: e.message + (e.code ? ` [${e.code}]` : ""),
      });
    }
  }

  // ── MƏRHƏLƏ 2: Sheets + Supabase sinxronizasiyası ────────────────────────────
  // googleapis YALNIZ BURDA yüklənir — RateHawk sorğularından SONRA.
  if (successfulOffers.length > 0) {
    const { upsertHotelData } = await import("@/lib/google-sheets");

    for (const { destName, offers } of successfulOffers) {
      try {
        const { updated, added } = await upsertHotelData(offers);
        await syncToSupabase(offers);

        const r = results.find((x) => x.destination === destName);
        if (r) {
          r.updated = updated;
          r.added = added;
        }
      } catch (err) {
        const e = err as Error;
        console.error(`hotels cron sheets/supabase — ${destName}:`, e.message);
        const r = results.find((x) => x.destination === destName);
        if (r) r.error = `sheets: ${e.message}`;
      }
    }
  }

  const total = results.reduce(
    (s, r) => ({ updated: s.updated + r.updated, added: s.added + r.added }),
    { updated: 0, added: 0 }
  );

  console.log(
    `[hotels-cron] ${checkin}→${checkout} | updated=${total.updated} added=${total.added}`,
    results
  );

  return NextResponse.json({ ok: true, checkin, checkout, results, ...total });
}

// ─── Supabase sinxronizasiyası ───────────────────────────────────────────────
async function syncToSupabase(offers: HotelOffer[]) {
  const supabase = getSupabaseAdmin();

  for (const h of offers) {
    await supabase.from("hotels").upsert(
      {
        hotel_key: h.hotel_key,
        hotel_id: h.hotel_id,
        hotel_name: h.hotel_name,
        destination: h.destination,
        checkin: h.checkin,
        checkout: h.checkout,
        price_usd: h.price_usd,
        stars: h.stars,
        room_type: h.room_type,
        meal: h.meal,
        updated_at: h.updated_at,
        status: "active",
      },
      { onConflict: "hotel_key" }
    );
  }
}
