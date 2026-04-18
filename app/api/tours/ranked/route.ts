import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session_token = req.nextUrl.searchParams.get("session_token");
  if (!session_token) return NextResponse.json({ ranked: null });

  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("travel_dna_vector")
    .eq("session_token", session_token)
    .single();

  if (!profile?.travel_dna_vector) return NextResponse.json({ ranked: null });

  const { data: ranked, error } = await supabase.rpc("rank_tours_by_dna", {
    user_vector: profile.travel_dna_vector,
  });

  if (error) return NextResponse.json({ ranked: null });

  return NextResponse.json({ ranked: ranked ?? [] });
}
