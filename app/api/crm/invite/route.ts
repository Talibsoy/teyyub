import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/require-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const { email, full_name, role } = await req.json();
    if (!email || !full_name || !role) {
      return NextResponse.json({ error: "Məlumatlar tam deyil" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Supabase Auth invite göndər
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.natourefly.com"}/login`,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Staff cədvəlinə əlavə et
    await admin.from("staff").upsert([{
      id: data.user.id,
      full_name,
      role,
    }]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
