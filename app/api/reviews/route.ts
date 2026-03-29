import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET — approved reviews (public)
export async function GET() {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("reviews")
    .select("id, name, destination, rating, message, created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

// POST — submit a new review (no auth needed)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, destination, rating, message } = body;

  if (!name || !rating || !message) {
    return NextResponse.json({ error: "Ad, reytinq və mesaj mütləqdir" }, { status: 400 });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Reytinq 1-5 arasında olmalıdır" }, { status: 400 });
  }

  if (message.length < 10 || message.length > 1000) {
    return NextResponse.json({ error: "Rəy 10-1000 simvol arasında olmalıdır" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { error } = await db.from("reviews").insert({
    name: name.trim().slice(0, 100),
    destination: destination?.trim().slice(0, 100) || null,
    rating,
    message: message.trim(),
    is_approved: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
