import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/require-auth";
import { publishTourToAllChannels } from "@/lib/social-post";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      name, destination, price_azn, price_usd,
      start_date, end_date, max_seats, hotel,
      description, image_url, itinerary, includes, excludes,
      is_active,
    } = body;

    if (!name || !destination || !price_azn) {
      return NextResponse.json({ error: "name, destination və price_azn tələb olunur" }, { status: 400 });
    }

    const { data: tour, error } = await supabase
      .from("tours")
      .insert([{
        name,
        destination,
        price_azn:  parseFloat(price_azn),
        price_usd:  price_usd  ? parseFloat(price_usd)  : null,
        start_date: start_date || null,
        end_date:   end_date   || null,
        max_seats:  parseInt(max_seats) || 20,
        hotel:      hotel       || null,
        description: description || null,
        image_url:  image_url   || null,
        itinerary:  itinerary   || null,
        includes:   includes    || null,
        excludes:   excludes    || null,
        is_active:  is_active   ?? true,
      }])
      .select()
      .single();

    if (error || !tour) {
      return NextResponse.json({ error: "Tur saxlanıla bilmədi" }, { status: 500 });
    }

    // Sosial media paylaşımı — xəta olsa belə tur saxlanılır
    if (is_active !== false) {
      publishTourToAllChannels(tour).catch((err) =>
        console.error("[Tours API] Social post xəta:", err)
      );
    }

    return NextResponse.json({ tour });
  } catch (err) {
    console.error("[Tours API] Xəta:", err);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
