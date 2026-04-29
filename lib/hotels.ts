const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = "booking-com15.p.rapidapi.com";
const BASE          = `https://${RAPIDAPI_HOST}/api/v1/hotels`;
const MARKUP        = 1.17; // 17% xidmət haqqı

export interface HotelOffer {
  id:              string;
  name:            string;
  destination:     string;
  checkin:         string;
  checkout:        string;
  nights:          number;
  price_original:  number;   // Booking.com qiyməti (AZN)
  price_marked_up: number;   // +15% (müştəriyə göstərilən)
  currency:        string;
  stars:           number | null;
  rating:          number | null;
  review_count:    number;
  booking_url:     string;
  address:         string;
  facilities:      string[];
}

async function rapidGet(path: string, params: Record<string, string>) {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY env var yoxdur");
  const url = new URL(`${BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key":  RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    signal: AbortSignal.timeout(10000),
  });
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) throw new Error(`RapidAPI ${res.status}`);
  return res.json();
}

// Destination ID-ni tap (şəhər adı → Booking.com dest_id)
async function getDestId(query: string): Promise<{ dest_id: string; dest_type: string } | null> {
  try {
    const data = await rapidGet("searchDestination", { query, languagecode: "en-us" });
    const first = data.data?.[0];
    if (!first) return null;
    // search_type üçün CITY, HOTEL, DISTRICT formatı lazımdır
    const rawType = String(first.dest_type || "CITY").toUpperCase();
    return { dest_id: String(first.dest_id), dest_type: rawType };
  } catch {
    return null;
  }
}

export async function searchHotels(params: {
  destination: string;
  checkin:     string;   // YYYY-MM-DD
  checkout:    string;   // YYYY-MM-DD
  adults?:     number;
  rooms?:      number;
  currency?:   string;
  stars?:      number;   // 3, 4 və ya 5
}): Promise<HotelOffer[]> {
  if (!RAPIDAPI_KEY) return [];

  const dest = await getDestId(params.destination);
  if (!dest) return [];

  const nights = Math.max(1, Math.ceil(
    (new Date(params.checkout).getTime() - new Date(params.checkin).getTime()) / 86400000
  ));

  const searchParams: Record<string, string> = {
    dest_id:       dest.dest_id,
    search_type:   dest.dest_type,
    arrival_date:  params.checkin,
    departure_date: params.checkout,
    adults:        String(params.adults || 2),
    room_qty:      String(params.rooms || 1),
    currency_code: params.currency || "AZN",
    languagecode:  "en-us",
    sort_by:       "popularity",
  };

  let data: { data?: { hotels?: unknown[] } };
  try {
    data = await rapidGet("searchHotels", searchParams);
  } catch (e) {
    console.error("[Hotels] searchHotels API error:", e);
    return [];
  }

  let hotels = (data.data?.hotels || []) as Record<string, unknown>[];

  // Ulduz filtri — propertyClass VƏ accuratePropertyClass hər ikisini yoxla
  if (params.stars) {
    const minStars = params.stars;
    const filtered = hotels.filter((h) => {
      const prop = (h.property || {}) as Record<string, unknown>;
      const cls = Math.max(
        Number(prop.propertyClass) || 0,
        Number(prop.accuratePropertyClass) || 0
      );
      return cls >= minStars;
    });
    if (filtered.length > 0) hotels = filtered;
    // filtered boşdursa — bütün nəticələri saxla (heç olmasa bir şey göstər)
  }

  return hotels.slice(0, 6).map((h) => {
    const prop = (h.property || {}) as Record<string, unknown>;
    const breakdown = ((prop.priceBreakdown as Record<string, unknown>) || {});
    const gross = ((breakdown.grossPrice as Record<string, unknown>) || {});
    const original = Number(gross.value) || 0;
    const marked   = Math.ceil(original * MARKUP);

    const hotelId   = String(h.hotel_id || prop.id || "");
    const countryCode = String(prop.countryCode || "").toLowerCase();
    const bookingUrl = hotelId
      ? `https://www.booking.com/hotel/${countryCode}/${hotelId}.html?checkin=${params.checkin}&checkout=${params.checkout}&group_adults=${params.adults || 2}&no_rooms=${params.rooms || 1}`
      : "https://www.booking.com";

    const topFacilities = ((prop.facilities as unknown[]) || [])
      .slice(0, 5)
      .map((f) => String((f as Record<string, unknown>).name || f));

    return {
      id:              hotelId,
      name:            String(prop.name || ""),
      destination:     params.destination,
      checkin:         params.checkin,
      checkout:        params.checkout,
      nights,
      price_original:  original,
      price_marked_up: marked,
      currency:        params.currency || "AZN",
      stars:           Math.max(Number(prop.propertyClass), Number(prop.accuratePropertyClass)) || null,
      rating:          Number(prop.reviewScore) || null,
      review_count:    Number(prop.reviewCount) || 0,
      booking_url:     bookingUrl,
      address:         String(prop.wishlistName || prop.name || ""),
      facilities:      topFacilities,
    } satisfies HotelOffer;
  }).filter(h => h.price_marked_up > 0);
}

// Diaqnostika — hansı addımda problem olduğunu göstərir
export async function debugSearch(query: string) {
  const keySet = !!RAPIDAPI_KEY;
  if (!keySet) return { step: "KEY_MISSING", keySet, dest: null, hotelsRaw: null };

  let dest: { dest_id: string; dest_type: string } | null = null;
  let destRaw: unknown = null;
  try {
    const data = await rapidGet("searchDestination", { query, languagecode: "en-us" });
    destRaw = data?.data?.slice?.(0, 2);
    const first = data.data?.[0];
    if (first) dest = { dest_id: String(first.dest_id), dest_type: String(first.dest_type || "CITY").toUpperCase() };
  } catch (e) {
    return { step: "DEST_ERROR", keySet, error: String(e), destRaw };
  }

  if (!dest) return { step: "DEST_NOT_FOUND", keySet, destRaw };

  let hotelsRaw: unknown = null;
  try {
    const data = await rapidGet("searchHotels", {
      dest_id: dest.dest_id, search_type: dest.dest_type,
      arrival_date: "2026-06-21", departure_date: "2026-06-28",
      adults: "2", room_qty: "1", currency_code: "AZN",
      languagecode: "en-us", sort_by: "popularity",
    });
    const hotels = data?.data?.hotels || [];
    hotelsRaw = { count: hotels.length, first: hotels[0]?.property?.name };
  } catch (e) {
    return { step: "SEARCH_ERROR", keySet, dest, error: String(e) };
  }

  return { step: "OK", keySet, dest, hotelsRaw };
}
