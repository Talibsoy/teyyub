import https from "node:https";

// RATEHAWK_BASE funksiya içində hesablanır (modul-level sabit build-time inline olur)
function getRatehawkBase() {
  return process.env.RATEHAWK_SANDBOX === "true"
    ? "https://api-sandbox.worldota.net/api/b2b/v3"
    : "https://api.worldota.net/api/b2b/v3";
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
    const url = new URL(`${getRatehawkBase()}${endpoint}`);
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

    const totalPrice = Array.isArray(rate.daily_prices)
      ? rate.daily_prices.reduce((sum: number, p: string) => sum + parseFloat(p || "0"), 0)
      : parseFloat(rate.payment_options?.payment_types?.[0]?.amount || "0");

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

    // Meal plan insan dilinə
    const mealMap: Record<string, string> = {
      all_inclusive: "Hər şey daxil (All Inclusive)",
      breakfast:     "Səhər yeməyi daxil",
      half_board:    "Yarım pansion (Səhər + Axşam yeməyi)",
      full_board:    "Tam pansion (3 öğün)",
      room_only:     "Yalnız otaq",
      no_meal:       "Yemək daxil deyil",
    };
    const mealLabel = mealMap[rate.meal || ""] || rate.meal || "Məlumat yoxdur";

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
      amenities:   parsed.readable,
      wifi_free:   parsed.wifi_free,
      has_pool:    parsed.has_pool,
      has_beach:   parsed.has_beach,
      activities:  parsed.activities,
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
    const e = err as NodeJS.ErrnoException;
    console.error(`RateHawk searchHotels (${destination.name}):`, {
      message: e.message,
      code: e.code,
      stack: e.stack?.slice(0, 300),
    });
    throw err; // outer catch-də görünsün
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
  payment_options?: {
    payment_types?: { amount?: string }[];
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
