import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.RATEHAWK_API_KEY;
  const API_SECRET = process.env.RATEHAWK_API_SECRET;

  if (!API_KEY || !API_SECRET) {
    return NextResponse.json({ error: "Credentials yoxdur", API_KEY: !!API_KEY, API_SECRET: !!API_SECRET });
  }

  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

  try {
    const res = await fetch("https://api-sandbox.worldota.net/api/b2b/v3/search/hp/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
      body: JSON.stringify({
        id: "pullman_dubai_jumeirah_lakes_towers__hotel_and_residence",
        checkin: "2026-05-15",
        checkout: "2026-05-22",
        guests: [{ adults: 2 }],
        currency: "USD",
        language: "en",
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    const hotel = data?.data?.hotels?.[0];
    const firstRate = hotel?.rates?.[0];

    return NextResponse.json({
      ok: res.ok,
      hotelFound: !!hotel,
      rateCount: hotel?.rates?.length || 0,
      firstMeal: firstRate?.meal,
      firstPrice: firstRate?.payment_options?.payment_types?.[0]?.amount,
      roomName: firstRate?.room_name,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
