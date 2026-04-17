// app/api/quiz/route.ts
// NatoureFly Personalization Engine — Quiz API

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processQuizResults, buildDNAText, QUIZ_QUESTIONS, QuizAnswer } from "@/lib/quiz-processor";
import { embed } from "@/lib/embeddings";

// GET /api/quiz — Return quiz questions
export async function GET() {
  return NextResponse.json({ questions: QUIZ_QUESTIONS });
}

// POST /api/quiz — Submit answers, save profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_token, answers } = body as {
      session_token: string;
      answers: { question_id: string; answer_id: string; score_impact: Record<string, number> }[];
    };

    if (!session_token || !answers || answers.length === 0) {
      return NextResponse.json({ error: "session_token və answers tələb olunur" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. persona_users cədvəlindən user tap və ya yarat
    let userId: string;
    const { data: existingUser } = await supabase
      .from("persona_users")
      .select("id")
      .eq("session_token", session_token)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      // Son aktivlik vaxtını yenilə
      await supabase
        .from("persona_users")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", userId);
    } else {
      const { data: newUser, error: createError } = await supabase
        .from("persona_users")
        .insert({ session_token })
        .select("id")
        .single();

      if (createError || !newUser) {
        return NextResponse.json({ error: "İstifadəçi yaradıla bilmədi" }, { status: 500 });
      }
      userId = newUser.id;
    }

    // 2. Quiz cavablarını quiz_responses-a yaz
    const quizRows = answers.map((a) => ({
      user_id: userId,
      question_id: a.question_id,
      answer_id: a.answer_id,
      answer_data: { score_impact: a.score_impact },
    }));

    await supabase
      .from("quiz_responses")
      .upsert(quizRows, { onConflict: "user_id,question_id" });

    // 3. Profil skorlarını hesabla
    const quizAnswers: QuizAnswer[] = answers.map((a) => ({
      question_id: a.question_id,
      answer_id: a.answer_id,
      score_impact: a.score_impact,
    }));

    const profile = processQuizResults(quizAnswers);

    // 4. user_profiles-a yaz (upsert)
    await supabase.from("user_profiles").upsert({
      user_id: userId,
      ...profile,
      quiz_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 5. Travel DNA vektoru — background (xəta olsa cavabı bloklamasın)
    try {
      const dnaText = buildDNAText(profile);
      const dnaVector = await embed(dnaText);
      await supabase
        .from("user_profiles")
        .update({ travel_dna_vector: dnaVector })
        .eq("user_id", userId);
    } catch {
      // Embedding xətası quiz cavabını pozmasın
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      archetype: profile.archetype,
      archetype_confidence: profile.archetype_confidence,
    });
  } catch (err) {
    console.error("Quiz API xətası:", err);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
