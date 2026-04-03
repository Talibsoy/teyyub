import { NextRequest, NextResponse } from "next/server";
import { postToTelegramChannel } from "@/lib/social-post";

export async function GET(_req: NextRequest) {
  const results: Record<string, string> = {};

  // Facebook birbaşa test
  try {
    const token = process.env.FB_PAGE_TOKEN || "";
    const r = await fetch(`https://graph.facebook.com/v20.0/393640733828497/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Natoure test post 🌍", access_token: token }),
    });
    const j = await r.json();
    results.facebook = JSON.stringify(j);
  } catch (e) { results.facebook = String(e); }

  // Telegram
  try {
    await postToTelegramChannel({ id: "test", name: "Test Tur", destination: "Bakı", price_azn: 100 });
    results.telegram = "ok";
  } catch (e) { results.telegram = String(e); }

  // Env
  results.env = JSON.stringify({
    FB_PAGE_TOKEN: !!process.env.FB_PAGE_TOKEN,
    META_IG_USER_ID: process.env.META_IG_USER_ID || "MISSING",
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "missing",
    TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID || "missing",
  });

  return NextResponse.json(results);
}
