/**
 * Price Analysis Agent
 * Otel + uçuş qiymətlərini müqayisəli şəkildə analiz edir,
 * artan sıra ilə sıralayır, büdcə/orta/premium paketlər qurur.
 */

import { searchHotels, TRACKED_DESTINATIONS, HotelOffer } from "./ratehawk";
import { searchFlights, FlightOffer }                      from "./duffel";

// ─── CBAR məzənnəsi (USD → AZN) ─────────────────────────────────────────────
let _usdRate: number | null = null;
let _usdFetchedAt = 0;

async function getUsdToAzn(): Promise<number> {
  const ONE_HOUR = 60 * 60 * 1000;
  if (_usdRate && Date.now() - _usdFetchedAt < ONE_HOUR) return _usdRate;
  try {
    const today = new Date();
    const dd   = String(today.getDate()).padStart(2, "0");
    const mm   = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const res  = await fetch(`https://www.cbar.az/currencies/${dd}.${mm}.${yyyy}.xml`,
      { signal: AbortSignal.timeout(5000) });
    const xml  = await res.text();
    const m    = xml.match(/<Valute Code="USD"[^>]*>[\s\S]*?<Value>([\d.]+)<\/Value>/);
    if (m) { _usdRate = parseFloat(m[1]); _usdFetchedAt = Date.now(); return _usdRate; }
  } catch { /* ignore */ }
  return 1.70; // fallback
}

// ─── Tiplar ──────────────────────────────────────────────────────────────────

export type PriceClass = "budget" | "mid" | "premium";

export interface HotelResult {
  hotel_id:   string;
  hotel_name: string;
  stars:      number;
  room_type:  string;
  meal:       string;
  price_usd:  number;
  price_azn:  number;
  class:      PriceClass;
}

export interface FlightResult {
  offer_id:         string;
  airline:          string;
  stops:            number;
  departure_time:   string;
  arrival_time:     string;
  duration_minutes: number;
  price_azn:        number;
  class:            PriceClass;
}

export interface Package {
  type:      string;
  class:     PriceClass;
  flight:    FlightResult;
  hotel:     HotelResult;
  nights:    number;
  guests:    number;
  total_azn: number;  // uçuş + otel
  per_person_azn: number;
}

export interface PriceReport {
  destination:   string;
  origin:        string;
  checkin:       string;
  checkout:      string;
  nights:        number;
  guests:        number;
  analyzed_at:   string;
  flights:       FlightResult[];
  hotels:        HotelResult[];
  packages:      Package[];
  summary:       string;
}

// ─── Sinifləndirmə ────────────────────────────────────────────────────────────

function classifyByIndex(index: number, total: number): PriceClass {
  const pct = index / Math.max(total - 1, 1);
  if (pct <= 0.33) return "budget";
  if (pct <= 0.66) return "mid";
  return "premium";
}

// ─── Əsas analiz funksiyası ──────────────────────────────────────────────────

export async function analyzePrices(params: {
  destination: string;     // "İstanbul", "Dubai" ...
  origin?:     string;     // IATA: "GYD" (default)
  checkin:     string;     // "2025-06-15"
  checkout:    string;     // "2025-06-18"
  guests?:     number;     // default 2
}): Promise<PriceReport> {
  const {
    destination,
    origin     = "GYD",
    checkin,
    checkout,
    guests     = 2,
  } = params;

  const nights = Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
  );

  const usdRate = await getUsdToAzn();

  // ── IATA kodları xəritəsi ─────────────────────────────────────────────────
  const IATA: Record<string, string> = {
    "İstanbul": "IST", "Istanbul": "IST",
    "Dubai":    "DXB",
    "Antalya":  "AYT",
    "Bali":     "DPS",
    "Moskva":   "SVO", "Moscow": "SVO",
    "London":   "LHR",
    "Paris":    "CDG",
    "Roma":     "FCO", "Rome": "FCO",
    "Barselona":"BCN", "Barcelona": "BCN",
    "Şarm əl-Şeyx": "SSH",
    "Hurgada":  "HRG",
  };
  const destIata = IATA[destination] || destination.toUpperCase().slice(0, 3);

  // ── Paralel sorğular ──────────────────────────────────────────────────────
  const destGroup = TRACKED_DESTINATIONS.find(d => d.name === destination);

  const [flightsResult, hotelsResult] = await Promise.allSettled([
    searchFlights({
      origin,
      destination: destIata,
      date: checkin,
      passengers: guests,
    }),
    destGroup
      ? searchHotels(destGroup, checkin, checkout)
      : Promise.resolve([] as HotelOffer[]),
  ]);

  const rawFlights: FlightOffer[] = flightsResult.status === "fulfilled" ? flightsResult.value : [];
  const rawHotels:  HotelOffer[]  = hotelsResult.status  === "fulfilled" ? hotelsResult.value  : [];

  // ── Uçuşları AZN-ə çevir + sırala ────────────────────────────────────────
  const flights: FlightResult[] = rawFlights
    .sort((a, b) => a.price_azn - b.price_azn)
    .slice(0, 9)
    .map((f, i, arr) => ({
      offer_id:         f.offer_id,
      airline:          f.airline,
      stops:            f.stops,
      departure_time:   f.departure_time,
      arrival_time:     f.arrival_time,
      duration_minutes: f.duration_minutes,
      price_azn:        Math.round(f.price_azn),
      class:            classifyByIndex(i, arr.length),
    }));

  // ── Otelləri AZN-ə çevir + sırala ────────────────────────────────────────
  const hotels: HotelResult[] = rawHotels
    .sort((a, b) => a.price_usd - b.price_usd)
    .slice(0, 9)
    .map((h, i, arr) => ({
      hotel_id:   h.hotel_id,
      hotel_name: h.hotel_name,
      stars:      h.stars,
      room_type:  h.room_type,
      meal:       h.meal,
      price_usd:  h.price_usd,
      price_azn:  Math.round(h.price_usd * usdRate),
      class:      classifyByIndex(i, arr.length),
    }));

  // ── Paket kombinasiyaları ─────────────────────────────────────────────────
  const packages: Package[] = [];
  const TIERS: PriceClass[] = ["budget", "mid", "premium"];
  const LABELS: Record<PriceClass, string> = {
    budget:  "Büdcə",
    mid:     "Comfort",
    premium: "Premium",
  };

  for (const tier of TIERS) {
    const flight = flights.find(f => f.class === tier) ?? flights[0];
    const hotel  = hotels.find(h => h.class === tier)  ?? hotels[0];
    if (!flight || !hotel) continue;

    const total      = flight.price_azn * guests + hotel.price_azn;
    const perPerson  = Math.round(total / guests);

    packages.push({
      type:           LABELS[tier],
      class:          tier,
      flight,
      hotel,
      nights,
      guests,
      total_azn:      Math.round(total),
      per_person_azn: perPerson,
    });
  }

  // ── Mətn xülasəsi ─────────────────────────────────────────────────────────
  const cheapFlight = flights[0];
  const cheapHotel  = hotels[0];
  const budgetPkg   = packages.find(p => p.class === "budget");

  const summary = [
    `${destination} üçün ${checkin} – ${checkout} (${nights} gecə, ${guests} nəfər):`,
    cheapFlight  ? `✈️  Ən ucuz uçuş: ${cheapFlight.airline} — ${cheapFlight.price_azn} AZN` : "✈️  Uçuş tapılmadı",
    cheapHotel   ? `🏨  Ən ucuz otel: ${cheapHotel.hotel_name} (${cheapHotel.stars}⭐) — ${cheapHotel.price_azn} AZN` : "🏨  Otel tapılmadı",
    budgetPkg    ? `💰  Büdcə paketi: ${budgetPkg.per_person_azn} AZN/nəfər` : "",
  ].filter(Boolean).join("\n");

  return {
    destination,
    origin,
    checkin,
    checkout,
    nights,
    guests,
    analyzed_at: new Date().toISOString(),
    flights,
    hotels,
    packages,
    summary,
  };
}

// ─── Bütün destinasiyalar üçün analiz ────────────────────────────────────────

export async function analyzeAllDestinations(params: {
  checkin:  string;
  checkout: string;
  guests?:  number;
}): Promise<PriceReport[]> {
  const results = await Promise.allSettled(
    TRACKED_DESTINATIONS.map(dest =>
      analyzePrices({
        destination: dest.name,
        checkin:     params.checkin,
        checkout:    params.checkout,
        guests:      params.guests,
      })
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<PriceReport> => r.status === "fulfilled")
    .map(r => r.value);
}
