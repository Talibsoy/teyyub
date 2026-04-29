import { NextRequest, NextResponse } from "next/server";
import { searchHotels, debugSearch } from "@/lib/hotels";

export async function POST(req: NextRequest) {
  try {
    const { destination, checkin, checkout, adults, rooms, currency, stars } = await req.json();

    if (!destination || !checkin || !checkout) {
      return NextResponse.json({ error: "destination, checkin, checkout tələb olunur" }, { status: 400 });
    }

    const hotels = await searchHotels({ destination, checkin, checkout, adults, rooms, currency, stars });
    return NextResponse.json({ ok: true, hotels });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "RATE_LIMIT") {
      return NextResponse.json({ ok: false, hotels: [], rateLimited: true }, { status: 429 });
    }
    console.error("[Hotels Search]", err);
    return NextResponse.json({ ok: false, hotels: [] });
  }
}

// Debug endpoint — GET /api/hotels/search?dest=Antalya
export async function GET(req: NextRequest) {
  const dest = req.nextUrl.searchParams.get("dest") || "Antalya";
  const result = await debugSearch(dest);
  return NextResponse.json(result);
}
