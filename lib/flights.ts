const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = "fly-scraper.p.rapidapi.com";
const COMMISSION = 1.15; // 15% komissiya

export interface FlightSearchParams {
  originSkyId: string;      // məs. "GYD" (Bakı)
  destinationSkyId: string; // məs. "IST" (İstanbul)
  departureDate: string;    // YYYY-MM-DD
  returnDate?: string;      // YYYY-MM-DD (gidiş-dönüş üçün)
  adults?: number;
  currency?: string;
  sort?: "cheapest" | "fastest" | "best";
}

export interface FlightResult {
  price: number;
  currency: string;
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  deepLink?: string;
}

export async function searchRoundtripFlights(params: FlightSearchParams): Promise<FlightResult[]> {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY tapılmadı");

  const qs = new URLSearchParams({
    originSkyId: params.originSkyId,
    destinationSkyId: params.destinationSkyId,
    departureDate: params.departureDate,
    ...(params.returnDate ? { returnDate: params.returnDate } : {}),
    adults: String(params.adults || 1),
    currency: params.currency || "USD",
    sort: params.sort || "cheapest",
  });

  const endpoint = params.returnDate
    ? `/v2/flights/search-roundtrip?${qs}`
    : `/v2/flights/search-oneway?${qs}`;

  const res = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Flight API xətası: ${res.status}`);
  }

  const data = await res.json();

  // Nəticələri normalize et
  const itineraries = data?.data?.itineraries || data?.itineraries || [];

  return itineraries.slice(0, 10).map((item: Record<string, unknown>) => {
    const legs = (item.legs as Record<string, unknown>[]) || [];
    const firstLeg = legs[0] || {};
    const carriers = (firstLeg.carriers as Record<string, unknown>) || {};
    const marketing = (carriers.marketing as Record<string, unknown>[])?.[0] || {};

    return {
      price: Math.ceil(((item.price as Record<string, unknown>)?.raw as number || 0) * COMMISSION),
      currency: params.currency || "USD",
      airline: (marketing.name as string) || "Naməlum",
      departure: (firstLeg.departure as string) || "",
      arrival: (firstLeg.arrival as string) || "",
      duration: String(firstLeg.durationInMinutes || ""),
      stops: ((firstLeg.stopCount as number) || 0),
      deepLink: (item.deeplink as string) || undefined,
    };
  });
}

export function formatFlightForAI(flights: FlightResult[], currency = "USD"): string {
  if (!flights.length) return "Uçuş tapılmadı.";

  return flights.slice(0, 3).map((f, i) => {
    const dep = f.departure ? new Date(f.departure).toLocaleString("az-AZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    const dur = f.duration ? `${Math.floor(parseInt(f.duration) / 60)}s ${parseInt(f.duration) % 60}d` : "";
    const stops = f.stops === 0 ? "Birbaşa" : `${f.stops} dayanacaq`;
    return `${i + 1}. ${f.airline} — ${f.price} ${currency} | ${dep} | ${dur} | ${stops}`;
  }).join("\n");
}
