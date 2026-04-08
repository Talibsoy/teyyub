import { NextRequest, NextResponse } from "next/server";
import { searchHotels, TRACKED_DESTINATIONS, getDefaultDates } from "@/lib/ratehawk";
import { upsertHotelData } from "@/lib/google-sheets";
import { getSupabaseAdmin } from "@/lib/supabase";

// Vercel Cron: hər 4 saatda bir (vercel.json-da təyin edilib)
// Əl ilə çağırmaq üçün: GET /api/cron/hotels?secret=CRON_SECRET

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const cronHeader = req.headers.get("authorization");

  // Auth yoxlaması — Vercel Cron öz Bearer token göndərir, manual çağırış secret param istifadə edir
  const isVercelCron = cronHeader === `Bearer ${process.env.HOTELS_CRON_SECRET}`;
  const isManual = secret === process.env.HOTELS_CRON_SECRET;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RATEHAWK_API_KEY || !process.env.RATEHAWK_SECRET) {
    return NextResponse.json({ error: "RATEHAWK_API_KEY və ya RATEHAWK_SECRET təyin edilməyib" }, { status: 500 });
  }

  const { checkin, checkout } = getDefaultDates();
  const results: { destination: string; found: number; updated: number; added: number; error?: string }[] = [];

  for (const dest of TRACKED_DESTINATIONS) {
    try {
      const offers = await searchHotels(dest, checkin, checkout);

      if (offers.length === 0) {
        results.push({ destination: dest.name, found: 0, updated: 0, added: 0 });
        continue;
      }

      // Google Sheets-ə upsert
      const { updated, added } = await upsertHotelData(offers);

      // Supabase-ə də sinxronlaşdır
      await syncToSupabase(offers);

      results.push({ destination: dest.name, found: offers.length, updated, added });
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      const msg = `${e.message} | code=${e.code} | stack=${e.stack?.slice(0, 200)}`;
      console.error(`hotels cron — ${dest.name}:`, msg);
      results.push({ destination: dest.name, found: -1, updated: 0, added: 0, error: e.message + (e.code ? ` [${e.code}]` : "") });
      break; // ilk xəta yetər, qalanları tək əlavə et
    }
  }

  const total = results.reduce((s, r) => ({ updated: s.updated + r.updated, added: s.added + r.added }), { updated: 0, added: 0 });

  console.log(`[hotels-cron] ${checkin}→${checkout} | updated=${total.updated} added=${total.added}`, results);

  return NextResponse.json({ ok: true, checkin, checkout, results, ...total });
}

// ─── Supabase sinxronizasiyası ───────────────────────────────────────────────
async function syncToSupabase(offers: Awaited<ReturnType<typeof searchHotels>>) {
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
