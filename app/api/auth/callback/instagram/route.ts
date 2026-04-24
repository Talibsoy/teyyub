import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://natourefly.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${APP_URL}/?error=instagram_auth_failed`);
  }

  if (!code) {
    return new NextResponse("Kod tapılmadı", { status: 400 });
  }

  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const redirectUri = `${APP_URL}/api/auth/callback/instagram`;

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${APP_URL}/?error=instagram_config_missing`);
  }

  // Authorization code → short-lived access token
  const tokenRes = await fetch(
    `https://api.instagram.com/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    }
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/?error=instagram_token_failed`);
  }

  const { access_token, user_id } = await tokenRes.json() as {
    access_token: string;
    user_id: string;
  };

  // Short-lived → long-lived token (60 gün)
  const longLivedRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${access_token}`
  );

  const longLived = longLivedRes.ok
    ? await longLivedRes.json() as { access_token: string; expires_in: number }
    : null;

  const finalToken = longLived?.access_token || access_token;
  const expiresAt = longLived?.expires_in
    ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
    : null;

  // Token-i Supabase-ə saxla
  const admin = getSupabaseAdmin();
  await admin.from("instagram_tokens").upsert({
    ig_user_id: user_id,
    access_token: finalToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(`${APP_URL}/?status=instagram_connected`);
}
