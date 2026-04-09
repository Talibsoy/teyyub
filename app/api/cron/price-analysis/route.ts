import { NextRequest, NextResponse } from "next/server";
import { analyzeAllDestinations, PriceReport } from "@/lib/price-agent";
import { supabaseAdmin } from "@/lib/supabase";

// Vercel Cron + manual trigger üçün
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
    ?? new URL(req.url).searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Növbəti 30 gün: checkin, 7 gecə
    const checkin  = new Date();
    checkin.setDate(checkin.getDate() + 30);
    const checkout = new Date(checkin);
    checkout.setDate(checkout.getDate() + 7);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    console.log("[PriceAgent] Analiz başlanır...");
    const reports = await analyzeAllDestinations({
      checkin:  fmt(checkin),
      checkout: fmt(checkout),
      guests:   2,
    });

    // Supabase-ə yaz (upsert: destination + checkin)
    const rows = reports.map(r => ({
      destination:   r.destination,
      origin:        r.origin,
      checkin:       r.checkin,
      checkout:      r.checkout,
      nights:        r.nights,
      guests:        r.guests,
      analyzed_at:   r.analyzed_at,
      flights:       r.flights,
      hotels:        r.hotels,
      packages:      r.packages,
      summary:       r.summary,
    }));

    const { error } = await supabaseAdmin
      .from("price_reports")
      .upsert(rows, { onConflict: "destination,checkin" });

    if (error) {
      console.error("[PriceAgent] DB xətası:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[PriceAgent] ${reports.length} destinasiya analiz edildi`);
    return NextResponse.json({
      ok:           true,
      destinations: reports.length,
      summaries:    reports.map(r => ({ destination: r.destination, summary: r.summary })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PriceAgent] Xəta:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
