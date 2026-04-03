import { NextRequest, NextResponse } from "next/server";
import { searchFlights, formatOffersForAI } from "@/lib/duffel";

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, date, passengers } = await req.json();

    if (!origin || !destination || !date) {
      return NextResponse.json({ error: "origin, destination və date tələb olunur" }, { status: 400 });
    }

    const offers = await searchFlights({ origin, destination, date, passengers });

    return NextResponse.json({
      offers,
      formatted: formatOffersForAI(offers),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Duffel Search]", msg);
    return NextResponse.json({ error: "Uçuş axtarışı zamanı xəta baş verdi", detail: msg }, { status: 500 });
  }
}
