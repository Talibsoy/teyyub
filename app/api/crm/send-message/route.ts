import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/require-auth";

const WA_TOKEN = process.env.WA_ACCESS_TOKEN!;
const WA_PHONE_ID = process.env.WA_PHONE_NUMBER_ID!;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    const { platform, sender_id, message } = await req.json();
    if (!platform || !sender_id || !message) {
      return NextResponse.json({ error: "Məlumatlar tam deyil" }, { status: 400 });
    }

    if (platform === "whatsapp") {
      const res = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WA_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: sender_id,
          type: "text",
          text: { body: message },
        }),
      });
      const data = await res.json();
      if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Yalnız WhatsApp dəstəklənir" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
