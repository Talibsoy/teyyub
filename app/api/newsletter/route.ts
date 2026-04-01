import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Düzgün email daxil edin" }, { status: 400 });
  }

  const { error } = await supabase
    .from("subscribers")
    .insert([{ email }]);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Bu email artıq qeydiyyatdadır" }, { status: 409 });
    }
    return NextResponse.json({ error: "Xəta baş verdi" }, { status: 500 });
  }

  await sendEmail({
    to: email,
    subject: "Natoure xəbərlərə abunə oldunuz ✈️",
    html: `
<!DOCTYPE html>
<html lang="az">
<body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;overflow:hidden;border:1px solid #1a1a1a;max-width:560px;width:100%">
        <tr>
          <td style="background:#D4AF37;padding:28px;text-align:center">
            <h1 style="color:#000;margin:0;font-size:22px;font-weight:900">✈️ Natoure.az</h1>
            <p style="color:#000;margin:6px 0 0;font-size:13px;opacity:0.7">Premium Səyahət Paketləri</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h2 style="color:#fff;font-size:18px;margin:0 0 12px">Abunəliyiniz təsdiqləndi!</h2>
            <p style="color:#aaa;font-size:14px;line-height:1.7;margin:0 0 20px">
              Salam! Natoure xəbər bülletenimizə uğurla abunə oldunuz.<br>
              Ən yaxşı tur təklifləri, endirimler və səyahət məsləhətlərini birinci siz alacaqsınız.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:10px;padding:16px;margin-bottom:24px">
              <tr><td style="color:#D4AF37;font-size:13px">✓ Həftəlik tur təklifləri</td></tr>
              <tr><td style="color:#D4AF37;font-size:13px;padding-top:6px">✓ Erkən rezervasiya endirimleri</td></tr>
              <tr><td style="color:#D4AF37;font-size:13px;padding-top:6px">✓ Səyahət məsləhətləri</td></tr>
            </table>
            <a href="https://www.natourefly.com/turlar"
              style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none">
              Turlara Bax →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px;text-align:center;border-top:1px solid #1a1a1a">
            <p style="color:#444;font-size:11px;margin:0">© 2026 Natoure.az · Bakı, Azərbaycan</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  return NextResponse.json({ ok: true });
}
