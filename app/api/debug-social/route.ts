import { NextRequest, NextResponse } from "next/server";
import { postToFacebook, postToInstagram, postToTelegramChannel } from "@/lib/social-post";

export async function GET(req: NextRequest) {
  const testTour = {
    id: "test-123",
    name: "Test Turu",
    destination: "Test Şəhər",
    price_azn: 999,
    start_date: new Date().toISOString(),
    description: "Bu test postudur",
    image_url: null,
  };

  const results: Record<string, string> = {};

  try { await postToFacebook(testTour); results.facebook = "ok"; }
  catch (e) { results.facebook = String(e); }

  try { await postToInstagram(testTour); results.instagram = "skipped (no image)"; }
  catch (e) { results.instagram = String(e); }

  try { await postToTelegramChannel(testTour); results.telegram = "ok"; }
  catch (e) { results.telegram = String(e); }

  // Env var check
  results.env = JSON.stringify({
    FB_PAGE_TOKEN: !!process.env.FB_PAGE_TOKEN,
    META_PAGE_ID: process.env.META_PAGE_ID || "hardcoded:393640733828497",
    META_IG_USER_ID: process.env.META_IG_USER_ID || "missing",
    TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID || process.env.TELEGRAM_CHAT_ID || "missing",
  });

  return NextResponse.json(results);
}
