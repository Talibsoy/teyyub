const API_KEY    = process.env.RATEHAWK_API_KEY;
const API_SECRET = process.env.RATEHAWK_API_SECRET;
const BASE       = "https://api-sandbox.worldota.net";

// Sandbox test hotelləri (production-da multicomplete ilə dinamik alınır)
const DESTINATION_HOTELS: Record<string, string[]> = {
  dubai:     ["pullman_dubai_jumeirah_lakes_towers__hotel_and_residence"],
  paris:     ["hotel_monsieur", "aparthotel_adagio_paris_montmartre_by_pierre_vacances"],
  antalya:   ["key_view_the_residences"],
  istanbul:  ["key_view_the_residences"],
  losangeles:["downtown_la_vacation_apartments_by_stay_city_rentals_3", "rosa_bell_motel_los_angeles"],
};

function auth(): string {
  if (!API_KEY || !API_SECRET) throw new Error("RATEHAWK credentials tapılmadı");
  return "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
}

async function post(path: string, body: object) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RateHawk ${res.status}: ${err}`);
  }
  return res.json();
}

// Destination-a görə hotel ID-lərini tap
function getHotelIds(destination: string): string[] {
  const d = destination.toLowerCase().replace(/\s+/g, "");
  for (const [key, ids] of Object.entries(DESTINATION_HOTELS)) {
    if (d.includes(key) || key.includes(d)) return ids;
  }
  // Default: Dubai test otelləri
  return DESTINATION_HOTELS["dubai"];
}

// ── Əsas axtarış: HP (Hotel Page) endpoint ──────────────────────────────────
export async function searchHotels(params: {
  destination: string;
  checkin: string;   // YYYY-MM-DD
  checkout: string;  // YYYY-MM-DD
  guests: number;
  currency?: string;
}): Promise<HotelResult[]> {
  const hotelIds = getHotelIds(params.destination);
  const results: HotelResult[] = [];

  for (const hotelId of hotelIds) {
    try {
      const data = await post("/api/b2b/v3/search/hp/", {
        id: hotelId,
        checkin: params.checkin,
        checkout: params.checkout,
        guests: [{ adults: params.guests }],
        currency: params.currency || "USD",
        language: "en",
      });

      const hotel = data?.data?.hotels?.[0];
      if (!hotel || !hotel.rates?.length) continue;

      // Ən ucuz otaq
      const rate = hotel.rates[0];
      const nights = Math.round(
        (new Date(params.checkout).getTime() - new Date(params.checkin).getTime()) / 86400000
      );
      const totalUsd = parseFloat(rate.payment_options?.payment_types?.[0]?.amount || "0");
      const perNight = nights > 0 ? totalUsd / nights : totalUsd;

      results.push({
        id: hotelId,
        name: formatHotelName(hotelId),
        roomName: rate.room_name || "Standart otaq",
        stars: rate.rg_ext?.class || 3,
        pricePerNight: Math.ceil(perNight),
        totalPrice: Math.ceil(totalUsd),
        currency: "USD",
        nights,
        meal: rate.meal || "nomeal",
        bookHash: rate.book_hash,
      });
    } catch {
      // Bu oteli keç, növbətisinə bax
    }
  }

  return results;
}

// AI üçün formatlanmış nəticə
export async function searchHotelsForAI(params: {
  destination: string;
  checkin: string;
  checkout: string;
  guests: number;
}): Promise<string> {
  try {
    const hotels = await searchHotels(params);
    if (!hotels.length) {
      return `${params.destination} üçün hal-hazırda otel tapılmadı.`;
    }

    const nights = hotels[0].nights;
    const lines = hotels.map(h => {
      const stars = "★".repeat(h.stars);
      const meal = h.meal === "breakfast" ? " (Səhər yeməyi daxil)" : "";
      return `• ${h.name} ${stars}\n  Otaq: ${h.roomName}${meal}\n  Qiymət: $${h.pricePerNight}/gecə (${nights} gecə = $${h.totalPrice})`;
    });

    return `${params.destination} — ${params.checkin} – ${params.checkout} (${nights} gecə, ${params.guests} nəfər):\n\n${lines.join("\n\n")}`;
  } catch (e) {
    return `Otel axtarışında xəta: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// Hotel adını ID-dən oxunaqlı formata çevir
function formatHotelName(id: string): string {
  return id
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface HotelResult {
  id: string;
  name: string;
  roomName: string;
  stars: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  nights: number;
  meal: string;
  bookHash: string;
}
