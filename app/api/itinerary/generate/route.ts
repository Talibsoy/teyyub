import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateItinerary } from "@/lib/itinerary-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      destination,
      start_date,
      duration_days,
      guests = 2,
      budget,
      preferences,
      session_token,
    } = body as {
      destination: string;
      start_date: string;
      duration_days: number;
      guests?: number;
      budget?: string;
      preferences?: string;
      session_token?: string;
    };

    if (!destination || !start_date || !duration_days) {
      return NextResponse.json(
        { error: "destination, start_date, duration_days tələb olunur" },
        { status: 400 }
      );
    }

    if (duration_days < 1 || duration_days > 21) {
      return NextResponse.json(
        { error: "duration_days 1–21 arasında olmalıdır" },
        { status: 400 }
      );
    }

    const itinerary = await generateItinerary({
      destination,
      start_date,
      duration_days,
      guests,
      budget,
      preferences,
    });

    const supabase = getSupabaseAdmin();

    // Optional: link to persona user
    let userId: string | null = null;
    if (session_token) {
      const { data: user } = await supabase
        .from("persona_users")
        .select("id")
        .eq("session_token", session_token)
        .single();
      if (user) userId = user.id;
    }

    const { data: saved, error } = await supabase
      .from("itineraries")
      .insert({
        user_id: userId,
        destination: itinerary.destination,
        title: itinerary.title,
        summary: itinerary.summary,
        duration_days: itinerary.duration_days,
        start_date: itinerary.start_date,
        end_date: itinerary.end_date,
        guests: itinerary.guests,
        budget_estimate: itinerary.budget_estimate,
        days: itinerary.days,
        travel_tips: itinerary.travel_tips,
        best_season: itinerary.best_season,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Itinerary save error:", error);
      return NextResponse.json({ error: "Saxlama xətası" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: saved.id,
      itinerary,
    });
  } catch (err) {
    console.error("Itinerary generate error:", err);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
