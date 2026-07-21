import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireStaff, isAuthError } from "@/lib/require-auth";
import { pickWritable } from "@/lib/experience-packages";

// Faza 3 — Experience package admin API (staff only).
// experience_packages has RLS allowing public SELECT of active rows only;
// all writes must go through here with the service-role key.

const TABLE = "experience_packages";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─── GET: list every package (including unpublished) ─────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[CRM/Experiences] list failed:", error.message);
    return NextResponse.json({ error: "Could not load experiences" }, { status: 500 });
  }

  return NextResponse.json({ experiences: data ?? [] });
}

// ─── POST: create ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const destination = typeof body.destination === "string" ? body.destination.trim() : "";

  if (!slug || !title || !destination) {
    return NextResponse.json(
      { error: "slug, title and destination are required" },
      { status: 400 },
    );
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "slug must be lowercase words separated by hyphens (e.g. alaska-wildlife)" },
      { status: 400 },
    );
  }

  const payload = { ...pickWritable(body), slug, title, destination };

  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .insert([payload])
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation (duplicate slug)
    if (error.code === "23505") {
      return NextResponse.json({ error: "That slug is already taken" }, { status: 409 });
    }
    console.error("[CRM/Experiences] create failed:", error.message);
    return NextResponse.json({ error: "Could not create experience" }, { status: 500 });
  }

  return NextResponse.json({ experience: data }, { status: 201 });
}
