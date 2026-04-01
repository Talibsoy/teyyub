const PROXY_URL = process.env.RATEHAWK_PROXY_URL;
const PROXY_SECRET = process.env.RATEHAWK_PROXY_SECRET;
const API_KEY = process.env.RATEHAWK_API_KEY;
const API_SECRET = process.env.RATEHAWK_API_SECRET;

async function ratehawkRequest(path: string, body: object) {
  if (!PROXY_URL || !API_KEY || !API_SECRET) {
    throw new Error("RateHawk env vars tapılmadı");
  }

  const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

  const res = await fetch(`${PROXY_URL}/ratehawk${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
      ...(PROXY_SECRET && { "x-proxy-secret": PROXY_SECRET }),
    },
    body: JSON.stringify(body),
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
