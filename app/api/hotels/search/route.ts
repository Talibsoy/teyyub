import { NextRequest, NextResponse } from "next/server";
import { searchHotels, TRACKED_DESTINATIONS, HotelOffer as RHHotelOffer } from "@/lib/ratehawk";

export async function POST(req: NextRequest) {
  try {
    const { destination, checkin, checkout, adults, childAges, residency, rooms, stars } = await req.json();

    if (!destination || !checkin || !checkout) {
      return NextResponse.json({ error: "destination, checkin, checkout tələb olunur" }, { status: 400 });
    }

    // RateHawk destination matching (checks if search is a direct hid)
    const query = destination.toLowerCase().trim();
    const isHid = /^\d+$/.test(query);
    let destGroup;

    if (isHid) {
      destGroup = {
        name: `Hotel #${query}`,
        hids: [parseInt(query, 10)]
      };
    } else {
      destGroup = TRACKED_DESTINATIONS.find((d) => {
        const name = d.name.toLowerCase();
        return (
          name.includes(query) ||
          query.includes(name) ||
          (query.includes("sharm") && name.includes("şarm")) ||
          (query.includes("hurghada") && name.includes("hurgada"))
        );
      });
    }

    if (!destGroup) {
      // Sandbox constraint: Only return tracked destinations
      return NextResponse.json({
        ok: true,
        hotels: [],
        message: "Sandbox rejimində yalnız Los Angeles, İstanbul, Dubai, Antalya, Şarm əş-Şeyx, Hurgada və ya Otel ID-si (hid) axtarıla bilər."
      });
    }

    const guests = [{ adults: adults || 2, children: Array.isArray(childAges) ? childAges : [] }];
    const rhOffers = await searchHotels(destGroup, checkin, checkout, guests, residency || "az");

    const nights = Math.max(1, Math.ceil(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
    ));

    // Map RateHawk HotelOffer to the schema expected by the client frontend
    const hotels = rhOffers
      .filter((h) => {
        if (!stars) return true;
        return h.stars >= stars;
      })
      .map((h) => {
        const originalAzn = Math.round(h.price_usd * 1.70);
        // RateHawk price_usd is already marked up by 15% in lib/ratehawk.ts (price_usd = totalPrice * 1.15)
        const priceMarkedUp = Math.ceil(h.price_usd * 1.70);

        return {
          id:              h.hotel_id,
          name:            h.hotel_name,
          destination:     destGroup.name,
          checkin:         h.checkin,
          checkout:        h.checkout,
          nights,
          price_original:  originalAzn,
          price_marked_up: priceMarkedUp,
          currency:        "AZN",
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

// Debug endpoint — GET /api/hotels/search?dest=Antalya
export async function GET(req: NextRequest) {
  const dest = req.nextUrl.searchParams.get("dest") || "Antalya";
  const destGroup = TRACKED_DESTINATIONS.find(
    (d) => d.name.toLowerCase().includes(dest.toLowerCase()) || dest.toLowerCase().includes(d.name.toLowerCase())
  );
  if (!destGroup) {
    return NextResponse.json({ error: "Destination not tracked in sandbox" });
  }
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 30);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 7);
  try {
    const hotels = await searchHotels(
      destGroup,
      checkin.toISOString().split("T")[0],
      checkout.toISOString().split("T")[0]
    );
    return NextResponse.json({ ok: true, count: hotels.length, hotels });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

