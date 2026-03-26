import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
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
