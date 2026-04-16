// app/api/ai-search/route.ts
// NatoureFly Personalization Engine — Natural Language Tour Search
// Prompt → Claude extracts intent → Supabase query → ranked by archetype

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCachedProfile } from "@/lib/profile-cache";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SearchIntent {
  destination: string | null;
  max_budget_azn: number | null;
  group_type: "couple" | "family" | "solo" | "friends" | null;
  duration_days: number | null;
  travel_style: "beach" | "culture" | "adventure" | "luxury" | "budget" | null;
  month: number | null;
}

interface Tour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  end_date: string | null;
  max_seats: number;
  booked_seats: number;
  hotel: string | null;
  description: string | null;
  tags: string[] | null;
}

async function extractIntent(prompt: string): Promise<SearchIntent> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `Bu gün: ${today}. İstifadəçinin turizm sorğusundan niyyəti JSON formatında çıxar.
Yalnız JSON cavab ver, başqa heç nə yazma.
JSON sahələri: destination (string|null), max_budget_azn (number|null), group_type ("couple"|"family"|"solo"|"friends"|null), duration_days (number|null), travel_style ("beach"|"culture"|"adventure"|"luxury"|"budget"|null), month (1-12|null)
Azərbaycan/Türk/Rus dilindəki yerləri ingilis dilинə çevir: Dubai, Istanbul, Antalya, Bali, Paris, Tokyo, Rome, Barcelona, Maldives, Georgia (ölkə) kimi.`,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const jsonStr = raw.replace(/```json?|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    return { destination: null, max_budget_azn: null, group_type: null, duration_days: null, travel_style: null, month: null };
  }
}

function scoreTour(tour: Tour, intent: SearchIntent, archetype: string | null): number {
  let score = 0;

  // Budget match
  if (intent.max_budget_azn && tour.price_azn <= intent.max_budget_azn) score += 30;
  else if (intent.max_budget_azn && tour.price_azn <= intent.max_budget_azn * 1.2) score += 10;

  // Destination match
  if (intent.destination) {
    const dest = tour.destination.toLowerCase();
    const intDest = intent.destination.toLowerCase();
    if (dest.includes(intDest) || intDest.includes(dest)) score += 40;
  }

  // Availability — more seats = better
  const seatsLeft = tour.max_seats - tour.booked_seats;
  if (seatsLeft > 5) score += 5;
  else if (seatsLeft > 0) score += 2;

  // Archetype scoring
  if (archetype === "luxury_curator" && tour.price_azn > 2000) score += 15;
  if (archetype === "budget_optimizer" && tour.price_azn < 1000) score += 15;
  if (archetype === "efficiency_seeker" && tour.hotel && tour.hotel.includes("5")) score += 10;
  if (archetype === "deep_relaxer" && (tour.description?.toLowerCase().includes("beach") || tour.destination.toLowerCase().includes("antalya") || tour.destination.toLowerCase().includes("bali"))) score += 12;

  // Recency — sooner tours rank higher
  if (tour.start_date) {
    const daysUntil = Math.max(0, (new Date(tour.start_date).getTime() - Date.now()) / 86400000);
    if (daysUntil < 30) score += 8;
    else if (daysUntil < 60) score += 4;
  }

  return score;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, session_token } = await req.json() as { prompt: string; session_token?: string };

    if (!prompt?.trim()) {
      return NextResponse.json({ ok: false, error: "Prompt boşdur" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Extract intent from natural language
    const intent = await extractIntent(prompt);

    // 2. Get user archetype if session exists
    let archetype: string | null = null;
    if (session_token) {
      const { data: user } = await supabase
        .from("persona_users")
        .select("id")
        .eq("session_token", session_token)
        .single();

      if (user) {
        const cached = await getCachedProfile(user.id);
        if (cached) {
          archetype = cached.archetype ?? null;
        } else {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("archetype")
            .eq("user_id", user.id)
            .single();
          archetype = profile?.archetype ?? null;
        }
      }
    }

    // 3. Query Supabase tours
    let query = supabase
      .from("tours")
      .select("id, name, destination, price_azn, start_date, end_date, max_seats, booked_seats, hotel, description, tags")
      .eq("is_active", true)
      .gt("max_seats", 0);

    // Destination filter (fuzzy — DB-level ilike)
    if (intent.destination) {
      query = query.ilike("destination", `%${intent.destination}%`);
    }

    // Budget filter with 20% headroom
    if (intent.max_budget_azn) {
      query = query.lte("price_azn", intent.max_budget_azn * 1.2);
    }

    const { data: tours } = await query.limit(20);

    if (!tours || tours.length === 0) {
      // No destination-specific results — return general tours
      const { data: fallback } = await supabase
        .from("tours")
        .select("id, name, destination, price_azn, start_date, end_date, max_seats, booked_seats, hotel, description, tags")
        .eq("is_active", true)
        .limit(6);

      return NextResponse.json({
        ok: true,
        tours: (fallback || []).slice(0, 4),
        intent,
        archetype,
        fallback: true,
        ai_intro: "Axtarışınıza uyğun müvəqqəti nəticə tapılmadı. Ən populyar turlarımıza baxın:",
      });
    }

    // 4. Score and rank
    const scored = (tours as Tour[])
      .map(t => ({ ...t, _score: scoreTour(t, intent, archetype) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);

    // 5. Generate short AI intro (2 sentences max)
    let ai_intro = "";
    try {
      const introMsg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 120,
        system: "Turizm agentinin AI assistantısın. Qısa, məcburi Azərbaycan dilindəki 1-2 cümlə yaz. Emoji istifadə etmə.",
        messages: [{
          role: "user",
          content: `Müştəri "${prompt}" dedi. ${scored.length} tur tapıldı. Ən yaxşı nəticəni qısa izah et.`,
        }],
      });
      ai_intro = (introMsg.content[0] as { type: string; text: string }).text.trim();
    } catch {
      ai_intro = `${scored.length} tura uyğun nəticə tapıldı.`;
    }

    return NextResponse.json({
      ok: true,
      tours: scored,
      intent,
      archetype,
      fallback: false,
      ai_intro,
    });
  } catch (err) {
    console.error("AI Search xətası:", err);
    return NextResponse.json({ ok: false, error: "Server xətası" }, { status: 500 });
  }
}
