import { NextRequest, NextResponse } from "next/server";
import { searchHotels, searchHotelsByRegion, multicomplete, HotelOffer as RHHotelOffer } from "@/lib/ratehawk";

export async function POST(req: NextRequest) {
  try {
    const { destination, checkin, checkout, adults, childAges, residency, rooms, stars } = await req.json();

    if (!destination || !checkin || !checkout) {
      return NextResponse.json({ error: "destination, checkin, checkout tələb olunur" }, { status: 400 });
    }

    const query = destination.trim();
    const isHid = /^\d+$/.test(query);
    const guests = [{ adults: adults || 2, children: Array.isArray(childAges) ? childAges : [] }];

    let rhOffers: RHHotelOffer[];
    let destName = query;

    if (isHid) {
      // Birbaşa otel ID (hid) ilə axtarış
      rhOffers = await searchHotels(
        { name: `Hotel #${query}`, hids: [parseInt(query, 10)] },
        checkin, checkout, guests, residency || "az"
      );
    } else {
      // RateHawk-ın əsl axtarışı: multicomplete ilə region tap, sonra bütün otelləri gətir
      const mc = await multicomplete(query);
      const region = mc.regions[0];
      if (!region) {
        return NextResponse.json({
          ok: true,
          hotels: [],
          message: `"${query}" üçün region tapılmadı. Başqa şəhər və ya otel ID-si yazın.`,
        });
      }
      destName = region.name;
      rhOffers = await searchHotelsByRegion(region.id, region.name, checkin, checkout, guests, residency || "az");
    }

    const nights = Math.max(1, Math.ceil(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
    ));

    // Map RateHawk HotelOffer to the schema expected by the client frontend
    const hotels = rhOffers
      .filter((h) => {
        // RateHawk axtarış cavabı ulduz qaytarmaya bilər (null) — belə otelləri
        // filtrdən atma, yoxsa ulduz seçimi bütün nəticələri silir.
        if (!stars) return true;
        return !h.stars || h.stars >= stars;   // ulduz məlum deyilsə (0/null), saxla
      })
      .map((h) => {
        // Valyuta yalnız USD (RateHawk native USD; price_usd artıq +15% markup-ludur)
        const originalUsd = Math.round(h.price_usd / 1.15);
        const priceMarkedUp = Math.ceil(h.price_usd);

        return {
          // hp/info string id tələb edir (rəqəmli hid yox) — detal səhifəsi üçün
          id:              h.hotel_string_id || h.hotel_id,
          name:            h.hotel_name,
          destination:     destName,
          checkin:         h.checkin,
          checkout:        h.checkout,
          nights,
          price_original:  originalUsd,
          price_marked_up: priceMarkedUp,
          currency:        "USD",
          stars:           h.stars || null,
          rating:          null,
          review_count:    0,
          book_hash:       h.book_hash || null,
          meal:            h.meal || "",
          room_type:       h.room_type || "",
          booking_url:     `/booking/prebook?hotel_id=${h.hotel_id}&checkin=${h.checkin}&checkout=${h.checkout}`,
          address:         h.address || "",
          facilities:      h.included_services || [],
        };
      });

    return NextResponse.json({ ok: true, hotels });
  } catch (err) {
    console.error("[Hotels Search]", err);
    return NextResponse.json({ ok: false, hotels: [] });
  }
}

// Debug endpoint — GET /api/hotels/search?dest=Los Angeles
export async function GET(req: NextRequest) {
  const dest = req.nextUrl.searchParams.get("dest") || "Los Angeles";
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 30);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 7);
  const ci = checkin.toISOString().split("T")[0];
  const co = checkout.toISOString().split("T")[0];
  try {
    const mc = await multicomplete(dest);
    const region = mc.regions[0];
    if (!region) return NextResponse.json({ error: "Region not found", query: dest });
    const hotels = await searchHotelsByRegion(region.id, region.name, ci, co);
    return NextResponse.json({ ok: true, region: region.name, count: hotels.length, hotels: hotels.slice(0, 10) });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

