import https from "https";

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

// ─── İzlənilən otellər (hid = RateHawk hotel ID) ─────────────────────────────
// Sandbox test otelləri + real otel ID-ləri (production üçün artır)
export const TRACKED_DESTINATIONS: DestinationGroup[] = [
  {
    name: "İstanbul",
    hids: [10004834, 10047711, 8819557],
  },
  {
    name: "Dubai",
    hids: [9744270, 6362880, 6682380],
  },
  {
    name: "Antalya",
    hids: [10595223, 10654204, 10678836],
  },
  {
    name: "Şarm əl-Şeyx",
    hids: [8142632, 6471709],
  },
  {
    name: "Hurgada",
    hids: [8608790, 10724071],
  },
];

interface DestinationGroup {
  name: string;
  hids: number[];
}

function getAuth(): string {
  const key = process.env.RATEHAWK_API_KEY!;
  const secret = process.env.RATEHAWK_SECRET!;
  return Buffer.from(`${key}:${secret}`).toString("base64");
}

function ratehawkPost(endpoint: string, body: object): Promise<RatehawkResponse> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const url = new URL(`${RATEHAWK_BASE}${endpoint}`);
    const isSandbox = process.env.RATEHAWK_SANDBOX === "true";

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
          Authorization: `Basic ${getAuth()}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        // Sandbox-da TLS yoxlamasını söndür (self-signed cert)
        rejectUnauthorized: !isSandbox,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`RateHawk ${endpoint} → HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          } else {
            try {
              resolve(JSON.parse(data) as RatehawkResponse);
            } catch {
              reject(new Error(`JSON parse xətası: ${data.slice(0, 100)}`));
            }
          }
        });
      }
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
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

    const hid = hotel.hid ?? hotel.id;

    offers.push({
      hotel_key: `${hid}_${checkin}_${checkout}`,
      hotel_id: String(hid),
      hotel_name: hotel.name || `Otel #${hid}`,
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

// Otel ID-ləri ilə axtarış: /search/serp/hotels/
export async function searchHotels(
  destination: DestinationGroup,
  checkin: string,
  checkout: string
): Promise<HotelOffer[]> {
  try {
    const res = await ratehawkPost("/search/serp/hotels/", {
      checkin,
      checkout,
      residency: "az",
      language: "en",
      currency: "USD",
      guests: [{ adults: 2, children: [] }],
      hids: destination.hids,
    });

    if (res.status !== "ok") {
      console.error(`RateHawk (${destination.name}): status=${res.status}`, res.error || "");
      return [];
    }

    const hotels: RatehawkHotel[] = res.data?.hotels || [];
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
interface RatehawkResponse {
  status: string;
  data?: { hotels?: RatehawkHotel[] };
  error?: string;
}

interface RatehawkRate {
  daily_prices?: string[];
  room_name?: string;
  meal?: string;
  payment_options?: {
    payment_types?: { amount?: string }[];
  };
}

interface RatehawkHotel {
  hid?: number;
  id?: string | number;
  name?: string;
  star_rating?: number;
  rates?: RatehawkRate[];
}
