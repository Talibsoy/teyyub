import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId, email, fullName } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "userId və email tələb olunur" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email formatı düzgün deyil" }, { status: 400 });
    }

    // Artıq mövcuddursa yenidən yaratma
    const { data: existing } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, customerId: existing.id });
    }

    // Email ilə də yoxla (əvvəl manual əlavə edilmiş ola bilər)
    const { data: byEmail } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (byEmail) {
      // Mövcud müştərini auth istifadəçi ilə əlaqələndir
      await supabaseAdmin
        .from("customers")
        .update({ auth_user_id: userId, source: "website" })
        .eq("id", byEmail.id);
      return NextResponse.json({ ok: true, customerId: byEmail.id });
    }

    // Ad/soyad ayır
    const parts     = (fullName || "").trim().split(/\s+/);
    const firstName = parts[0] || email.split("@")[0];
    const lastName  = parts.slice(1).join(" ") || null;

    // Yeni müştəri yarat
    const { data: customer, error } = await supabaseAdmin
      .from("customers")
      .insert({
        first_name:   firstName,
        last_name:    lastName,
        email,
        auth_user_id: userId,
        source:       "website",
        tags:         ["potential"],
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Register] Customer xətası:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, customerId: customer.id });
  } catch (err) {
    console.error("[Register] Xəta:", err);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
