import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase";

export async function requireAuth(req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId: data.user.id };
}

export async function requireStaff(
  req: NextRequest
): Promise<{ userId: string; role: string } | NextResponse> {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const admin = getSupabaseAdmin();
  const { data: staffRow, error } = await admin
    .from("staff")
    .select("role")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error || !staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: auth.userId, role: staffRow.role };
}

export function isAuthError(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}
