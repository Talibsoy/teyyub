import { NextRequest, NextResponse } from "next/server";
import { addKnowledge, deleteKnowledge } from "@/lib/knowledge";
import { getSupabaseAdmin } from "@/lib/supabase";

// Bütün biliklərə bax
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("knowledge_base")
    .select("id, content, source, metadata, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ items: data || [] });
}

// Yeni bilik əlavə et
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content, source, metadata } = await req.json();
  if (!content || !source) {
    return NextResponse.json({ error: "content və source lazımdır" }, { status: 400 });
  }

  const id = await addKnowledge(content, source, metadata);
  return NextResponse.json({ ok: true, id });
}

// Bilik sil
export async function DELETE(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id lazımdır" }, { status: 400 });

  await deleteKnowledge(id);
  return NextResponse.json({ ok: true });
}
