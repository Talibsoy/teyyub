// app/api/ai-search/route.ts
// NatoureFly Personalization Engine — Natural Language Tour Search + Dynamic Package

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { getSupabaseAdmin }          from "@/lib/supabase";
import { getCachedProfile }          from "@/lib/profile-cache";
import { searchFlights }             from "@/lib/duffel";
import { searchHotels }              from "@/lib/hotels";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Destination → IATA + hotel query mapping
const DEST_MAP: Record<string, { iata: string; hotel: string }> = {
  antalya:    { iata: "AYT", hotel: "Antalya" },
  dubai:      { iata: "DXB", hotel: "Dubai" },
  istanbul:   { iata: "IST", hotel: "Istanbul" },
  bali:       { iata: "DPS", hotel: "Bali" },
  paris:      { iata: "CDG", hotel: "Paris" },
  barcelona:  { iata: "BCN", hotel: "Barcelona" },
  rome:       { iata: "FCO", hotel: "Rome" },
  maldives:   { iata: "MLE", hotel: "Maldives" },
  bangkok:    { iata: "BKK", hotel: "Bangkok" },
  cairo:      { iata: "CAI", hotel: "Cairo" },
  sharm:      { iata: "SSH", hotel: "Sharm El Sheikh" },
  london:     { iata: "LHR", hotel: "London" },
  amsterdam:  { iata: "AMS", hotel: "Amsterdam" },
  tokyo:      { iata: "NRT", hotel: "Tokyo" },
  singapore:  { iata: "SIN", hotel: "Singapore" },
  tbilisi:    { iata: "TBS", hotel: "Tbilisi" },
};

interface SearchIntent {
  destination:    string | null;
  max_budget_azn: number | null;
  group_type:     "couple" | "family" | "solo" | "friends" | null;
  duration_days:  number | null;
  travel_style:   "beach" | "culture" | "adventure" | "luxury" | "budget" | null;
  month:          number | null;
  checkin_date:   string | null;   // YYYY-MM-DD
  checkout_date:  string | null;   // YYYY-MM-DD
  passengers:     number | null;
}

export interface DynamicPackage {
  destination:    string;
  checkin:        string;
  checkout:       string;
  nights:         number;
  passengers:     number;
  hotel_name:     string;
  hotel_stars:    number | null;
  hotel_rating:   number | null;
  flight_stops:   number;
  price_azn:      number;       // Cəmi (uçuş + otel, 17% daxil)
  per_person_azn: number;
  wa_text:        string;
}

interface Tour {
  id: string; name: string; destination: string;
  price_azn: number; start_date: string | null; end_date: string | null;
  max_seats: number; booked_seats: number; hotel: string | null;
  description: string | null; tags: string[] | null;
}

async function extractIntent(prompt: string): Promise<SearchIntent> {
  const today = new Date().toISOString().split("T")[0];
  const year  = new Date().getFullYear();
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `Bu gün: ${today}. Cari il: ${year}.
İstifadəçinin turizm sorğusundan niyyəti JSON formatında çıxar. Yalnız JSON cavab ver.

JSON sahələri:
- destination: ingilis dilindəki şəhər adı (string|null). Azərbaycan/Türk/Rus dilindən çevir.
- max_budget_azn: büdcə AZN (number|null)
- group_type: "couple"|"family"|"solo"|"friends"|null
- duration_days: gün sayı (number|null)
- travel_style: "beach"|"culture"|"adventure"|"luxury"|"budget"|null
- month: ay rəqəmi 1-12 (number|null)
- checkin_date: giriş tarixi YYYY-MM-DD (string|null). "may 15" → "${year}-05-15". Tarix yoxsa null.
- checkout_date: çıxış tarixi YYYY-MM-DD (string|null). "may 15-22" → "${year}-05-22". Tarix yoxsa null.
- passengers: nəfər sayı (number|null). "2 nəfər" → 2. Qeyd olunmayıbsa null.`,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    return JSON.parse(raw.replace(/```json?|```/g, "").trim());
  } catch {
    return { destination: null, max_budget_azn: null, group_type: null, duration_days: null, travel_style: null, month: null, checkin_date: null, checkout_date: null, passengers: null };
  }
}

function scoreTour(tour: Tour, intent: SearchIntent, archetype: string | null): number {
  let score = 0;
  if (intent.max_budget_azn && tour.price_azn <= intent.max_budget_azn) score += 30;
  else if (intent.max_budget_azn && tour.price_azn <= intent.max_budget_azn * 1.2) score += 10;
  if (intent.destination) {
    const dest = tour.destination.toLowerCase();
    const intDest = intent.destination.toLowerCase();
    if (dest.includes(intDest) || intDest.includes(dest)) score += 40;
  }
  const seatsLeft = tour.max_seats - tour.booked_seats;
  if (seatsLeft > 5) score += 5;
  else if (seatsLeft > 0) score += 2;
  if (archetype === "luxury_curator" && tour.price_azn > 2000) score += 15;
  if (archetype === "budget_optimizer" && tour.price_azn < 1000) score += 15;
  if (archetype === "efficiency_seeker" && tour.hotel?.includes("5")) score += 10;
  if (archetype === "deep_relaxer" && (tour.description?.toLowerCase().includes("beach") || ["antalya","bali","maldiv"].some(d => tour.destination.toLowerCase().includes(d)))) score += 12;
  if (tour.start_date) {
    const daysUntil = Math.max(0, (new Date(tour.start_date).getTime() - Date.now()) / 86400000);
    if (daysUntil < 30) score += 8;
    else if (daysUntil < 60) score += 4;
  }
  return score;
}

async function buildDynamicPackage(intent: SearchIntent): Promise<DynamicPackage | null> {
  if (!intent.checkin_date || !intent.checkout_date || !intent.destination) return null;

  const destKey = intent.destination.toLowerCase();
  const destInfo = Object.entries(DEST_MAP).find(([key]) => destKey.includes(key) || key.includes(destKey));
  if (!destInfo) return null;

  const [, { iata, hotel: hotelQuery }] = destInfo;
  const passengers = intent.passengers || 2;
  const nights = Math.max(1, Math.ceil(
    (new Date(intent.checkout_date).getTime() - new Date(intent.checkin_date).getTime()) / 86400000
  ));

  const [flightRes, hotelRes] = await Promise.allSettled([
    searchFlights({ origin: "GYD", destination: iata, date: intent.checkin_date, return_date: intent.checkout_date, passengers }),
    searchHotels({ destination: hotelQuery, checkin: intent.checkin_date, checkout: intent.checkout_date, adults: passengers, rooms: 1 }),
  ]);

  if (flightRes.status === "rejected" || !flightRes.value.length) return null;
  if (hotelRes.status === "rejected" || !hotelRes.value.length) return null;

  const flight = flightRes.value[0];
  const hotel  = hotelRes.value[0];
  const priceAzn = Math.ceil(flight.price_azn + hotel.price_marked_up);

  const checkInFmt  = new Date(intent.checkin_date).toLocaleDateString("az-AZ",  { day: "numeric", month: "long" });
  const checkOutFmt = new Date(intent.checkout_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long" });

  const waText = `Salam! Natoure paket turu ilə maraqlanıram.\nMəkan: ${intent.destination}\nTarix: ${checkInFmt} – ${checkOutFmt} (${nights} gecə)\nNəfər: ${passengers}\nQiymət: ${priceAzn.toLocaleString()} AZN\nRezervasiya etmək istəyirəm.`;

  return {
    destination:    intent.destination,
    checkin:        intent.checkin_date,
    checkout:       intent.checkout_date,
    nights,
    passengers,
    hotel_name:     hotel.name,
    hotel_stars:    hotel.stars,
    hotel_rating:   hotel.rating,
    flight_stops:   flight.stops,
    price_azn:      priceAzn,
    per_person_azn: Math.ceil(priceAzn / passengers),
    wa_text:        waText,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, session_token } = await req.json() as { prompt: string; session_token?: string };
    if (!prompt?.trim()) return NextResponse.json({ ok: false, error: "Prompt boşdur" }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // 1. Extract intent (now includes dates + passengers)
    const intent = await extractIntent(prompt);

    // 2. Get archetype if session exists
    let archetype: string | null = null;
    if (session_token) {
      const { data: user } = await supabase.from("persona_users").select("id").eq("session_token", session_token).single();
      if (user) {
        const cached = await getCachedProfile(user.id);
        archetype = cached?.archetype ?? null;
        if (!archetype) {
          const { data: profile } = await supabase.from("user_profiles").select("archetype").eq("user_id", user.id).single();
          archetype = profile?.archetype ?? null;
        }
      }
    }

    // 3. Try dynamic package if dates specified (parallel with Supabase query)
    const [dynamicPackageResult, toursResult] = await Promise.allSettled([
      buildDynamicPackage(intent),
      (async () => {
        let q = supabase
          .from("tours")
          .select("id, name, destination, price_azn, start_date, end_date, max_seats, booked_seats, hotel, description, tags")
          .eq("is_active", true)
          .gt("max_seats", 0);
        if (intent.destination) q = q.ilike("destination", `%${intent.destination}%`);
        if (intent.max_budget_azn) q = q.lte("price_azn", intent.max_budget_azn * 1.2);
        return q.limit(20);
      })(),
    ]);

    const dynamicPackage = dynamicPackageResult.status === "fulfilled" ? dynamicPackageResult.value : null;
    const toursData = toursResult.status === "fulfilled" ? toursResult.value.data : null;

    // 4. Score + rank Supabase tours
    let scored: (Tour & { _score: number })[] = [];
    if (toursData?.length) {
      scored = (toursData as Tour[])
        .map(t => ({ ...t, _score: scoreTour(t, intent, archetype) }))
        .sort((a, b) => b._score - a._score)
        .slice(0, dynamicPackage ? 3 : 6); // dynamicPackage varsa 3 tur göstər
    } else {
      const { data: fallback } = await supabase
        .from("tours").select("id, name, destination, price_azn, start_date, end_date, max_seats, booked_seats, hotel, description, tags")
        .eq("is_active", true).limit(4);
      scored = (fallback || []).map(t => ({ ...(t as Tour), _score: 0 }));
    }

    // 5. AI intro — template əsasında (əlavə API çağırışı yoxdur)
    const ai_intro = dynamicPackage
      ? `${dynamicPackage.destination} üçün ${dynamicPackage.nights} gecəlik paket hazırlandı — ${dynamicPackage.price_azn.toLocaleString()} AZN.`
      : scored.length > 0
        ? `${intent.destination ? intent.destination + " üçün " : ""}${scored.length} tur tapıldı.`
        : "Axtarışınıza uyğun tur tapılmadı. Ən populyar turlarımıza baxın.";

    return NextResponse.json({
      ok: true,
      tours: scored,
      dynamicPackage,
      intent,
      archetype,
      fallback: !toursData?.length,
      ai_intro,
    });
  } catch (err) {
    console.error("AI Search xətası:", err);
    return NextResponse.json({ ok: false, error: "Server xətası" }, { status: 500 });
  }
}
