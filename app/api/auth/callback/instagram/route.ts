import { NextRequest, NextResponse } from "next/server";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

const ENC_KEY = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY || "";

function encryptToken(token: string): string {
  if (!ENC_KEY) return token; // key yoxdursa plain (dev rejimi)
  const key = Buffer.from(ENC_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith("gcm:") || !ENC_KEY) return stored;
  const [, ivHex, tagHex, encHex] = stored.split(":");
  const key = Buffer.from(ENC_KEY, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(encHex, "hex")).toString("utf8") + decipher.final("utf8");
}

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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Instagram] SUPABASE_SERVICE_ROLE_KEY yoxdur — token saxlanıla bilmir");
    return NextResponse.redirect(`${APP_URL}/?error=instagram_config_missing`);
  }
  const admin = getSupabaseAdmin();
  await admin.from("instagram_tokens").upsert({
    ig_user_id: user_id,
    access_token: encryptToken(finalToken),
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(`${APP_URL}/?status=instagram_connected`);
}
