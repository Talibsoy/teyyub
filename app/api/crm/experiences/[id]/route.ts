import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireStaff, isAuthError } from "@/lib/require-auth";
import { pickWritable } from "@/lib/experience-packages";

// Faza 3 — Update / delete a single experience package (staff only).

const TABLE = "experience_packages";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch = pickWritable(body);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That slug is already taken" }, { status: 409 });
    }
    console.error("[CRM/Experiences] update failed:", error.message);
    return NextResponse.json({ error: "Could not update experience" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  return NextResponse.json({ experience: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  const { id } = await params;

  const { error } = await getSupabaseAdmin().from(TABLE).delete().eq("id", id);

  if (error) {
    console.error("[CRM/Experiences] delete failed:", error.message);
    return NextResponse.json({ error: "Could not delete experience" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
