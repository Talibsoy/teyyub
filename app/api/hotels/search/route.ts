import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/hotels";

export async function POST(req: NextRequest) {
  try {
    const { destination, checkin, checkout, adults, rooms, currency, stars } = await req.json();

    if (!destination || !checkin || !checkout) {
      return NextResponse.json({ error: "destination, checkin, checkout tələb olunur" }, { status: 400 });
    }

    const hotels = await searchHotels({ destination, checkin, checkout, adults, rooms, currency, stars });
    return NextResponse.json({ ok: true, hotels });
  } catch (err) {
    console.error("[Hotels Search]", err);
    return NextResponse.json({ ok: false, hotels: [] });
  }
}
