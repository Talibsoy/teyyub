import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LANG_NAME: Record<string, string> = { az: "Azerbaijani", en: "English", tr: "Turkish" };

// AI Travel Planner: istifadəçinin promptunu parse edir + seçilmiş dildə gün-gün marşrut yaradır.
export async function POST(req: NextRequest) {
  try {
    const { prompt, language } = await req.json();
    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ ok: false, error: "prompt required" }, { status: 400 });
    }
    const lang = LANG_NAME[language] || "English";
    const today = new Date().toISOString().split("T")[0];
    const year = new Date().getFullYear();

    const system = `You are Natoure's AI travel planner. Parse the user's free-text travel request and produce a structured day-by-day plan.
Today is ${today}. Current year ${year}.

Return ONLY valid JSON (no markdown, no commentary) with EXACTLY this shape:
{
  "params": {
    "origin_city": "<origin city; default 'New York' if not stated>",
    "origin_iata": "<3-letter UPPERCASE IATA of the origin's main airport, e.g. JFK>",
    "destination_city": "<destination city in English>",
    "destination_iata": "<3-letter UPPERCASE IATA of the destination's main airport, e.g. DXB>",
    "departure_date_iso": "<YYYY-MM-DD, a future date; pick a sensible one if not stated>",
    "departure_date_label": "<the same date written naturally in ${lang}>",
    "duration_days": <integer nights/days; default 7>,
    "travelers_count": <integer; default 2>,
    "budget": <integer USD; default 2500>,
    "hotel_stars": <integer 3-5; default 4>,
    "hotel_rating": <integer 7-9; default 7>
  },
  "itinerary": [ { "day": <1..N>, "title": "<short day title in ${lang}>", "description": "<one vivid sentence in ${lang}>" } ],
  "bot_message": "<1-2 sentence confirmation in ${lang}: summarize the route (origin -> destination), dates, travelers, and that the plan is ready>"
}

Rules:
- Write ALL human-readable text (titles, descriptions, departure_date_label, bot_message) in ${lang}.
- IATA codes MUST be valid 3-letter uppercase airport codes for each city's main airport.
- "itinerary" MUST contain exactly duration_days items, realistic and specific to the destination.
- If origin is not specified, use origin_city "New York" and origin_iata "JFK".
- departure_date_iso must be today or later.`;

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2200,
      system,
      messages: [{ role: "user", content: String(prompt) }],
    });

    const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON in response");
    const data = JSON.parse(jsonMatch[0]) as {
      params?: Record<string, unknown>;
      itinerary?: unknown[];
      bot_message?: string;
    };

    // IATA-ları böyük hərflə təmizlə
    if (data.params) {
      if (typeof data.params.origin_iata === "string") data.params.origin_iata = data.params.origin_iata.toUpperCase().slice(0, 3);
      if (typeof data.params.destination_iata === "string") data.params.destination_iata = data.params.destination_iata.toUpperCase().slice(0, 3);
    }

    return NextResponse.json({ ok: true, params: data.params, itinerary: data.itinerary || [], bot_message: data.bot_message || "" });
  } catch (err) {
    console.error("[Plan]", err);
    return NextResponse.json({ ok: false, error: "plan_failed" }, { status: 500 });
  }
}
