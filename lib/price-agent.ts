/**
 * Price Analysis Agent
 * Otel + uçuş üzrə tam məlumatı (qiymət, xidmətlər, şərtlər, aktivitələr)
 * müqayisəli şəkildə analiz edir. Çıxış insan axtarışından fərqlənmir.
 */

import { searchHotels, getHotelDetails, TRACKED_DESTINATIONS, HotelOffer } from "./ratehawk";
import { searchFlights, FlightOffer }                                        from "./duffel";

// ─── CBAR məzənnəsi ─────────────────────────────────────────────────────────
let _usdRate: number | null = null;
let _usdFetchedAt = 0;

async function getUsdToAzn(): Promise<number> {
  const ONE_HOUR = 60 * 60 * 1000;
  if (_usdRate && Date.now() - _usdFetchedAt < ONE_HOUR) return _usdRate;
  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const url = `https://www.cbar.az/currencies/${dd}.${mm}.${today.getFullYear()}.xml`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const xml = await res.text();
    const m = xml.match(/<Valute Code="USD"[^>]*>[\s\S]*?<Value>([\d.]+)<\/Value>/);
    if (m) { _usdRate = parseFloat(m[1]); _usdFetchedAt = Date.now(); return _usdRate; }
  } catch { /* ignore */ }
  return 1.70;
}

// ─── Tiplar ──────────────────────────────────────────────────────────────────

export type PriceClass = "budget" | "mid" | "premium";

export interface HotelResult {
  hotel_id:        string;
  hotel_name:      string;
  stars:           number;
  address:         string;
  room_type:       string;
  meal:            string;          // "Hər şey daxil", "Səhər yeməyi daxil", ...
  wifi_free:       boolean;
  has_pool:        boolean;
  has_beach:       boolean;
  all_inclusive:   boolean;
  amenities:       string[];        // ["Pulsuz WiFi", "Açıq hovuz", "SPA", ...]
  activities:      string[];        // ["Su idman növləri", "Tennis kortu", ...]
  check_in_time:   string;
  check_out_time:  string;
  description:     string;
  price_usd:       number;
  price_azn:       number;
  class:           PriceClass;
}

export interface FlightResult {
  offer_id:            string;
  airline:             string;
  stops:               number;
  stop_label:          string;      // "Birbaşa", "1 dayanacaq"
  departure_time:      string;
  arrival_time:        string;
  duration_label:      string;      // "3s 20d"
  cabin_baggage_pieces: number;
  checked_baggage_pieces: number;
  extra_bag_info:      string;      // "Əlavə bagaj: 23 kq — 45 AZN"
  price_azn:           number;
  class:               PriceClass;
}

export interface Package {
  type:           string;
  class:          PriceClass;
  flight:         FlightResult;
  hotel:          HotelResult;
  nights:         number;
  guests:         number;
  total_azn:      number;
  per_person_azn: number;
}

export interface PriceReport {
  destination:  string;
  origin:       string;
  checkin:      string;
  checkout:     string;
  nights:       number;
  guests:       number;
  analyzed_at:  string;
  flights:      FlightResult[];
  hotels:       HotelResult[];
  packages:     Package[];
  summary:      string;
  natural_text: string;   // AI-ya ötürülən insan kimi mətn
}

// ─── Köməkçilər ──────────────────────────────────────────────────────────────

function classifyByIndex(i: number, total: number): PriceClass {
  const pct = i / Math.max(total - 1, 1);
  return pct <= 0.33 ? "budget" : pct <= 0.66 ? "mid" : "premium";
}

function durationLabel(minutes: number): string {
  if (!minutes) return "";
  return `${Math.floor(minutes / 60)}s ${minutes % 60}d`;
}

function stopLabel(stops: number): string {
  if (stops === 0) return "Birbaşa uçuş";
  return `${stops} dayanacaqla`;
}

// ─── Natural dil formatlayıcı ─────────────────────────────────────────────────

function buildNaturalText(report: PriceReport): string {
  const { destination, checkin, checkout, nights, guests, flights, hotels, packages } = report;

  const lines: string[] = [];

  lines.push(
    `${destination} üçün ${checkin} – ${checkout} tarixləri arasında ${nights} gecəlik, ${guests} nəfərlik səyahət analizi hazırladım.`
  );
  lines.push("");

  // ── Uçuşlar ──────────────────────────────────────────────────────────────
  if (flights.length > 0) {
    lines.push("✈️ **Uçuş variantları:**");
    flights.forEach((f, i) => {
      const dep  = f.departure_time ? new Date(f.departure_time).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : "";
      const arr  = f.arrival_time   ? new Date(f.arrival_time  ).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : "";
      const time = dep && arr ? ` | ${dep} → ${arr}` : "";
      const bag  = f.checked_baggage_pieces > 0
        ? `${f.checked_baggage_pieces} yer baqaj daxil`
        : `kabin baqaj daxil${f.extra_bag_info ? ", əlavə baqaj ayrıca ödənişlidir" : ""}`;

      lines.push(
        `${i + 1}. **${f.airline}** — ${f.price_azn} AZN/nəfər` +
        `\n   ${f.stop_label}${time} (${f.duration_label}) | ${bag}`
      );
    });
    lines.push("");
  }

  // ── Otellər ───────────────────────────────────────────────────────────────
  if (hotels.length > 0) {
    lines.push("🏨 **Otel variantları:**");
    hotels.forEach((h, i) => {
      const stars  = "⭐".repeat(h.stars);
      const meal   = h.meal || "Yemək məlumatı yoxdur";
      const wifi   = h.wifi_free ? "Pulsuz WiFi" : "WiFi (ödənişli)";
      const pool   = h.has_pool  ? " | Hovuz" : "";
      const beach  = h.has_beach ? " | Çimərlik" : "";
      const extras = h.activities.length > 0 ? `\n   Aktivitələr: ${h.activities.join(", ")}` : "";
      const addr   = h.address ? `\n   📍 ${h.address}` : "";
      const checkt = `Giriş: ${h.check_in_time} | Çıxış: ${h.check_out_time}`;

      lines.push(
        `${i + 1}. **${h.hotel_name}** ${stars} — ${h.price_azn} AZN (${nights} gecə)\n` +
        `   ${meal} | ${wifi}${pool}${beach}\n` +
        `   ${checkt}${extras}${addr}`
      );

      // Əlavə imkanlar
      if (h.amenities.length > 3) {
        const extras2 = h.amenities.slice(0, 6).join(" · ");
        lines.push(`   Xidmətlər: ${extras2}`);
      }
    });
    lines.push("");
  }

  // ── Hazır Paketlər ────────────────────────────────────────────────────────
  if (packages.length > 0) {
    lines.push("📦 **Hazır paketlər (uçuş + otel):**");
    packages.forEach(p => {
      lines.push(
        `**${p.type} Paket** — ${p.per_person_azn} AZN/nəfər (cəmi ${p.total_azn} AZN)\n` +
        `  ✈️ ${p.flight.airline} (${p.flight.stop_label}) + 🏨 ${p.hotel.hotel_name} (${p.hotel.meal})`
      );
    });
    lines.push("");
  }

  lines.push("Hansı variant daha uyğundur? Rezervasiya etmək istəsəniz dərhal tərtib edirəm.");

  return lines.join("\n");
}

// ─── Əsas analiz funksiyası ──────────────────────────────────────────────────

export async function analyzePrices(params: {
  destination: string;
  origin?:     string;
  checkin:     string;
  checkout:    string;
  guests?:     number;
}): Promise<PriceReport> {
  const { destination, origin = "GYD", checkin, checkout, guests = 2 } = params;

  const nights  = Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
  );
  const usdRate = await getUsdToAzn();

  const IATA: Record<string, string> = {
    "İstanbul": "IST", "Istanbul": "IST",
    "Dubai": "DXB",
    "Antalya": "AYT",
    "Bali": "DPS",
    "Moskva": "SVO",
    "London": "LHR",
    "Paris": "CDG",
    "Roma": "FCO", "Rome": "FCO",
    "Barselona": "BCN",
    "Şarm əl-Şeyx": "SSH",
    "Hurgada": "HRG",
    "Doha": "DOH",
    "Qahirə": "CAI",
    "Tokyo": "NRT",
    "Bangkok": "BKK",
    "Maldiv": "MLE",
  };
  const destIata = IATA[destination] || destination.toUpperCase().slice(0, 3);
  const destGroup = TRACKED_DESTINATIONS.find(d => d.name === destination);

  // ── Paralel sorğular ──────────────────────────────────────────────────────
  const [flightsResult, hotelsResult] = await Promise.allSettled([
    searchFlights({ origin, destination: destIata, date: checkin, passengers: guests }),
    destGroup ? searchHotels(destGroup, checkin, checkout) : Promise.resolve([] as HotelOffer[]),
  ]);

  const rawFlights: FlightOffer[] = flightsResult.status === "fulfilled" ? flightsResult.value : [];
  const rawHotels:  HotelOffer[]  = hotelsResult.status  === "fulfilled" ? hotelsResult.value  : [];

  // ── Üst otellərin ətraflı məlumatını çək (max 5, paralel) ────────────────
  const topHotels = rawHotels.sort((a, b) => a.price_usd - b.price_usd).slice(0, 5);
  const detailResults = await Promise.allSettled(
    topHotels.map(h => getHotelDetails(h.hotel_string_id))
  );

  // Detalları otel üzərinə birləşdir
  const enrichedHotels: HotelOffer[] = topHotels.map((h, i) => {
    const det = detailResults[i].status === "fulfilled" ? detailResults[i].value : null;
    if (!det) return h;
    return {
      ...h,
      address:        det.address        || h.address        || "",
      description:    det.description    || h.description    || "",
      amenities:      det.amenities.length ? det.amenities   : (h.amenities || []),
      wifi_free:      det.wifi_free      ?? h.wifi_free      ?? false,
      has_pool:       det.has_pool       ?? h.has_pool       ?? false,
      has_beach:      det.has_beach      ?? h.has_beach      ?? false,
      activities:     det.activities.length ? det.activities : (h.activities || []),
      check_in_time:  det.check_in_time  || h.check_in_time  || "14:00",
      check_out_time: det.check_out_time || h.check_out_time || "12:00",
    };
  });

  // ── Uçuşları formatla ─────────────────────────────────────────────────────
  const flights: FlightResult[] = rawFlights
    .sort((a, b) => a.price_azn - b.price_azn)
    .slice(0, 6)
    .map((f, i, arr) => ({
      offer_id:              f.offer_id,
      airline:               f.airline,
      stops:                 f.stops,
      stop_label:            stopLabel(f.stops),
      departure_time:        f.departure_time,
      arrival_time:          f.arrival_time,
      duration_label:        durationLabel(f.duration_minutes),
      cabin_baggage_pieces:  f.cabin_baggage,
      checked_baggage_pieces: f.checked_baggage,
      extra_bag_info:        f.extra_bag_kg > 0
        ? `Əlavə bagaj: ${f.extra_bag_kg} kq — ${f.extra_bag_azn} AZN`
        : "",
      price_azn:             Math.round(f.price_azn),
      class:                 classifyByIndex(i, arr.length),
    }));

  // ── Otelləri formatla ─────────────────────────────────────────────────────
  const hotels: HotelResult[] = enrichedHotels
    .map((h, i, arr) => ({
      hotel_id:        h.hotel_id,
      hotel_name:      h.hotel_name,
      stars:           h.stars,
      address:         h.address || "",
      room_type:       h.room_type,
      meal:            h.meal,
      wifi_free:       h.wifi_free        ?? false,
      has_pool:        h.has_pool         ?? false,
      has_beach:       h.has_beach        ?? false,
      all_inclusive:   h.all_inclusive    ?? false,
      amenities:       h.amenities        || [],
      activities:      h.activities       || [],
      check_in_time:   h.check_in_time    || "14:00",
      check_out_time:  h.check_out_time   || "12:00",
      description:     h.description      || "",
      price_usd:       h.price_usd,
      price_azn:       Math.round(h.price_usd * usdRate),
      class:           classifyByIndex(i, arr.length),
    }));

  // ── Paketlər ──────────────────────────────────────────────────────────────
  const packages: Package[] = [];
  for (const tier of ["budget", "mid", "premium"] as PriceClass[]) {
    const flight = flights.find(f => f.class === tier) ?? flights[0];
    const hotel  = hotels.find(h  => h.class === tier) ?? hotels[0];
    if (!flight || !hotel) continue;

    const LABELS: Record<PriceClass, string> = { budget: "Büdcə", mid: "Comfort", premium: "Premium" };
    const total     = flight.price_azn * guests + hotel.price_azn;
    const perPerson = Math.round(total / guests);

    packages.push({ type: LABELS[tier], class: tier, flight, hotel, nights, guests, total_azn: Math.round(total), per_person_azn: perPerson });
  }

  // ── Qısa xülasə ──────────────────────────────────────────────────────────
  const cheapFlight = flights[0];
  const cheapHotel  = hotels[0];
  const budgetPkg   = packages.find(p => p.class === "budget");

  const summary = [
    `${destination} · ${checkin} – ${checkout} · ${nights} gecə · ${guests} nəfər`,
    cheapFlight ? `✈️ Ən ucuz uçuş: ${cheapFlight.airline} — ${cheapFlight.price_azn} AZN` : null,
    cheapHotel  ? `🏨 Ən ucuz otel: ${cheapHotel.hotel_name} (${cheapHotel.stars}⭐) — ${cheapHotel.price_azn} AZN` : null,
    budgetPkg   ? `💰 Büdcə paketi: ${budgetPkg.per_person_azn} AZN/nəfər` : null,
  ].filter(Boolean).join("\n");

  const report: PriceReport = {
    destination, origin, checkin, checkout, nights, guests,
    analyzed_at: new Date().toISOString(),
    flights, hotels, packages, summary,
    natural_text: "",
  };

  report.natural_text = buildNaturalText(report);
  return report;
}

// ─── Bütün destinasiyalar ─────────────────────────────────────────────────────

export async function analyzeAllDestinations(params: {
  checkin:  string;
  checkout: string;
  guests?:  number;
}): Promise<PriceReport[]> {
  const results = await Promise.allSettled(
    TRACKED_DESTINATIONS.map(dest =>
      analyzePrices({ destination: dest.name, checkin: params.checkin, checkout: params.checkout, guests: params.guests })
    )
  );
  return results
    .filter((r): r is PromiseFulfilledResult<PriceReport> => r.status === "fulfilled")
    .map(r => r.value);
}
