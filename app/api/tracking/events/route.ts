// app/api/tracking/events/route.ts
// NatoureFly Personalization Engine — Behavioral Event Ingestion + Archetype Re-evaluation

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processQuizResults, type QuizAnswer, type UserProfileScores } from "@/lib/quiz-processor";
import {
  getCachedProfile, setCachedProfile,
  invalidateProfile, incrementEventCount, resetEventCount,
} from "@/lib/profile-cache";

const REEVAL_THRESHOLD = 20; // Hər 20 eventdən sonra arxetip yenidən hesablanır

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

    const prefKeys = [
      "pref_budget_sensitivity","pref_comfort_priority","pref_adventure_level",
      "pref_hassle_free","pref_social_atmosphere","pref_cultural_depth",
      "pref_nature_affinity","pref_nightlife","pref_family_friendly","pref_food_importance",
    ];

    if (hasChanges) {
      const scoreFields: Record<string, number | string> = {};
      for (const k of prefKeys) {
        if (typeof updatedScores[k] === "number") scoreFields[k] = updatedScores[k];
      }
      scoreFields.updated_at = new Date().toISOString();

      await supabase
        .from("user_profiles")
        .update(scoreFields)
        .eq("user_id", userId);

      // Redis cache-i etibarsız et — növbəti oxumada DB-dən yenilənəcək
      await invalidateProfile(userId);
    }

    // ── Arxetip re-evaluation (hər REEVAL_THRESHOLD eventdən sonra) ──────────
    let newArchetype: string | null = null;
    const totalEventCount = await incrementEventCount(userId);

    if (totalEventCount >= REEVAL_THRESHOLD) {
      await resetEventCount(userId);

      // Quiz cavablarını oxu → yenilənmiş skorlarla arxetip yenidən hesabla
      const { data: quizRows } = await supabase
        .from("quiz_responses")
        .select("question_id, answer_id, answer_data")
        .eq("user_id", userId);

      if (quizRows && quizRows.length > 0) {
        const quizAnswers: QuizAnswer[] = quizRows.map((r) => ({
          question_id: r.question_id,
          answer_id: r.answer_id,
          score_impact: (r.answer_data as { score_impact: Record<string, number> })?.score_impact ?? {},
        }));

        // Quiz cavabları + yenilənmiş davranış skorları birlikdə
        const mergedProfile = processQuizResults(quizAnswers);

        // Yenilənmiş skorları üstünlük ver (behavioral learning daha güclü)
        for (const k of prefKeys) {
          if (typeof updatedScores[k] === "number") {
            mergedProfile[k as keyof typeof mergedProfile] = updatedScores[k] as never;
          }
        }

        // Profil confidence artır
        const newConfidence = Math.min(0.95, (profile.archetype_confidence ?? 0.65) + 0.05);

        await supabase
          .from("user_profiles")
          .update({
            archetype: mergedProfile.archetype,
            archetype_confidence: newConfidence,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        newArchetype = mergedProfile.archetype;
        await invalidateProfile(userId);
      }
    } else {
      // Cache-ə yaz (sonrakı oxumalar DB-yə getməsin)
      const cachedProfile = {
        archetype: profile.archetype,
        archetype_confidence: profile.archetype_confidence,
        ...Object.fromEntries(prefKeys.map(k => [k, updatedScores[k] ?? profile[k]])),
      } as UserProfileScores;
      await setCachedProfile(userId, cachedProfile);
    }

    return NextResponse.json({
      ok: true,
      events_saved: rows.length,
      scores_updated: hasChanges,
      archetype_updated: newArchetype,
    });
  } catch (err) {
    console.error("Tracking events xətası:", err);
    return NextResponse.json({ ok: false, error: "Server xətası" }, { status: 500 });
  }
}
