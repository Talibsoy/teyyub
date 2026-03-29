import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "anon";
    if (!(await checkRateLimit(`contact:${ip}`, 10, 3600))) {
      return NextResponse.json({ error: "Çox tez-tez göndərirsiniz" }, { status: 429 });
    }

    const { ad, telefon, email, tur, mesaj } = await req.json();

    if (!ad || !mesaj) {
      return NextResponse.json({ error: "Ad və mesaj tələb olunur" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Supabase-ə lead kimi saxla
    await admin.from("leads").insert([{
      platform: "website",
      sender_id: `web_${Date.now()}`,
      name: ad,
      phone: telefon || null,
      email: email || null,
      destination: tur || null,
      message: mesaj.substring(0, 500),
      status: "new",
    }]);

    // Telegram bildirişi
    await sendTelegramAlert("Website", mesaj, {
      name: ad,
      phone: telefon || null,
      email: email || null,
      destination: tur || null,
      travel_date: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form xətası:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
