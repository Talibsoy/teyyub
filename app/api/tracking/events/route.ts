// app/api/tracking/events/route.ts
// NatoureFly Personalization Engine — Behavioral Event Ingestion

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// EMA-based score update
const LEARNING_RATE = 0.08;

interface IncomingEvent {
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

// Hər event tipi üçün score_impact siqnalları
const EVENT_SIGNALS: Record<string, Record<string, number>> = {
  "view_detail:hotel:5star":        { pref_comfort_priority: +0.05, pref_budget_sensitivity: -0.03 },
  "view_detail:hotel:4star":        { pref_comfort_priority: +0.03 },
  "view_detail:hotel:budget":       { pref_budget_sensitivity: +0.05, pref_comfort_priority: -0.02 },
  "skip:flight:multistop":          { pref_hassle_free: +0.04 },
  "skip:hotel:chain":               { pref_cultural_depth: +0.03 },
  "view_duration:hotel:long":       { pref_comfort_priority: +0.03 },
  "view_duration:hotel:boutique":   { pref_cultural_depth: +0.04, pref_social_atmosphere: -0.02 },
  "bookmark:hotel":                 { pref_comfort_priority: +0.04 },
  "bookmark:flight":                { pref_hassle_free: +0.02 },
  "booking_complete:hotel:luxury":  { pref_comfort_priority: +0.08, pref_budget_sensitivity: -0.05 },
  "booking_complete:hotel:budget":  { pref_budget_sensitivity: +0.08 },
  "booking_complete:flight:direct": { pref_hassle_free: +0.06 },
};

function deriveSignalKey(event: IncomingEvent): string | null {
  const { event_type, entity_type, metadata } = event;

  if (event_type === "view_detail" && entity_type === "hotel") {
    const stars = metadata?.stars as number;
    if (stars >= 5) return "view_detail:hotel:5star";
    if (stars === 4) return "view_detail:hotel:4star";
    if (stars <= 3) return "view_detail:hotel:budget";
  }
  if (event_type === "skip" && entity_type === "flight") {
    const stops = metadata?.stop_count as number;
    if (stops >= 2) return "skip:flight:multistop";
  }
  if (event_type === "skip" && entity_type === "hotel") {
    if (metadata?.is_chain) return "skip:hotel:chain";
  }
  if (event_type === "view_duration" && entity_type === "hotel") {
    const duration = metadata?.duration_seconds as number;
    if (duration > 20) {
      if (metadata?.hotel_type === "boutique") return "view_duration:hotel:boutique";
      return "view_duration:hotel:long";
    }
  }
  if (event_type === "bookmark") return `bookmark:${entity_type}`;
  if (event_type === "booking_complete" && entity_type === "hotel") {
    const stars = metadata?.stars as number;
    if (stars >= 5) return "booking_complete:hotel:luxury";
    return "booking_complete:hotel:budget";
  }
  if (event_type === "booking_complete" && entity_type === "flight") {
    if ((metadata?.stop_count as number) === 0) return "booking_complete:flight:direct";
  }

  return null;
}

function applyEMA(current: number, delta: number): number {
  return Math.max(0, Math.min(1, current + LEARNING_RATE * delta));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_token, events } = body as {
      session_token: string;
      events: IncomingEvent[];
    };

    if (!session_token || !events?.length) {
      return NextResponse.json({ ok: false, error: "Məlumat çatışmır" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. User tap
    const { data: user } = await supabase
      .from("persona_users")
      .select("id")
      .eq("session_token", session_token)
      .single();

    if (!user) {
      return NextResponse.json({ ok: true, skipped: "user_not_found" });
    }

    const userId = user.id;
    const sessionId = session_token.slice(0, 16);

    // 2. Eventləri behavioral_events-ə yaz
    const rows = events.map((e) => ({
      user_id: userId,
      session_id: sessionId,
      event_type: e.event_type,
      entity_type: e.entity_type ?? null,
      entity_id: e.entity_id ?? null,
      metadata: e.metadata ?? {},
    }));

    await supabase.from("behavioral_events").insert(rows);

    // 3. Mənalı signalları profil skorlarına tətbiq et (EMA)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: true, note: "no_profile_yet" });
    }

    const updatedScores: Record<string, number> = { ...profile };
    let hasChanges = false;

    for (const event of events) {
      const key = deriveSignalKey(event);
      if (!key || !EVENT_SIGNALS[key]) continue;

      for (const [field, delta] of Object.entries(EVENT_SIGNALS[key])) {
        if (typeof updatedScores[field] === "number") {
          updatedScores[field] = applyEMA(updatedScores[field], delta);
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      const scoreFields: Record<string, number> = {};
      const prefKeys = [
        "pref_budget_sensitivity","pref_comfort_priority","pref_adventure_level",
        "pref_hassle_free","pref_social_atmosphere","pref_cultural_depth",
        "pref_nature_affinity","pref_nightlife","pref_family_friendly","pref_food_importance",
      ];
      for (const k of prefKeys) {
        if (typeof updatedScores[k] === "number") scoreFields[k] = updatedScores[k];
      }
      scoreFields.updated_at = new Date().toISOString() as unknown as number;

      await supabase
        .from("user_profiles")
        .update(scoreFields)
        .eq("user_id", userId);
    }

    return NextResponse.json({ ok: true, events_saved: rows.length, scores_updated: hasChanges });
  } catch (err) {
    console.error("Tracking events xətası:", err);
    return NextResponse.json({ ok: false, error: "Server xətası" }, { status: 500 });
  }
}
