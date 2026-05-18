import Anthropic from "@anthropic-ai/sdk";
import { getToursContext } from "./rag";
import { getExamples, formatExamplesForPrompt } from "./ai-memory";
import { searchFlights, formatOffersForAI } from "./duffel";
import { analyzePrices } from "./price-agent";
import { CRMProfile, formatProfileForAI } from "./crm-profile";
import { searchCruises } from "./cruises";
import { searchTrains } from "./trains";
import { searchBuses } from "./buses";

import {
  checkTourAvailability,
  getWeatherForecast,
  getExchangeRate,
  calculatePackage,
  saveLeadToCRM,
  getVisaInfo,
} from "./tools";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are "Nigar xanım", the premium, professional, and elite Global AI Travel Concierge for Natoure.
Your goal is to guide every conversation into a successful booking (flights, hotels, cruises, trains, buses, and tours).

=== KİMLİYİN / IDENTITY ===
- You are a real human travel concierge — sophisticated, short, clear, and sales-oriented.
- Do not write massive paragraphs. Keep it short and elegant.
- Every response must drive the user closer to making a booking.

=== LANGUANGE & CURRENCY POLICY ===
1. PRIMARY LANGUAGE & CURRENCY: Default to English and USD ($) for global/US travelers.
2. DYNAMIC LANGUAGE FALLBACK: If the user addresses you in Azerbaijani (or another language), instantly switch to that language and adopt the regional currency (e.g. AZN (₼) for Azerbaijani).
3. EXCHANGR RATES: Use the get_exchange_rate tool if you need to convert between USD and AZN.
4. All prices must include a 15% Flynatoure concierge service fee (already calculated by tools). Mention that "all taxes and service fees are included".

=== AZƏRBAYCAN DİLİ QAYDALARI (IF CHATTING IN AZERBAIJANI) ===
Ahəng Qanunu, Rəsmi "Siz" müraciəti (Siz, Sizin, Sizə), və fel zamanı qaydalarına tam riayət et:
- AHƏNG QANUNU: tur+lar, otel+lər, müştəri+yə, Bakı+dan
- FEL ZAMANLARI: ✓ gəlir, ✓ getdi, ✓ edəcəyik (NOT: edəcik), ✓ deyil (NOT: deil)
- DÜZGÜN YAZILIŞ: ✓ zəhmət olmasa, ✓ hörmətlə, ✓ salam (NOT: merhaba), ✓ əlaqə saxlayacağıq (NOT: iletişime geçeceğiz), ✓ nəfər (NOT: kişi)
- Qiymət göstərəndə AZN manat simvolu və ya AZN qeyd et. Mötərizədə USD qarşılığını göstər.

=== INITIAL LEAD QUALIFICATION ===
In your very first message, gracefully ask for:
1. Destination/Region (Where would you like to explore?)
2. Passenger count (How many travelers?)
3. Travel dates
4. Approximate budget (in USD or AZN)

If they are unsure of where to go, recommend these premium routes:
- 🌴 Western Caribbean Cruise (Miami departure)
- 🏨 Luxury Hotel Stay in Dubai or Paris
- 🚊 Amtrak Acela Express Corridor (New York to Washington D.C. or Boston)
- ✈️ Bullet Train Scenic Getaway (Tokyo to Osaka)
- 🕌 Cultural getaway in Istanbul or Amalfi Coast

=== DATE FORMATTING ===
Always format dates to YYYY-MM-DD when calling search tools. The current year is 2026.

=== TRANSIT MODES & TOOL USAGE RULES ===
Determine the search intent and call the exact tool. Never mix tools:

── 1. FLIGHT SEARCH (Uçuş axtarışı) ──
- Keywords: flight, air ticket, fly, bilet, uçuş, uçaq
- Tool: search_flights
- Always prefer the user's geolocated airport code (passed in CRM profile or context) as the default origin. If not found, ask them, or default to JFK for US or GYD for Azerbaijan.
- Result Block: Add FLIGHT_PACKAGE:{"offer_id":"<ID>","airline":"<name>","price_usd":<price>,"departure":"<time>","arrival":"<time>","duration_min":<min>,"stops":<stops>,"from":"<IATA>","to":"<IATA>"} at the very end of your response.

── 2. HOTEL SEARCH (Otel axtarışı) ──
- Keywords: hotel, stay, resort, otel, mehmanxana, qalmaq
- Tool: search_hotels
- Result Block: Add HOTEL_PACKAGE:{"hotel_id":"<ID>","hotel_name":"<name>","destination":"<city>","checkin":"<YYYY-MM-DD>","checkout":"<YYYY-MM-DD>","nights":<nights>,"price_usd":<price>,"rating":<rating>,"stars":<stars>,"booking_url":"<url>"} at the very end of your response.

── 3. CRUISE SEARCH (Kruiz axtarışı) ──
- Keywords: cruise, liner, sea voyage, gemi, kruiz, dəniz səyahəti
- Tool: search_cruises (supports Caribbean, Mediterranean, Alaska, Europe, Asia)
- Result Block: Add CRUISE_PACKAGE:{"cruise_id":"<ID>","name":"<name>","shipName":"<ship>","cruiseLine":"<line>","departurePort":"<port>","nights":<nights>,"price_usd":<price>,"start_date":"<YYYY-MM-DD>"} at the very end of your response.

── 4. RAIL SEARCH (Qatar axtarışı) ──
- Keywords: train, rail, Amtrak, Eurostar, Shinkansen, qatar, vaqon, Stadler
- Tool: search_trains
- Result Block: Add TRAIN_PACKAGE:{"train_id":"<ID>","trainNumber":"<no>","operator":"<operator>","origin":"<city>","destination":"<city>","departureTime":"<time>","duration":<min>,"price_usd":<price>} at the very end of your response.

── 5. BUS SEARCH (Avtobus axtarışı) ──
- Keywords: bus, Greyhound, Flixbus, avtobus, reys
- Tool: search_buses
- Result Block: Add BUS_PACKAGE:{"bus_id":"<ID>","operator":"<operator>","origin":"<city>","destination":"<city>","departureTime":"<time>","price_usd":<price>} at the very end of your response.

── 6. TOUR SEARCH (Paket Tur axtarışı) ──
- Keywords: tour, package, all-inclusive, tur, paket
- Tool: check_tour_availability
- Result Block: Add TOUR_PACKAGE:{"tour_id":"<ID>","tour_name":"<name>","destination":"<city>","price_usd":<price>,"start_date":"<YYYY-MM-DD>"} at the very end.

=== OPERATOR HANDOFF ===
If the user requests a human manager, operator, "özünüz", "canlı", or similar, respond with exactly:
OPERATOR_HANDOFF: Of course! I am transferring you to our live concierge agent immediately. Please hold on for a few seconds.
Do not add any other text.

=== REGISTRATION PROMOTION ===
If CRM_CONTEXT indicates "Registered: NO" (Qeydiyyat: YOX), naturally invite them in the 2nd or 3rd message:
"By registering on natourefly.com/register, you earn luxury reward points on this booking that can be used for free transfers or hotel upgrades."

=== CLOSING & CTA ===
Every response must end with a clear, engaging call-to-action (CTA) like "Shall we lock in this rate?", "Which cabin style do you prefer?", or "Would you like me to reserve a window seat?"

=== CUSTOMER PROFILE ===
{CRM_CONTEXT}

=== ACTIVE TOURS ===
{TOURS_CONTEXT}

Response must end with this customer data JSON block (fill null if unknown):
<customer_data>
{
  "name": "name or null",
  "phone": "phone or null",
  "email": "email or null",
  "destination": "destination or null",
  "travel_date": "date or null"
}
</customer_data>`;

// ─── STATIC CACHE ─────────────────────────────────────────────────────────────
let _cachedStaticFinal: string | null = null;

async function getStaticFinal(): Promise<string> {
  if (_cachedStaticFinal) return _cachedStaticFinal;
  const staticSystem = SYSTEM_PROMPT
    .replace(/=== ACTIVE TOURS ===\s*\{TOURS_CONTEXT\}/g, "")
    .replace(/=== CUSTOMER PROFILE ===\s*\{CRM_CONTEXT\}/g, "");
  const examples = await getExamples(null);
  _cachedStaticFinal = staticSystem + formatExamplesForPrompt(examples);
  return _cachedStaticFinal;
}

// ─── TOOLS ────────────────────────────────────────────────────────────────────
const ALL_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_flights",
    description: "Searches flights globally. Call when the user mentions flights, airline tickets, or flight booking.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: { type: "string", description: "Departure IATA airport code (e.g. JFK, SFO, GYD, LHR)" },
        destination: { type: "string", description: "Arrival IATA airport code (e.g. DXB, CDG, IST, NRT)" },
        date: { type: "string", description: "Departure date YYYY-MM-DD" },
        return_date: { type: "string", description: "Return flight date YYYY-MM-DD (optional)" },
        passengers: { type: "number", description: "Number of travelers (default: 1)" }
      },
      required: ["destination", "date"]
    }
  },
  {
    name: "search_hotels",
    description: "Searches global hotel options. Call when the user requests hotels, resorts, or stays.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "City name in English (e.g. Dubai, Paris, Antalya)" },
        checkin: { type: "string", description: "Check-in date YYYY-MM-DD" },
        checkout: { type: "string", description: "Check-out date YYYY-MM-DD" },
        adults: { type: "number", description: "Number of guests (default: 2)" },
        rooms: { type: "number", description: "Number of rooms (default: 1)" },
        stars: { type: "number", description: "Minimum hotel stars: 3, 4, or 5 (optional)" }
      },
      required: ["destination", "checkin", "checkout"]
    }
  },
  {
    name: "search_cruises",
    description: "Searches premium cruise voyages. Call when the user requests a cruise, liner, or sea voyage.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "Cruise region/destination: Caribbean, Mediterranean, Alaska, Asia" },
        date: { type: "string", description: "Preferred start date YYYY-MM-DD" }
      },
      required: ["destination", "date"]
    }
  },
  {
    name: "search_trains",
    description: "Searches high-speed or express rail connections. Call when the user requests train or rail travel.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: { type: "string", description: "Departure city (e.g. New York, London, Tokyo, Baku)" },
        destination: { type: "string", description: "Arrival city (e.g. Washington, Paris, Osaka, Ganja)" },
        date: { type: "string", description: "Travel date YYYY-MM-DD" },
        passengers: { type: "number", description: "Number of travelers (default: 1)" }
      },
      required: ["origin", "destination", "date"]
    }
  },
  {
    name: "search_buses",
    description: "Searches express intercity bus connections. Call when the user requests bus travel.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: { type: "string", description: "Departure city (e.g. New York, Paris, Baku)" },
        destination: { type: "string", description: "Arrival city (e.g. Boston, Amsterdam, Sheki)" },
        date: { type: "string", description: "Travel date YYYY-MM-DD" },
        passengers: { type: "number", description: "Number of travelers (default: 1)" }
      },
      required: ["origin", "destination", "date"]
    }
  },
  {
    name: "check_tour_availability",
    description: "Checks active dynamic tours. Call when the user inquires about package tours.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "Destination city or country (optional)" },
        month: { type: "string", description: "Preferred travel month name (optional)" }
      },
      required: []
    }
  },
  {
    name: "get_weather",
    description: "Fetches weather forecasts for a city. Call when the user asks about the climate/weather.",
    input_schema: {
      type: "object" as const,
      properties: {
        city: { type: "string", description: "City name: New York, London, Dubai, Baku, etc." },
        date: { type: "string", description: "Date YYYY-MM-DD (optional)" }
      },
      required: ["city"]
    }
  },
  {
    name: "get_exchange_rate",
    description: "Fetches current USD/EUR to AZN exchange rates for currency conversion calculations.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: []
    }
  },
  {
    name: "calculate_package",
    description: "Calculates total package price combining flights, hotels, and custom options in USD/AZN.",
    input_schema: {
      type: "object" as const,
      properties: {
        flight_total_usd: { type: "number", description: "Total flight price in USD (concierge markup included)" },
        hotel_total_usd: { type: "number", description: "Total hotel price in USD (concierge markup included)" },
        nights: { type: "number", description: "Number of nights" },
        passengers: { type: "number", description: "Number of travelers" },
        include_transfer: { type: "boolean", description: "Add private premium airport transfers (default: false)" }
      },
      required: ["flight_total_usd", "hotel_total_usd", "nights", "passengers"]
    }
  },
  {
    name: "get_visa_info",
    description: "Checks visa requirements for various passport nationalities. Call when the user asks about visas.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "Destination country (e.g. France, UAE, Japan)" },
        nationality: { type: "string", description: "Passport nationality (default: Azerbaijani)" }
      },
      required: ["destination"]
    }
  },
  {
    name: "save_lead",
    description: "Saves verified booking details to CRM when the user explicitly agrees to proceed with reservation.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Full name" },
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
        destination: { type: "string", description: "Selected destination" },
        travel_date: { type: "string", description: "Departure date YYYY-MM-DD" },
        budget: { type: "string", description: "User budget (e.g. '$2500')" },
        notes: { type: "string", description: "Itinerary / seat preference notes" }
      },
      required: []
    }
  },
  {
    name: "analyze_prices",
    description: "Performs comparisons and creates package recommendations. Call when users seek cheap, optimal, or luxury comparisons.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "Destination city" },
        checkin: { type: "string", description: "Check-in YYYY-MM-DD (optional)" },
        checkout: { type: "string", description: "Check-out YYYY-MM-DD (optional)" },
        guests: { type: "number", description: "Number of travelers (default: 2)" }
      },
      required: ["destination"]
    }
  }
];

// ─── TOOL EXECUTOR ─────────────────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "search_flights": {
      try {
        const offers = await searchFlights({
          origin: (input.origin as string) || "JFK",
          destination: input.destination as string,
          date: input.date as string,
          return_date: input.return_date as string | undefined,
          passengers: (input.passengers as number) || 1,
        });
        return offers.length > 0
          ? formatOffersForAI(offers)
          : `No direct flights found for ${input.destination} on ${input.date}. Suggest alternative dates (±3-5 days) or connecting options.`;
      } catch (e) {
        return `Flight search temporarily unavailable. Let the client know: "I am having our booking coordinators pull these flight routes directly — may I note your contact details?"`;
      }
    }

    case "search_hotels": {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.natourefly.com"}/api/hotels/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: input.destination,
            checkin:     input.checkin,
            checkout:    input.checkout,
            adults:      input.adults || 2,
            rooms:       input.rooms  || 1,
            currency:    "USD",
            stars:       input.stars  || undefined,
          }),
          signal: AbortSignal.timeout(12000),
        });
        const data = await res.json();
        const hotels = data.hotels || [];
        if (hotels.length === 0) {
          return `No hotels found in ${input.destination} for dates ${input.checkin} - ${input.checkout}.`;
        }
        return hotels.map((h: { name: string; price_marked_up: number; nights: number; rating: number | null; stars: number | null; id: string }) =>
          `[HOTEL_ID:${h.id}] ${h.name} | $${Math.ceil(h.price_marked_up / 1.7)} USD (${h.nights} nights, all fees included) | Rating: ${h.rating ?? "—"}/10 | ${h.stars ? h.stars + "★" : ""}`
        ).join("\n");
      } catch {
        return "Hotel search encountered an issue. Please try again.";
      }
    }

    case "search_cruises": {
      try {
        const cruises = await searchCruises(input.destination as string, input.date as string);
        if (cruises.length === 0) return `No cruise packages found for ${input.destination}.`;
        return cruises.map(c => 
          `[CRUISE_ID:${c.id}] ${c.name} aboard ${c.shipName} (${c.cruiseLine}) | Departs: ${c.departurePort} | ${c.durationNights} nights | Total Price: $${c.priceUsd} USD | Rating: ${c.rating}/5`
        ).join("\n");
      } catch (e) {
        return "Cruise search error. Please try again.";
      }
    }

    case "search_trains": {
      try {
        const trains = await searchTrains(input.origin as string, input.destination as string, input.date as string, (input.passengers as number) || 1);
        if (trains.length === 0) return `No rail connections found between ${input.origin} and ${input.destination}.`;
        return trains.map(t =>
          `[TRAIN_ID:${t.id}] ${t.trainNumber} (${t.operator}) - ${t.trainType} | ${t.origin} -> ${t.destination} | Departs: ${t.departureTime} | Duration: ${t.durationMinutes} min | Price: $${t.priceUsd} USD | Green Rating: Saved ${t.co2SavedKg}kg CO2`
        ).join("\n");
      } catch (e) {
        return "Rail search error. Please try again.";
      }
    }

    case "search_buses": {
      try {
        const buses = await searchBuses(input.origin as string, input.destination as string, input.date as string, (input.passengers as number) || 1);
        if (buses.length === 0) return `No bus connections found between ${input.origin} and ${input.destination}.`;
        return buses.map(b =>
          `[BUS_ID:${b.id}] Bus ${b.busNumber} (${b.operator}) | ${b.origin} -> ${b.destination} | Departs: ${b.departureTime} | Duration: ${b.durationMinutes} min | Price: $${b.priceUsd} USD | Amenities: ${b.amenities.join(", ")}`
        ).join("\n");
      } catch (e) {
        return "Bus search error. Please try again.";
      }
    }

    case "check_tour_availability":
      return checkTourAvailability(
        input.destination as string | undefined,
        input.month as string | undefined
      );

    case "get_weather":
      return getWeatherForecast(input.city as string, input.date as string | undefined);

    case "get_exchange_rate":
      return getExchangeRate();

    case "calculate_package": {
      const flight = (input.flight_total_usd as number) || 0;
      const hotel = (input.hotel_total_usd as number) || 0;
      const nights = (input.nights as number) || 1;
      const passengers = (input.passengers as number) || 1;
      const includeTransfer = (input.include_transfer as boolean) || false;
      const transferCost = includeTransfer ? 45 * passengers : 0;
      const total = flight + hotel + transferCost;
      return `Package Calculated:\n- Flights: $${flight} USD\n- Hotels (${nights} nights): $${hotel} USD\n- Transfer: $${transferCost} USD\n- Total: $${total} USD (All service fees and taxes included for ${passengers} passengers).`;
    }

    case "get_visa_info":
      return getVisaInfo(input.destination as string);

    case "save_lead":
      return saveLeadToCRM({
        name: input.name as string | undefined,
        phone: input.phone as string | undefined,
        email: input.email as string | undefined,
        destination: input.destination as string | undefined,
        travel_date: input.travel_date as string | undefined,
        budget: input.budget as string | undefined,
        notes: input.notes as string | undefined,
      });

    case "analyze_prices": {
      try {
        const destination = input.destination as string;
        const guests = (input.guests as number) || 2;

        let checkin  = input.checkin  as string | undefined;
        let checkout = input.checkout as string | undefined;
        if (!checkin) {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          checkin = d.toISOString().split("T")[0];
        }
        if (!checkout) {
          const d = new Date(checkin);
          d.setDate(d.getDate() + 7);
          checkout = d.toISOString().split("T")[0];
        }

        const report = await analyzePrices({ destination, checkin, checkout, guests });
        return report.natural_text;
      } catch (e) {
        return `Detailed dynamic comparisons are processing. Our coordinators will compile these packages for you shortly.`;
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// Son aləti cache_control ilə işarələ — tools render order-da birinci olduğu üçün
// bu cache həm tools-u, həm sonrakı system-i əhatə edir (~1500-2000 token qənaət)
const CACHED_TOOLS = ALL_TOOLS.map((tool, idx) =>
  idx === ALL_TOOLS.length - 1
    ? { ...tool, cache_control: { type: "ephemeral" } as { type: "ephemeral" } }
    : tool
);

export interface CustomerData {
  name: string | null;
  phone: string | null;
  email: string | null;
  destination: string | null;
  travel_date: string | null;
}

export interface AIResponse {
  message: string;
  customerData: CustomerData;
}

export interface MediaInput {
  type: "url" | "base64";
  url?: string;
  data?: string;
  mimeType?: string;
  mediaType?: "şəkil" | "video" | "fayl" | "ses";
}

function parseCustomerData(text: string): { message: string; customerData: CustomerData } {
  const defaultData: CustomerData = {
    name: null, phone: null, email: null, destination: null, travel_date: null,
  };
  const jsonMatch = text.match(/<customer_data>([\s\S]*?)<\/customer_data>/);
  let customerData = defaultData;
  if (jsonMatch) {
    try { customerData = JSON.parse(jsonMatch[1].trim()); } catch {}
  }
  const message = text.replace(/<customer_data>[\s\S]*?<\/customer_data>/, "").trim();
  return { message, customerData };
}

export async function getAIResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  media?: MediaInput,
  crmProfile?: CRMProfile | null,
  options?: { maxRounds?: number; maxTokens?: number },
  language?: string
): Promise<AIResponse> {
  let userContent: Anthropic.MessageParam["content"];

  if (media) {
    const mediaLabel = media.mediaType || "şəkil";
    const textPrompt = userMessage || `Müştəri bir ${mediaLabel} göndərdi. Müştəriyə cavab ver.`;

    if (media.type === "url" && media.url) {
      userContent = [
         { type: "image", source: { type: "url", url: media.url } },
         { type: "text", text: textPrompt },
      ];
    } else if (media.type === "base64" && media.data && media.mimeType) {
      const supported = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (supported.includes(media.mimeType)) {
        userContent = [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: media.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: media.data,
            },
          },
          { type: "text", text: textPrompt },
        ];
      } else if (media.mimeType?.startsWith("audio") || media.mimeType?.startsWith("video")) {
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Mətn yazaraq sualını bildirsin.`;
      } else {
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Mətnlə sualını bildirməsini xahiş et.`;
      }
    } else {
      userContent = textPrompt;
    }
  } else {
    userContent = userMessage;
  }

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userContent },
  ];

  const msgText = typeof userContent === "string" ? userContent : userMessage;
  const toursContext = await getToursContext(msgText);

  // CRM profil konteksti
  const crmContext = crmProfile
    ? formatProfileForAI(crmProfile)
    : "Müştəri məlumatı yoxdur (qeydiyyatsız və ya ilk yazışma).\nQeydiyyat: YOX — söhbət əsnasında natural şəkildə dəvət et.\nQeydiyyat linki: https://natourefly.com/qeydiyyat";

  // Statik hissə — modul cache-indən al (hər request-də hesablanmır)
  const staticFinal = await getStaticFinal();

  // Dinamik hissə — hər çağırışda dəyişir, cache-lənmir
  const activeLangStr = language
    ? `=== USER'S ACTIVE INTERFACE LANGUAGE ===\nThe user has set their language preference to: "${language.toUpperCase()}". Please default to conversing in this language, unless they explicitly switch. If the language is "TR" (Turkish), converse in clean, elegant, and friendly Turkish. If the language is "EN" (English), converse in premium, elegant English. If the language is "AZ" (Azerbaijani), adopt the regional Azerbaijani language rules outlined in SYSTEM_PROMPT.\n\n`
    : "";

  const dynamicContext =
    activeLangStr +
    `=== AKTUAL TURLAR ===\n${toursContext || "Hal-hazırda aktiv tur məlumatı yoxdur."}\n\n` +
    `=== MÜŞTƏRİ PROFİLİ ===\n${crmContext}`;

  // Agentic loop — tool_use bitənə qədər davam et
  let currentMessages = messages;
  const MAX_ROUNDS = options?.maxRounds ?? 5;
  const MAX_TOKENS = options?.maxTokens ?? 8000;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: MAX_TOKENS,
      system: [
        { type: "text", text: staticFinal,    cache_control: { type: "ephemeral" } as { type: "ephemeral" } },
        { type: "text", text: dynamicContext },
      ] as Anthropic.TextBlockParam[],
      messages: currentMessages,
      tools: CACHED_TOOLS,
      tool_choice: { type: "auto" },
    });

    // Tool çağırışı yoxdursa — final cavab
    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find(b => b.type === "text");
      const fullText = textBlock?.type === "text" ? textBlock.text : "";
      return parseCustomerData(fullText);
    }

    // Tool-ları parallel icra et
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      response.content
        .filter(b => b.type === "tool_use")
        .map(async block => {
          if (block.type !== "tool_use") return null!;
          let result: string;
          try {
            result = await executeTool(block.name, block.input as Record<string, unknown>);
          } catch (e) {
            result = `${block.name} xətası: ${e instanceof Error ? e.message : String(e)}`;
          }
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result,
          };
        })
    );

    currentMessages = [
      ...currentMessages,
      { role: "assistant" as const, content: response.content },
      { role: "user" as const, content: toolResults },
    ];
  }

  // Max dövrə çatdı — operator keçidinə yönləndir
  return parseCustomerData(
    "Hal-hazırda sistemimizdə yüklənmə var. Komandamız sizinlə dərhal əlaqə saxlayacaq. " +
    "Zəhmət olmasa bir neçə dəqiqə gözləyin.\n\n" +
    "<customer_data>{\"name\":null,\"phone\":null,\"email\":null,\"destination\":null,\"travel_date\":null}</customer_data>"
  );
}
