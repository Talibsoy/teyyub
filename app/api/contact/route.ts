import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendTelegramAlert } from "@/lib/telegram";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Email bildirişi — admininə
    await resend.emails.send({
      from: "Natoure Sayt <onboarding@resend.dev>",
      to: ["info@natourefly.com"],
      subject: `Yeni müraciət: ${ad}${tur ? ` — ${tur}` : ""}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px;">
          <h2 style="color:#D4AF37;margin-bottom:4px;">Natoure — Yeni Müraciət</h2>
          <p style="color:#888;font-size:13px;margin-top:0;">flynatoure.com əlaqə formu</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td style="padding:8px 0;color:#555;font-size:13px;width:110px;">Ad:</td>
                <td style="padding:8px 0;color:#111;font-size:14px;font-weight:600;">${ad}</td></tr>
            ${telefon ? `<tr><td style="padding:8px 0;color:#555;font-size:13px;">Telefon:</td>
                <td style="padding:8px 0;color:#111;font-size:14px;">${telefon}</td></tr>` : ""}
            ${email ? `<tr><td style="padding:8px 0;color:#555;font-size:13px;">Email:</td>
                <td style="padding:8px 0;color:#111;font-size:14px;">${email}</td></tr>` : ""}
            ${tur ? `<tr><td style="padding:8px 0;color:#555;font-size:13px;">Tur:</td>
                <td style="padding:8px 0;color:#111;font-size:14px;">${tur}</td></tr>` : ""}
          </table>
          <div style="background:#fff;border:1px solid #eee;border-radius:8px;padding:16px;margin-top:16px;">
            <p style="color:#555;font-size:12px;margin:0 0 6px;">Mesaj:</p>
            <p style="color:#111;font-size:14px;line-height:1.7;margin:0;">${mesaj.replace(/\n/g, "<br/>")}</p>
          </div>
          <p style="color:#aaa;font-size:11px;margin-top:20px;">Bu müraciət CRM-də Leadlər bölməsində saxlanılıb.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form xətası:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
