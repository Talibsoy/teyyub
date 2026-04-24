import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { embedBatch } from "@/lib/embeddings";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.TOURS_EMBED_SECRET;
  const authorized = authHeader === `Bearer ${expected}` || querySecret === expected;
  if (!expected || !authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: tours, error } = await supabase
    .from("tours")
    .select("id, name, destination, description, hotel")
    .is("dna_vector", null)
    .eq("is_active", true)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tours || tours.length === 0) return NextResponse.json({ ok: true, embedded: 0 });

  const texts = tours.map((t) =>
    [t.name, t.destination, t.hotel, t.description].filter(Boolean).join(". ")
  );

  const vectors = await embedBatch(texts);

  let embedded = 0;
  for (let i = 0; i < tours.length; i++) {
    const { error: upErr } = await supabase
      .from("tours")
      .update({ dna_vector: JSON.stringify(vectors[i]) })
      .eq("id", tours[i].id);
    if (!upErr) embedded++;
  }

  return NextResponse.json({ ok: true, embedded, total: tours.length });
}
