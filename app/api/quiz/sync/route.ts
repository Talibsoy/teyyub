import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/require-auth";

const ARCHETYPE_TO_TRAVEL_STYLE: Record<string, string> = {
  luxury_curator:   "luxury",
  budget_optimizer: "budget",
  silent_explorer:  "cultural",
  deep_relaxer:     "relaxation",
  efficiency_seeker: "adventure",
  undetermined:     "balanced",
};

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { session_token } = await req.json() as { session_token?: string };
  if (!session_token) {
    return NextResponse.json({ error: "session_token tələb olunur" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // 1. persona_users → user_profiles zənciri ilə quiz data tap
  const { data: personaUser } = await db
    .from("persona_users")
    .select("id")
    .eq("session_token", session_token)
    .single();

  if (!personaUser) {
    return NextResponse.json({ error: "Quiz tapılmadı" }, { status: 404 });
  }

  const { data: quizProfile } = await db
    .from("user_profiles")
    .select("*")
    .eq("user_id", personaUser.id)
    .single();

  if (!quizProfile) {
    return NextResponse.json({ error: "Quiz profili tapılmadı" }, { status: 404 });
  }

  // 2. persona_users-a auth_user_id yaz (gələcək link üçün)
  await db
    .from("persona_users")
    .update({ auth_user_id: auth.userId })
    .eq("id", personaUser.id);

  // 3. customer_profiles-a quiz nəticələrini yaz
  const travelStyle = ARCHETYPE_TO_TRAVEL_STYLE[quizProfile.archetype] ?? "balanced";

  const { error } = await db
    .from("customer_profiles")
    .upsert({
      id:                       auth.userId,
      quiz_archetype:           quizProfile.archetype,
      quiz_confidence:          quizProfile.archetype_confidence,
      pref_adventure_level:     quizProfile.pref_adventure_level,
      pref_cultural_depth:      quizProfile.pref_cultural_depth,
      pref_comfort_priority:    quizProfile.pref_comfort_priority,
      pref_social_atmosphere:   quizProfile.pref_social_atmosphere,
      pref_budget_sensitivity:  quizProfile.pref_budget_sensitivity,
      pref_companion_type:      quizProfile.pref_companion_type,
      quiz_completed_at:        quizProfile.quiz_completed_at,
      travel_style:             travelStyle,
      updated_at:               new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    archetype: quizProfile.archetype,
    travel_style: travelStyle,
  });
}
