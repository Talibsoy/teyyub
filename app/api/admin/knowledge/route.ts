import { NextRequest, NextResponse } from "next/server";
import { addKnowledge, deleteKnowledge } from "@/lib/knowledge";
import { getSupabaseAdmin } from "@/lib/supabase";

function checkSecret(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// Bütün biliklərə bax
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
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
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { content, source, metadata } = await req.json();
  if (!content || !source) {
    return NextResponse.json({ error: "content və source lazımdır" }, { status: 400 });
  }

  try {
    const id = await addKnowledge(content, source, metadata);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[Knowledge POST]", e);
    return NextResponse.json({ error: "Bilik əlavə edilə bilmədi" }, { status: 500 });
  }
}

// Bilik sil
export async function DELETE(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id lazımdır" }, { status: 400 });

  try {
    await deleteKnowledge(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Knowledge DELETE]", e);
    return NextResponse.json({ error: "Bilik silinə bilmədi" }, { status: 500 });
  }
}
