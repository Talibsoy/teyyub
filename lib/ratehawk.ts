// Sandbox: api-sandbox.worldota.net | Production: api.worldota.net
const RATEHAWK_BASE =
  process.env.RATEHAWK_SANDBOX === "true"
    ? "https://api-sandbox.worldota.net/api/b2b/v3"
    : "https://api.worldota.net/api/b2b/v3";

export interface HotelOffer {
  hotel_key: string;   // unikal açar: hotel_id_checkin_checkout
  hotel_id: string;
  hotel_name: string;
  destination: string;
  checkin: string;
  checkout: string;
  price_usd: number;
  stars: number;
  room_type: string;
  meal: string;
  updated_at: string;
}

// Populyar destinasiyalar — region_id RateHawk B2B panelinə görə
export const TRACKED_DESTINATIONS = [
  { name: "İstanbul",         region_id: 3413  },
  { name: "Dubai",            region_id: 3014  },
  { name: "Antalya",          region_id: 8077  },
  { name: "Şarm əl-Şeyx",    region_id: 8097  },
  { name: "Hurgada",          region_id: 8096  },
  { name: "Maldiv adaları",   region_id: 895   },
  { name: "Bali",             region_id: 90371 },
  { name: "Barselona",        region_id: 3413  }, // düzəlt lazım olsa
];

function getAuth(): string {
  const key = process.env.RATEHAWK_API_KEY!;
  const secret = process.env.RATEHAWK_SECRET!;
  return Buffer.from(`${key}:${secret}`).toString("base64");
}

async function ratehawkPost(endpoint: string, body: object) {
  const res = await fetch(`${RATEHAWK_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`RateHawk ${endpoint} → HTTP ${res.status}`);
  }
  return res.json();
}

function parseHotels(
  hotels: RatehawkHotel[],
  destination: string,
  checkin: string,
  checkout: string
): HotelOffer[] {
  const offers: HotelOffer[] = [];

  for (const hotel of hotels) {
    const rate = hotel.rates?.[0];
    if (!rate) continue;

    // Ümumi qiyməti hesabla (gündəlik qiymətlərin cəmi)
    const totalPrice = Array.isArray(rate.daily_prices)
      ? rate.daily_prices.reduce((sum: number, p: string) => sum + parseFloat(p || "0"), 0)
      : parseFloat(rate.payment_options?.payment_types?.[0]?.amount || "0");

    if (totalPrice <= 0) continue;

    offers.push({
      hotel_key: `${hotel.id}_${checkin}_${checkout}`,
      hotel_id: String(hotel.id),
      hotel_name: hotel.name || "Naməlum otel",
      destination,
      checkin,
      checkout,
      price_usd: Math.round(totalPrice * 100) / 100,
      stars: hotel.star_rating || 0,
      room_type: rate.room_name || "",
      meal: rate.meal || "room_only",
      updated_at: new Date().toISOString(),
    });
  }

  return offers;
}

// RateHawk axtarışı polling-li: status "processing" olarsa gözləyir
async function pollSearch(searchId: string, maxWaitMs = 15000): Promise<RatehawkHotel[]> {
  const interval = 2000;
  let waited = 0;

  while (waited < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));
    waited += interval;

    const res = await ratehawkPost("/search/serp/region/", { id: searchId });
    if (res.status === "ok") {
      return res.data?.hotels || [];
    }
    if (res.status === "error") break;
  }

  return [];
}

export async function searchHotels(
  destination: { name: string; region_id: number },
  checkin: string,
  checkout: string,
  hotelsLimit = 8
): Promise<HotelOffer[]> {
  try {
    const requestId = `nt_${destination.region_id}_${Date.now()}`;

    const startRes = await ratehawkPost("/search/serp/region/", {
      id: requestId,
      checkin,
      checkout,
      residency: "az",
      language: "en",
      guests: [{ adults: 2, children: [] }],
      region_id: destination.region_id,
      hotels_limit: hotelsLimit,
    });

    let hotels: RatehawkHotel[] = [];

    if (startRes.status === "ok") {
      hotels = startRes.data?.hotels || [];
    } else if (startRes.status === "processing") {
      hotels = await pollSearch(startRes.data?.id || requestId);
    }

    return parseHotels(hotels, destination.name, checkin, checkout);
  } catch (err) {
    console.error(`RateHawk searchHotels (${destination.name}):`, err);
    return [];
  }
}

// Növbəti 30 gün sonra checkin, 7 gecəlik checkout
export function getDefaultDates(): { checkin: string; checkout: string } {
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + 30);

  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 7);

  return {
    checkin: checkin.toISOString().split("T")[0],
    checkout: checkout.toISOString().split("T")[0],
  };
}

// ─── Tip köməkçiləri ─────────────────────────────────────────────────────────
interface RatehawkRate {
  daily_prices?: string[];
  room_name?: string;
  meal?: string;
  payment_options?: {
    payment_types?: { amount?: string }[];
  };
}

interface RatehawkHotel {
  id: string | number;
  name?: string;
  star_rating?: number;
  rates?: RatehawkRate[];
}
