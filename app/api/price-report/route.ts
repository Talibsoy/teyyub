import { NextRequest, NextResponse } from "next/server";
import { analyzePrices } from "@/lib/price-agent";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET  /api/price-report?destination=İstanbul
 *      → DB-dən son hesabatı qaytarır (cache)
 *
 * POST /api/price-report
 *      { destination, checkin, checkout, guests }
 *      → Real-time analiz aparır + DB-yə yazır
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get("destination");

  if (!destination) {
    // Bütün son hesabatlar
    const { data, error } = await supabaseAdmin
      .from("price_reports")
      .select("destination, checkin, checkout, packages, summary, analyzed_at")
      .order("analyzed_at", { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reports: data });
  }

  // Bir destinasiya üçün son hesabat
  const { data, error } = await supabaseAdmin
    .from("price_reports")
    .select("*")
    .eq("destination", destination)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Hesabat tapılmadı" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, checkin, checkout, guests = 2 } = body;

    if (!destination || !checkin || !checkout) {
      return NextResponse.json(
        { error: "destination, checkin, checkout tələb olunur" },
        { status: 400 }
      );
    }

    const report = await analyzePrices({ destination, checkin, checkout, guests });

    // DB-yə yaz
    await supabaseAdmin.from("price_reports").upsert({
      destination:  report.destination,
      origin:       report.origin,
      checkin:      report.checkin,
      checkout:     report.checkout,
      nights:       report.nights,
      guests:       report.guests,
      analyzed_at:  report.analyzed_at,
      flights:      report.flights,
      hotels:       report.hotels,
      packages:     report.packages,
      summary:      report.summary,
    }, { onConflict: "destination,checkin" });

    return NextResponse.json(report);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
