const API_KEY = process.env.RATEHAWK_API_KEY;
const API_SECRET = process.env.RATEHAWK_API_SECRET;
const RATEHAWK_BASE = "https://api-sandbox.worldota.net";

async function ratehawkRequest(path: string, body: object) {
  if (!API_KEY || !API_SECRET) {
    throw new Error("RATEHAWK_API_KEY və ya RATEHAWK_API_SECRET tapılmadı");
  }

  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

  const res = await fetch(`${RATEHAWK_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RateHawk xətası ${res.status}: ${err}`);
  }

  return res.json();
}

// Otel axtarışı
export async function searchHotels(params: {
  destination: string;
  checkin: string;   // YYYY-MM-DD
  checkout: string;  // YYYY-MM-DD
  guests: number;
  currency?: string;
}) {
  return ratehawkRequest("/api/b2b/v3/search/serp/hotels/", {
    query: params.destination,
    checkin: params.checkin,
    checkout: params.checkout,
    guests: [{ adults: params.guests }],
    currency: params.currency || "USD",
    language: "az",
    page: 1,
  });
}

// Otel detalları
export async function getHotelInfo(hotelId: string) {
  return ratehawkRequest("/api/b2b/v3/hotel/info/", {
    id: hotelId,
    language: "az",
  });
}

// Bron et
export async function createBooking(params: {
  bookHash: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}) {
  return ratehawkRequest("/api/b2b/v3/order/booking/form/fill/", {
    book_hash: params.bookHash,
    language: "az",
    user_ip: "0.0.0.0",
    guests: [
      {
        first_name: params.guestName.split(" ")[0],
        last_name: params.guestName.split(" ").slice(1).join(" ") || "-",
        email: params.guestEmail,
        phone: params.guestPhone,
      },
    ],
  });
}
