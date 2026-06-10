import { NextRequest, NextResponse } from "next/server";
import { getHotelPage } from "@/lib/ratehawk";

// Otel detal səhifəsi: static (foto, ünvan, təsvir) + otaq rate-ləri (book_hash ilə)
export async function POST(req: NextRequest) {
  try {
    const { hotel_id, checkin, checkout, adults, childAges, residency } = await req.json();
    if (!hotel_id || !checkin || !checkout) {
      return NextResponse.json({ error: "hotel_id, checkin, checkout tələb olunur" }, { status: 400 });
    }
    const guests = [{ adults: adults || 2, children: Array.isArray(childAges) ? childAges : [] }];
    const { static: staticData, rooms } = await getHotelPage(hotel_id, checkin, checkout, guests, residency || "az");
    return NextResponse.json({ ok: true, static: staticData, rooms });
  } catch (err) {
    console.error("[Hotel Page]", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
