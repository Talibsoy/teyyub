import https from "node:https";
import http from "node:http";

// RATEHAWK_BASE funksiya içində hesablanır (modul-level sabit build-time inline olur)
// RATEHAWK_PROXY_URL varsa Contabo proxy üzərindən keç (statik IP → ETG whitelist)
function getRatehawkBase() {
  // Sandbox: birbaşa ETG sandbox-a get. Proxy production endpoint-inə yönəlir, ona görə
  // sandbox açarları proxy üzərindən "incorrect_credentials" verir — sandbox-da proxy keçilir.
  if (process.env.RATEHAWK_SANDBOX === "true") {
    return "https://api-sandbox.worldota.net/api/b2b/v3";
  }
  // Production: statik whitelist IP üçün proxy üzərindən
  if (process.env.RATEHAWK_PROXY_URL) return process.env.RATEHAWK_PROXY_URL;
  return "https://api.worldota.net/api/b2b/v3";
}

export interface HotelOffer {
  hotel_key:       string;
  hotel_id:        string;
  hotel_string_id: string;
  hotel_name:      string;
  destination:     string;
  checkin:         string;
  checkout:        string;
  price_usd:       number;
  stars:           number;
  room_type:       string;
  meal:            string;
  updated_at:      string;
  book_hash?:      string;   // Prebook üçün lazımdır
  // Yer
  address?:        string;
  sea_front?:      boolean;   // dəniz kənarında
  // Qiymətə daxil xidmətlər
  included_services?: string[];
  // Əlavə ödənişli xidmətlər
  extra_services?:    string[];
  // Aktivitələr
  activities_free?: string[];  // daxil
  activities_paid?: string[];  // ödənişli
  // Flags
  wifi_free?:      boolean;
  has_pool?:       boolean;
  has_beach?:      boolean;
  all_inclusive?:  boolean;
  // Digər
  check_in_time?:  string;
  check_out_time?: string;
  description?:    string;
  photos?:         string[];
}

// Amenity kodlarını parse et — daxil/əlavə ödənişli ayır
export function parseAmenities(codes: string[]): {
  included: string[];      // Qiymətə daxil imkanlar
  extra: string[];         // Əlavə ödənişli imkanlar
  activities_free: string[];
  activities_paid: string[];
  wifi_free:     boolean;
  has_pool:      boolean;
  has_beach:     boolean;
  sea_front:     boolean;  // dəniz kənarında
  all_inclusive: boolean;
} {
  // Həmişə pulsuz (oteldə varsa qiymətə daxildir)
  const FREE_SET = new Set([
    "free_wifi","wifi","outdoor_pool","indoor_pool","pool","heated_pool",
    "beach","private_beach","beach_access","gym","fitness","fitness_center",
    "parking","free_parking","elevator","air_conditioning","24h_reception",
    "luggage_storage","safe","hair_dryer","iron",
  ]);
  // Həmişə əlavə ödənişli
  const PAID_SET = new Set([
    "spa","sauna","massage","turkish_bath","hammam",
    "water_sports","diving","surfing","snorkeling",
    "tennis","golf","bike_rental","car_rental",
    "laundry","room_service","minibar","transfer","airport_transfer",
    "babysitting","currency_exchange","business_center",
  ]);

  const LABELS: Record<string, string> = {
    free_wifi: "WiFi (pulsuz)", wifi: "WiFi",
    outdoor_pool: "Açıq hovuz", indoor_pool: "Qapalı hovuz",
    pool: "Hovuz", heated_pool: "İsidilmiş hovuz",
    beach: "Çimərlik çıxışı", private_beach: "Özəl çimərlik", beach_access: "Çimərlik",
    gym: "Fitness zalı", fitness: "Fitness", fitness_center: "Fitness mərkəzi",
    parking: "Parkinq (pulsuz)", free_parking: "Pulsuz parkinq",
    restaurant: "Restoran", bar: "Bar", pool_bar: "Hovuz barı",
    kids_club: "Uşaq klubu", playground: "Uşaq meydançası",
    spa: "SPA mərkəzi (ödənişli)", sauna: "Sauna (ödənişli)",
    massage: "Masaj (ödənişli)", turkish_bath: "Türk hamamı (ödənişli)", hammam: "Hamam (ödənişli)",
    water_sports: "Su idmanı (ödənişli)", diving: "Dalış (ödənişli)",
    surfing: "Sörf (ödənişli)", snorkeling: "Snorkeling (ödənişli)",
    tennis: "Tennis (ödənişli)", golf: "Golf (ödənişli)",
    bike_rental: "Velosiped icarəsi", car_rental: "Avtomobil icarəsi",
    laundry: "Camaşır xidməti (ödənişli)", room_service: "Otaq xidməti (ödənişli)",
    minibar: "Mini-bar (ödənişli)", transfer: "Transfer (ödənişli)",
    airport_transfer: "Aeroport transferi (ödənişli)",
    air_conditioning: "Kondisioner", elevator: "Lift",
    babysitting: "Uşaq baxımı (ödənişli)", business_center: "Biznes mərkəzi",
  };

  const included: string[] = [];
  const extra: string[]    = [];
  const activities_free: string[] = [];
  const activities_paid: string[] = [];

  let wifi_free = false, has_pool = false, has_beach = false,
      sea_front = false, all_inclusive = false;

  for (const code of codes) {
    const c = code.toLowerCase().replace(/\s+/g, "_");
    if (c.includes("wifi") || c === "free_wifi") wifi_free = true;
    if (c.includes("pool"))   has_pool = true;
    if (c.includes("beach") || c.includes("sea_view") || c === "seafront") {
      has_beach = true;
      if (c === "seafront" || c === "beachfront" || c.includes("sea_front")) sea_front = true;
    }
    if (c === "all_inclusive" || c === "ultra_all_inclusive") all_inclusive = true;

    const label = LABELS[c];
    if (!label) continue;

    if (FREE_SET.has(c)) {
      included.push(label);
      if (["water_sports","diving","surfing","tennis","kids_club"].includes(c)) activities_free.push(label);
    } else if (PAID_SET.has(c)) {
      extra.push(label);
      if (["water_sports","diving","surfing","snorkeling","tennis","golf","spa","massage"].includes(c)) activities_paid.push(label);
    } else {
      // Restoran, bar — pulsuz (oteldə varsa)
      included.push(label);
    }
  }

  return {
    included:        [...new Set(included)],
    extra:           [...new Set(extra)],
    activities_free: [...new Set(activities_free)],
    activities_paid: [...new Set(activities_paid)],
    wifi_free, has_pool, has_beach, sea_front, all_inclusive,
  };
}

// ─── İzlənilən otellər (hid = RateHawk hotel ID) ─────────────────────────────
// Sandbox test otelləri + real otel ID-ləri (production üçün artır)
export const TRACKED_DESTINATIONS: DestinationGroup[] = [
  {
    // ETG sandbox test otelləri (Conrad LA 10004834, Downtown LA Apartments 10047711,
    // Key View Residences 10595223) — sertifikasiya üçün
    name: "Los Angeles",
    hids: [10004834, 10047711, 10595223],
  },
  {
    name: "İstanbul",
    hids: [8819557],
  },
  {
    name: "Dubai",
    hids: [9744270, 6362880, 6682380],
  },
  {
    name: "Antalya",
    hids: [10654204, 10678836],
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
    const url = new URL(`${getRatehawkBase()}${endpoint}`);
    const isSandbox = process.env.RATEHAWK_SANDBOX === "true";
    const isHttp = url.protocol === "http:";
    const transport = isHttp ? http : https;

    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttp ? 80 : 443),
        path: url.pathname + (url.search || ""),
        method: "POST",
        headers: {
          Authorization:      `Basic ${getAuth()}`,
          "Content-Type":     "application/json",
          "Content-Length":   Buffer.byteLength(postData),
          ...(process.env.RATEHAWK_PROXY_SECRET
            ? { "x-proxy-secret": process.env.RATEHAWK_PROXY_SECRET }
            : {}),
        },
        // Sandbox-da TLS yoxlamasını söndür; proxy istifadəsində də TLS aktiv qalır
        ...(isHttp ? {} : { rejectUnauthorized: !isSandbox }),
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

    const payType = rate.payment_options?.payment_types?.[0];
    let totalPrice = parseFloat(payType?.show_amount || payType?.amount || "0");
    if (totalPrice <= 0 && Array.isArray(rate.daily_prices)) {
      totalPrice = rate.daily_prices.reduce((sum: number, p: string) => sum + parseFloat(p || "0"), 0);
    }

    if (totalPrice <= 0) continue;

    const hid = hotel.hid ?? hotel.id;
    const stringId = typeof hotel.id === "string" ? hotel.id : String(hid);
    const slugName = typeof hotel.id === "string"
      ? hotel.id.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : null;

    // Amenity parse
    const amenityCodes: string[] = [
      ...(hotel.amenity_groups?.flatMap((g: RatehawkAmenityGroup) => g.amenities || []) || []),
      ...(rate.amenities_data || []),
    ];
    const parsed = parseAmenities(amenityCodes);

    // Meal plan insan dilinə - 26 standard ETG meal types mapping
    const mealMap: Record<string, string> = {
      "all-inclusive": "Hər şey daxil (All Inclusive)",
      "american-breakfast": "Amerika səhər yeməyi",
      "asian-breakfast": "Asiya səhər yeməyi",
      "breakfast": "Səhər yeməyi daxil",
      "breakfast-buffet": "Açıq büfe səhər yeməyi",
      "breakfast-for-1": "1 nəfərlik səhər yeməyi",
      "breakfast-for-2": "2 nəfərlik səhər yeməyi",
      "chinese-breakfast": "Çin səhər yeməyi",
      "continental-breakfast": "Kontinental səhər yeməyi",
      "dinner": "Axşam yeməyi daxil",
      "english-breakfast": "İngilis səhər yeməyi",
      "full-board": "Tam pansion (3 öğün)",
      "half-board": "Yarım pansion (Səhər + Axşam yeməyi)",
      "half-board-dinner": "Yarım pansion (Axşam yeməyi ilə)",
      "half-board-lunch": "Yarım pansion (Nahar ilə)",
      "irish-breakfast": "İrlandiya səhər yeməyi",
      "israeli-breakfast": "İsrail səhər yeməyi",
      "japanese-breakfast": "Yapon səhər yeməyi",
      "lunch": "Nahar yeməyi daxil",
      "nomeal": "Yemək daxil deyil",
      "scandinavian-breakfast": "Skandinaviya səhər yeməyi",
      "scottish-breakfast": "Şotlandiya səhər yeməyi",
      "soft-all-inclusive": "Yüngül hər şey daxil (Soft All Inclusive)",
      "some-meal": "Bəzi yeməklər daxil",
      "super-all-inclusive": "Super hər şey daxil (Super All Inclusive)",
      "ultra-all-inclusive": "Ultra hər şey daxil (Ultra All Inclusive)",
      // support underscore formats too
      "all_inclusive": "Hər şey daxil (All Inclusive)",
      "half_board": "Yarım pansion (Səhər + Axşam yeməyi)",
      "full_board": "Tam pansion (3 öğün)",
      "room_only": "Yalnız otaq",
      "no_meal": "Yemək daxil deyil",
    };
    const normalizedMeal = (rate.meal || "").toLowerCase().replace(/_/g, "-");
    const mealLabel = mealMap[normalizedMeal] || mealMap[rate.meal || ""] || rate.meal || "Məlumat yoxdur";

    // Yeməkdən asılı əlavə "daxil" xidmətlər
    const mealIncluded: string[] = [];
    const mealKey = rate.meal || "";
    if (mealKey === "all_inclusive" || mealKey === "ultra_all_inclusive") {
      mealIncluded.push("Səhər yeməyi", "Nahar", "Axşam yeməyi", "Snack bar", "Yerli içkilər");
      if (mealKey === "ultra_all_inclusive") mealIncluded.push("Premium alkoqol", "A la carte restoranlar");
    } else if (mealKey === "breakfast") {
      mealIncluded.push("Səhər yeməyi (buffet)");
    } else if (mealKey === "half_board") {
      mealIncluded.push("Səhər yeməyi", "Axşam yeməyi");
    } else if (mealKey === "full_board") {
      mealIncluded.push("Səhər yeməyi", "Nahar", "Axşam yeməyi");
    }

    const finalIncluded = [...new Set([...mealIncluded, ...parsed.included])];
    const finalExtra    = [...new Set([...parsed.extra])];
    // All-inclusive-də öz-özlüyündə "ödənişli" aktivitələr də daxil ola bilər
    if (parsed.all_inclusive) {
      finalIncluded.push(...parsed.activities_paid.filter(a => !finalIncluded.includes(a)));
    }

    offers.push({
      hotel_key:        `${hid}_${checkin}_${checkout}`,
      hotel_id:         String(hid),
      hotel_string_id:  stringId,
      hotel_name:       hotel.name || slugName || `Otel #${hid}`,
      destination,
      checkin,
      checkout,
      price_usd:        Math.round(totalPrice * 1.15 * 100) / 100,
      stars:            hotel.star_rating || 0,
      room_type:        rate.room_name || "",
      meal:             mealLabel,
      updated_at:       new Date().toISOString(),
      address:          hotel.address || hotel.location?.address || "",
      sea_front:        parsed.sea_front,
      included_services: finalIncluded,
      extra_services:   finalExtra,
      activities_free:  parsed.activities_free,
      activities_paid:  parsed.activities_paid,
      wifi_free:        parsed.wifi_free,
      has_pool:         parsed.has_pool,
      has_beach:        parsed.has_beach,
      all_inclusive:    parsed.all_inclusive,
      check_in_time:    hotel.check_in_time  || "14:00",
      check_out_time:   hotel.check_out_time || "12:00",
      description:      hotel.description || "",
      photos:           (hotel.images || []).slice(0, 3).map((img: RatehawkImage) => img.url || img.src || ""),
      book_hash:        rate.book_hash || undefined,
    });
  }

  return offers;
}

// Bir otel üçün tam detallar (amenity, ünvan, fəaliyyətlər)
export async function getHotelDetails(hotelId: string): Promise<HotelDetails | null> {
  try {
    const res = await ratehawkPost("/hotel/info/", {
      id: hotelId,
      language: "en",
    }) as RatehawkInfoResponse;

    if (res.status !== "ok" || !res.data) return null;
    const h = res.data;

    const amenityCodes: string[] = h.amenity_groups?.flatMap(
      (g: RatehawkAmenityGroup) => g.amenities || []
    ) || [];
    const parsed = parseAmenities(amenityCodes);

    return {
      hotel_id:    String(h.hid || hotelId),
      name:        h.name || "",
      address:     h.address || "",
      description: h.description || "",
      stars:       h.star_rating || 0,
      amenities:   parsed.included,
      wifi_free:   parsed.wifi_free,
      has_pool:    parsed.has_pool,
      has_beach:   parsed.has_beach,
      activities:  parsed.activities_free,
      check_in_time:  h.check_in_time  || "14:00",
      check_out_time: h.check_out_time || "12:00",
      phone:       h.phone || "",
      email:       h.email || "",
      latitude:    h.latitude  || 0,
      longitude:   h.longitude || 0,
    };
  } catch {
    return null;
  }
}

export interface HotelDetails {
  hotel_id:       string;
  name:           string;
  address:        string;
  description:    string;
  stars:          number;
  amenities:      string[];
  wifi_free:      boolean;
  has_pool:       boolean;
  has_beach:      boolean;
  activities:     string[];
  check_in_time:  string;
  check_out_time: string;
  phone:          string;
  email:          string;
  latitude:       number;
  longitude:      number;
}

export interface SearchGuest {
  adults:   number;
  children: number[];   // uşaqların yaşları, məs: [3, 10]
}

// Otel ID-ləri ilə axtarış: /search/serp/hotels/ (supports chunking up to 100 hids)
export async function searchHotels(
  destination: DestinationGroup,
  checkin: string,
  checkout: string,
  guests: SearchGuest[] = [{ adults: 2, children: [] }],
  residency = "az"
): Promise<HotelOffer[]> {
  try {
    const hids = destination.hids;
    const CHUNK_SIZE = 100;
    const chunks: number[][] = [];
    for (let i = 0; i < hids.length; i += CHUNK_SIZE) {
      chunks.push(hids.slice(i, i + CHUNK_SIZE));
    }

    let allOffers: HotelOffer[] = [];
    for (const chunk of chunks) {
      const res = await ratehawkPost("/search/serp/hotels/", {
        checkin,
        checkout,
        residency,
        language: "en",
        currency: "USD",
        guests,
        hids: chunk,
      });

      if (res.status === "ok" && res.data?.hotels) {
        const parsed = parseHotels(res.data.hotels, destination.name, checkin, checkout);
        allOffers = allOffers.concat(parsed);
      } else if (res.status !== "ok") {
        console.error(`RateHawk (${destination.name}) chunk error: status=${res.status}`, res.error || "");
      }
    }
    return allOffers;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    console.error(`RateHawk searchHotels (${destination.name}):`, {
      message: e.message,
      code: e.code,
      stack: e.stack?.slice(0, 300),
    });
    throw err; // outer catch-də görünsün
  }
}

// ── RateHawk-vari axtarış: multicomplete (avtomatik tamamlama) + region serp ──

// Şəhər/region/otel avtomatik tamamlama: /search/multicomplete/
export async function multicomplete(query: string, language = "en"): Promise<{
  regions: { id: number; name: string; type?: string }[];
  hotels: { id: string; name: string }[];
}> {
  try {
    const res = await ratehawkPost("/search/multicomplete/", { query, language });
    if (res.status !== "ok") return { regions: [], hotels: [] };
    const d = (res.data || {}) as {
      regions?: { id: number; name: string; type?: string }[];
      hotels?: { id: string; name: string }[];
    };
    return { regions: d.regions || [], hotels: d.hotels || [] };
  } catch (e) {
    console.error("RateHawk multicomplete:", (e as Error).message);
    return { regions: [], hotels: [] };
  }
}

// Region üzrə bütün otelləri axtar: /search/serp/region/ (RateHawk-ın əsl axtarışı)
export async function searchHotelsByRegion(
  regionId: number,
  regionName: string,
  checkin: string,
  checkout: string,
  guests: SearchGuest[] = [{ adults: 2, children: [] }],
  residency = "az",
  limit = 60
): Promise<HotelOffer[]> {
  try {
    const res = await ratehawkPost("/search/serp/region/", {
      region_id: regionId,
      checkin,
      checkout,
      residency,
      language: "en",
      currency: "USD",
      guests,
    });
    if (res.status === "ok" && res.data?.hotels) {
      return parseHotels(res.data.hotels.slice(0, limit), regionName, checkin, checkout);
    }
    if (res.status !== "ok") {
      console.error(`RateHawk serp/region (${regionName}) status=${res.status}`, res.error || "");
    }
    return [];
  } catch (e) {
    console.error(`RateHawk searchHotelsByRegion (${regionName}):`, (e as Error).message);
    return [];
  }
}

// ── Hotel page (hp) + static — RateHawk detal axını (otaqlar, rg_ext şəkillər) ──

const MEAL_LABELS: Record<string, string> = {
  "all-inclusive": "Hər şey daxil (All Inclusive)",
  "breakfast": "Səhər yeməyi daxil",
  "breakfast-buffet": "Açıq büfe səhər yeməyi",
  "half-board": "Yarım pansion (səhər + axşam)",
  "full-board": "Tam pansion (3 öğün)",
  "dinner": "Axşam yeməyi daxil",
  "lunch": "Nahar daxil",
  "nomeal": "Yemək daxil deyil",
  "room-only": "Yalnız otaq",
  "soft-all-inclusive": "Yüngül hər şey daxil",
  "ultra-all-inclusive": "Ultra hər şey daxil",
};
export function mealLabel(code: string): string {
  const k = (code || "").toLowerCase().replace(/_/g, "-");
  return MEAL_LABELS[k] || code || "Yemək daxil deyil";
}

export interface RoomRate {
  book_hash:    string;
  room_name:    string;
  meal:         string;
  meal_code:    string;
  rg_ext:       Record<string, number>;
  price_usd:    number;
  price_azn:    number;
  free_cancellation_until: string | null;
  cancellation_penalty:    string | null;
  images:       string[];
}

export interface HotelStatic {
  hotel_id:    string;
  name:        string;
  stars:       number;
  address:     string;
  description: string;
  photos:      string[];
  amenities:   string[];
  room_groups: { rg_ext: Record<string, number>; name: string; images: string[] }[];
}

interface HpRate {
  book_hash?: string;
  room_name?: string;
  meal?:      string;
  rg_ext?:    Record<string, number>;
  payment_options?: { payment_types?: Array<{
    show_amount?: string; amount?: string;
    cancellation_penalties?: { policies?: Array<{ amount_charge?: string; end_at?: string | null }> };
  }> };
}
interface StaticRoomGroup { rg_ext?: Record<string, number>; name?: string; name_struct?: { main_name?: string }; images?: string[]; }
interface StaticInfo {
  hid?: number; name?: string; star_rating?: number; address?: string; description?: string;
  description_struct?: Array<{ paragraphs?: string[] }>; images?: string[];
  amenity_groups?: Array<{ amenities?: string[] }>; room_groups?: StaticRoomGroup[];
}

const img = (url: string): string => (url || "").replace("{size}", "640x400");

// Static: foto + room_groups (rg_ext + şəkillər)
export async function getHotelStaticFull(hotelId: string): Promise<HotelStatic | null> {
  try {
    const res = await ratehawkPost("/hotel/info/", { id: hotelId, language: "en" });
    if (res.status !== "ok" || !res.data) return null;
    const h = res.data as StaticInfo;
    const amenityCodes: string[] = (h.amenity_groups || []).flatMap((g) => g.amenities || []);
    return {
      hotel_id:    String(h.hid || hotelId),
      name:        h.name || "",
      stars:       h.star_rating || 0,
      address:     h.address || "",
      description: (h.description_struct || []).map((d) => (d.paragraphs || []).join(" ")).join("\n\n") || h.description || "",
      photos:      (h.images || []).slice(0, 12).map(img),
      amenities:   parseAmenities(amenityCodes).included,
      room_groups: (h.room_groups || []).map((rg) => ({
        rg_ext: rg.rg_ext || {},
        name:   rg.name_struct?.main_name || rg.name || "",
        images: (rg.images || []).slice(0, 4).map(img),
      })),
    };
  } catch { return null; }
}

// rg_ext uyğunluğu: ən çox uyğun gələn room_group-un şəkilləri (Anna #3 — düzgün yol)
function matchRoomImages(rgExt: Record<string, number>, groups: HotelStatic["room_groups"]): string[] {
  if (!rgExt || !groups?.length) return [];
  let best: HotelStatic["room_groups"][number] | null = null;
  let bestScore = -1;
  for (const g of groups) {
    let score = 0;
    for (const k of Object.keys(rgExt)) if (g.rg_ext?.[k] === rgExt[k]) score++;
    if (score > bestScore) { bestScore = score; best = g; }
  }
  return best?.images || [];
}

// Hotel page: otaq rate-ləri (book_hash ilə) + static şəkillər birləşmiş
export async function getHotelPage(
  hotelId: string, checkin: string, checkout: string,
  guests: SearchGuest[] = [{ adults: 2, children: [] }], residency = "az"
): Promise<{ static: HotelStatic | null; rooms: RoomRate[] }> {
  const [staticData, hpRes] = await Promise.all([
    getHotelStaticFull(hotelId),
    ratehawkPost("/search/hp/", { id: hotelId, checkin, checkout, residency, language: "en", currency: "USD", guests }),
  ]);
  const rooms: RoomRate[] = [];
  const hotels = (hpRes.status === "ok" && hpRes.data?.hotels) as Array<{ rates?: HpRate[] }> | undefined;
  const rates = hotels?.[0]?.rates || [];
  for (const rate of rates) {
    const pt = rate.payment_options?.payment_types?.[0];
    const totalUsd = parseFloat(pt?.show_amount || pt?.amount || "0");
    if (!rate.book_hash || totalUsd <= 0) continue;
    const usd = Math.ceil(totalUsd * 1.15);
    const policies = pt?.cancellation_penalties?.policies || [];
    const freePolicy = policies.find((p) => parseFloat(p.amount_charge || "0") === 0 && p.end_at);
    const penalty = policies.find((p) => parseFloat(p.amount_charge || "0") > 0);
    rooms.push({
      book_hash: rate.book_hash,
      room_name: rate.room_name || "Standart otaq",
      meal:      mealLabel(rate.meal || ""),
      meal_code: rate.meal || "",
      rg_ext:    rate.rg_ext || {},
      price_usd: usd,
      price_azn: Math.ceil(usd * 1.70),
      free_cancellation_until: freePolicy?.end_at || null,
      cancellation_penalty:    penalty ? `${Math.ceil(parseFloat(penalty.amount_charge || "0") * 1.15)} USD` : null,
      images:    staticData ? matchRoomImages(rate.rg_ext || {}, staticData.room_groups) : [],
    });
  }
  return { static: staticData, rooms };
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

interface RatehawkInfoResponse {
  status: string;
  data?: RatehawkHotelInfo;
  error?: string;
}

interface RatehawkAmenityGroup {
  amenities?: string[];
  group_name?: string;
}

interface RatehawkImage {
  url?: string;
  src?: string;
}

interface RatehawkRate {
  daily_prices?: string[];
  room_name?: string;
  meal?: string;
  amenities_data?: string[];
  book_hash?: string;
  payment_options?: {
    payment_types?: { amount?: string; show_amount?: string }[];
  };
}

interface RatehawkHotel {
  hid?: number;
  id?: string;
  name?: string;
  star_rating?: number;
  rates?: RatehawkRate[];
  address?: string;
  description?: string;
  check_in_time?: string;
  check_out_time?: string;
  amenity_groups?: RatehawkAmenityGroup[];
  images?: RatehawkImage[];
  location?: { address?: string };
}

interface RatehawkHotelInfo {
  hid?: number;
  id?: string;
  name?: string;
  star_rating?: number;
  address?: string;
  description?: string;
  check_in_time?: string;
  check_out_time?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  amenity_groups?: RatehawkAmenityGroup[];
}

export async function searchHotelsForAI(params: {
  destination: string;
  checkin: string;
  checkout: string;
  guests?: number;
}): Promise<string> {
  const query = params.destination.toLowerCase().trim();
  const destGroup = TRACKED_DESTINATIONS.find((d) => {
    const name = d.name.toLowerCase();
    return (
      name.includes(query) ||
      query.includes(name) ||
      (query.includes("sharm") && name.includes("şarm")) ||
      (query.includes("hurghada") && name.includes("hurgada"))
    );
  });

  if (!destGroup) {
    return `Sandbox rejimində yalnız Los Angeles, İstanbul, Dubai, Antalya, Şarm əş-Şeyx və Hurgada üçün otel axtarmaq mümkündür. Zəhmət olmasa bu şəhərlərdən birini daxil edin.`;
  }

  try {
    const guests = [{ adults: params.guests || 2, children: [] }];
    const offers = await searchHotels(destGroup, params.checkin, params.checkout, guests);

    if (!offers.length) {
      return `${destGroup.name} üçün ${params.checkin} – ${params.checkout} tarixlərinə otel tapılmadı.`;
    }

    const nights = Math.max(1, Math.ceil(
      (new Date(params.checkout).getTime() - new Date(params.checkin).getTime()) / 86400000
    ));

    const byHotel: Record<string, HotelOffer[]> = {};
    for (const h of offers) {
      if (!byHotel[h.hotel_name]) byHotel[h.hotel_name] = [];
      byHotel[h.hotel_name].push(h);
    }

    const lines = Object.entries(byHotel).map(([hotelName, variants]) => {
      const stars = "★".repeat(variants[0].stars);
      const addressStr = variants[0].address ? ` (${variants[0].address})` : "";
      const variantLines = variants.map(v => {
        const aznPrice = Math.ceil(v.price_usd * 1.70);
        const aznPerNight = Math.ceil(aznPrice / nights);
        return `  - Otaq: ${v.room_type} | Qidalanma: ${v.meal} | Gecəlik: ${aznPerNight} AZN (Cəmi ${nights} gecə: ${aznPrice} AZN) | [HASH:${v.book_hash || "Yox"}]`;
      }).join("\n");
      return `${hotelName} ${stars}${addressStr}\n${variantLines}`;
    });

    return [
      `${destGroup.name} — ${params.checkin} – ${params.checkout} (${nights} gecə, ${params.guests || 2} nəfər):`,
      "",
      lines.join("\n\n"),
      "",
      "Bütün qiymətlərə xidmət haqqı daxildir. Sifariş üçün müştəriyə variant seçdirin.",
    ].join("\n");
  } catch (e) {
    return `Otel sistemi hazırda cavab vermir. Zəhmət olmasa bir az sonra yenidən cəhd edin.`;
  }
}

