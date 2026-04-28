/**
 * Price Analysis Agent
 * Otel + uçuş üzrə tam detalları (ulduz, ünvan, daxil/xaric xidmətlər,
 * yemək planı, dənizə yaxınlıq, aktivitələr, WiFi) müqayisəli analiz edir.
 * Çıxış real bir turizm mütəxəssisinin izahatından fərqlənmir.
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
    const d    = new Date();
    const dd   = String(d.getDate()).padStart(2, "0");
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const res  = await fetch(`https://www.cbar.az/currencies/${dd}.${mm}.${d.getFullYear()}.xml`,
      { signal: AbortSignal.timeout(5000) });
    const xml  = await res.text();
    const m    = xml.match(/<Valute Code="USD"[^>]*>[\s\S]*?<Value>([\d.]+)<\/Value>/);
    if (m) { _usdRate = parseFloat(m[1]); _usdFetchedAt = Date.now(); return _usdRate; }
  } catch { /* ignore */ }
  return 1.70;
}

// ─── Tiplar ──────────────────────────────────────────────────────────────────

export type PriceClass = "budget" | "mid" | "premium";

export interface HotelResult {
  hotel_id:         string;
  hotel_name:       string;
  stars:            number;
  star_label:       string;       // "4 ulduzlu", "5 ulduzlu"
  address:          string;
  room_type:        string;
  meal_plan:        string;       // "Hər şey daxil", "Səhər yeməyi daxil"
  sea_proximity:    string;       // "Dəniz kənarında", "Dənizə 200m", "Dəniz çıxışı yoxdur"
  // Qiymətə daxil
  included_services: string[];   // WiFi, hovuz, yeməklər...
  // Əlavə ödənişli
  extra_services:   string[];    // SPA, transfer, su idmanı...
  // Aktivitələr
  activities_free:  string[];
  activities_paid:  string[];
  // Flags
  wifi_free:        boolean;
  has_pool:         boolean;
  has_beach:        boolean;
  all_inclusive:    boolean;
  check_in_time:    string;
  check_out_time:   string;
  description:      string;
  price_usd:        number;
  price_azn:        number;
  class:            PriceClass;
}

export interface FlightResult {
  offer_id:                 string;
  airline:                  string;
  stops:                    number;
  stop_label:               string;
  departure_time:           string;
  arrival_time:             string;
  duration_label:           string;
  cabin_baggage_pieces:     number;
  checked_baggage_pieces:   number;
  extra_bag_info:           string;
  baggage_summary:          string;   // "Kabin çantası daxil, yük baqajı ödənişlidir"
  price_azn:                number;
  class:                    PriceClass;
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
  natural_text: string;
}

// ─── Köməkçilər ──────────────────────────────────────────────────────────────

function classifyByIndex(i: number, total: number): PriceClass {
  const p = i / Math.max(total - 1, 1);
  return p <= 0.33 ? "budget" : p <= 0.66 ? "mid" : "premium";
}

function durationLabel(min: number): string {
  if (!min) return "";
  return `${Math.floor(min / 60)}s ${min % 60}d`;
}

function stopLabel(stops: number): string {
  if (stops === 0) return "Birbaşa uçuş";
  return `${stops} dayanacaqla`;
}

function seaProximity(h: HotelOffer): string {
  if (h.sea_front) return "🌊 Dəniz kənarında (beachfront)";
  if (h.has_beach) return "🏖️ Dənizə yaxın / çimərlik çıxışı var";
  return "Dəniz çıxışı yoxdur";
}

// ─── Natural dil formatlayıcı ─────────────────────────────────────────────────

function buildNaturalText(report: PriceReport): string {
  const { destination, checkin, checkout, nights, guests, flights, hotels, packages } = report;

  const lines: string[] = [];
  lines.push(
    `${destination} üçün ${checkin} – ${checkout} arasında ${nights} gecə, ${guests} nəfərlik tam analiz hazırladım.\n`
  );

  // ── Uçuşlar ──────────────────────────────────────────────────────────────
  if (flights.length > 0) {
    lines.push("✈️ **UÇUŞ VARİANTLARI** (artan qiymət sırası ile):\n");
    flights.forEach((f, i) => {
      const dep = f.departure_time
        ? new Date(f.departure_time).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku" }) : "";
      const arr = f.arrival_time
        ? new Date(f.arrival_time  ).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku" }) : "";
      const time = dep && arr ? ` | ${dep} → ${arr}` : "";

      const perPerson = Math.round(f.price_azn / guests);
      lines.push(`${i + 1}. **${f.airline}** — ${perPerson} AZN/nəfər (${guests} nəfər cəmi: ${f.price_azn} AZN)`);
      lines.push(`   ${f.stop_label}${time}${f.duration_label ? ` (${f.duration_label})` : ""}`);
      lines.push(`   🧳 ${f.baggage_summary}`);
      if (f.extra_bag_info) lines.push(`   ${f.extra_bag_info}`);
      lines.push("");
    });
  }

  // ── Otellər ───────────────────────────────────────────────────────────────
  if (hotels.length > 0) {
    lines.push("🏨 **OTEL VARİANTLARI** (artan qiymət sırası ilə):\n");
    hotels.forEach((h, i) => {
      lines.push(`${i + 1}. **${h.hotel_name}** — ${h.star_label}`);
      lines.push(`   💰 ${h.price_azn} AZN (${nights} gecə, ${guests} nəfər)`);
      lines.push(`   📍 ${h.address || destination}`);
      lines.push(`   ${h.sea_proximity}`);
      lines.push(`   🍽️ Yemək: **${h.meal_plan}**`);
      lines.push(`   🔑 Giriş: ${h.check_in_time} | Çıxış: ${h.check_out_time}`);

      if (h.included_services.length > 0) {
        lines.push(`   ✅ **Qiymətə daxil:** ${h.included_services.join(" · ")}`);
      }
      if (h.extra_services.length > 0) {
        lines.push(`   💳 **Əlavə ödənişli:** ${h.extra_services.join(" · ")}`);
      }
      if (h.activities_free.length > 0) {
        lines.push(`   🎯 **Pulsuz aktivitələr:** ${h.activities_free.join(", ")}`);
      }
      if (h.activities_paid.length > 0) {
        lines.push(`   🎫 **Ödənişli aktivitələr:** ${h.activities_paid.join(", ")}`);
      }
      lines.push("");
    });
  }

  // ── Paketlər ──────────────────────────────────────────────────────────────
  if (packages.length > 0) {
    lines.push("📦 **HAZIR PAKETLƏR** (uçuş + otel birlikdə):\n");
    packages.forEach(p => {
      lines.push(`**${p.type} Paket** → ${p.per_person_azn} AZN/nəfər · cəmi ${p.total_azn} AZN`);
      lines.push(`  ✈️ ${p.flight.airline} (${p.flight.stop_label})`);
      lines.push(`  🏨 ${p.hotel.hotel_name} · ${p.hotel.star_label} · ${p.hotel.meal_plan}`);
      lines.push(`  ${p.hotel.sea_proximity}`);
      lines.push("");
    });
  }

  lines.push("Hansı variant sizi maraqlandırır? Rezervasiya üçün dərhal tərtib edirəm.");
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
    "Dubai": "DXB", "Antalya": "AYT", "Bali": "DPS",
    "Moskva": "SVO", "London": "LHR", "Paris": "CDG",
    "Roma": "FCO", "Barselona": "BCN",
    "Şarm əl-Şeyx": "SSH", "Hurgada": "HRG",
    "Doha": "DOH", "Qahirə": "CAI",
    "Tokyo": "NRT", "Bangkok": "BKK", "Maldiv": "MLE",
  };
  const destIata  = IATA[destination] || destination.toUpperCase().slice(0, 3);
  const destGroup = TRACKED_DESTINATIONS.find(d => d.name === destination);

  const [flightsResult, hotelsResult] = await Promise.allSettled([
    searchFlights({ origin, destination: destIata, date: checkin, passengers: guests }),
    destGroup ? searchHotels(destGroup, checkin, checkout) : Promise.resolve([] as HotelOffer[]),
  ]);

  const rawFlights = flightsResult.status === "fulfilled" ? flightsResult.value : [] as FlightOffer[];
  const rawHotels  = hotelsResult.status  === "fulfilled" ? hotelsResult.value  : [] as HotelOffer[];

  // Üst otellərin ətraflı məlumatını çək
  const topHotels = rawHotels.sort((a, b) => a.price_usd - b.price_usd).slice(0, 5);
  const detailResults = await Promise.allSettled(
    topHotels.map(h => getHotelDetails(h.hotel_string_id))
  );
  const enrichedHotels: HotelOffer[] = topHotels.map((h, i) => {
    const det = detailResults[i].status === "fulfilled" ? detailResults[i].value : null;
    if (!det) return h;
    return {
      ...h,
      address:          det.address        || h.address        || "",
      description:      det.description    || h.description    || "",
      included_services: det.amenities.length ? det.amenities : h.included_services,
      wifi_free:        det.wifi_free      ?? h.wifi_free      ?? false,
      has_pool:         det.has_pool       ?? h.has_pool       ?? false,
      has_beach:        det.has_beach      ?? h.has_beach      ?? false,
      sea_front:        h.sea_front        ?? false,
      check_in_time:    det.check_in_time  || h.check_in_time  || "14:00",
      check_out_time:   det.check_out_time || h.check_out_time || "12:00",
    };
  });

  // ── Uçuşları formatla ─────────────────────────────────────────────────────
  const flights: FlightResult[] = rawFlights
    .sort((a, b) => a.price_azn - b.price_azn)
    .slice(0, 6)
    .map((f, i, arr) => {
      const hasCabin   = f.cabin_baggage  > 0;
      const hasChecked = f.checked_baggage > 0;
      let bagSummary = "";
      if (hasChecked) bagSummary = `${f.checked_baggage} yük baqajı + kabin çantası daxil`;
      else if (hasCabin) bagSummary = "Kabin çantası daxil, yük baqajı ödənişlidir";
      else bagSummary = "Yalnız şəxsi əşya (baqaj ayrıca ödənişlidir)";

      return {
        offer_id:                f.offer_id,
        airline:                 f.airline,
        stops:                   f.stops,
        stop_label:              stopLabel(f.stops),
        departure_time:          f.departure_time,
        arrival_time:            f.arrival_time,
        duration_label:          durationLabel(f.duration_minutes),
        cabin_baggage_pieces:    f.cabin_baggage,
        checked_baggage_pieces:  f.checked_baggage,
        extra_bag_info:          f.extra_bag_kg > 0
          ? `Əlavə baqaj əlavə edə bilərsiniz: ${f.extra_bag_kg} kq — ${f.extra_bag_azn} AZN`
          : "",
        baggage_summary:         bagSummary,
        price_azn:               Math.round(f.price_azn),
        class:                   classifyByIndex(i, arr.length),
      };
    });

  // ── Otelləri formatla ─────────────────────────────────────────────────────
  const hotels: HotelResult[] = enrichedHotels.map((h, i, arr) => ({
    hotel_id:          h.hotel_id,
    hotel_name:        h.hotel_name,
    stars:             h.stars,
    star_label:        h.stars ? `${h.stars} ulduzlu` : "Kateqoriyasız",
    address:           h.address || "",
    room_type:         h.room_type,
    meal_plan:         h.meal,
    sea_proximity:     seaProximity(h),
    included_services: h.included_services || [],
    extra_services:    h.extra_services    || [],
    activities_free:   h.activities_free   || [],
    activities_paid:   h.activities_paid   || [],
    wifi_free:         h.wifi_free         ?? false,
    has_pool:          h.has_pool          ?? false,
    has_beach:         h.has_beach         ?? false,
    all_inclusive:     h.all_inclusive     ?? false,
    check_in_time:     h.check_in_time     || "14:00",
    check_out_time:    h.check_out_time    || "12:00",
    description:       h.description       || "",
    price_usd:         h.price_usd,
    price_azn:         Math.round(h.price_usd * usdRate),
    class:             classifyByIndex(i, arr.length),
  }));

  // ── Paketlər ──────────────────────────────────────────────────────────────
  const LABELS: Record<PriceClass, string> = { budget: "Büdcə", mid: "Comfort", premium: "Premium" };
  const packages: Package[] = (["budget", "mid", "premium"] as PriceClass[]).flatMap(tier => {
    const flight = flights.find(f => f.class === tier) ?? flights[0];
    const hotel  = hotels.find(h  => h.class === tier) ?? hotels[0];
    if (!flight || !hotel) return [];
    const total = flight.price_azn + hotel.price_azn;
    return [{ type: LABELS[tier], class: tier, flight, hotel, nights, guests,
      total_azn: Math.round(total), per_person_azn: Math.round(total / guests) }];
  });

  const cheapFlight = flights[0];
  const cheapHotel  = hotels[0];
  const budgetPkg   = packages[0];

  const summary = [
    `${destination} · ${checkin}–${checkout} · ${nights} gecə · ${guests} nəfər`,
    cheapFlight ? `✈️ Ən ucuz: ${cheapFlight.airline} — ${cheapFlight.price_azn} AZN` : null,
    cheapHotel  ? `🏨 Ən ucuz: ${cheapHotel.hotel_name} (${cheapHotel.star_label}) — ${cheapHotel.price_azn} AZN` : null,
    budgetPkg   ? `💰 Büdcə paketi: ${budgetPkg.per_person_azn} AZN/nəfər` : null,
  ].filter(Boolean).join("\n");

  const report: PriceReport = {
    destination, origin, checkin, checkout, nights, guests,
    analyzed_at: new Date().toISOString(),
    flights, hotels, packages, summary, natural_text: "",
  };
  report.natural_text = buildNaturalText(report);
  return report;
}

export async function analyzeAllDestinations(params: {
  checkin: string; checkout: string; guests?: number;
}): Promise<PriceReport[]> {
  const results = await Promise.allSettled(
    TRACKED_DESTINATIONS.map(d =>
      analyzePrices({ destination: d.name, checkin: params.checkin, checkout: params.checkout, guests: params.guests })
    )
  );
  return results
    .filter((r): r is PromiseFulfilledResult<PriceReport> => r.status === "fulfilled")
    .map(r => r.value);
}
