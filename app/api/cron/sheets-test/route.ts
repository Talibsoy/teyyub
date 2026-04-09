import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.HOTELS_CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = process.env.GOOGLE_PRIVATE_KEY ?? "";

  // Emal
  const processed = raw.replace(/\\n/g, "\n").trim();

  const info = {
    raw_length: raw.length,
    processed_length: processed.length,
    starts_with_quote: raw.startsWith('"'),
    ends_with_quote: raw.endsWith('"'),
    has_literal_backslash_n: raw.includes("\\n"),
    has_actual_newline: raw.includes("\n"),
    processed_has_actual_newline: processed.includes("\n"),
    first60: processed.slice(0, 60),
    last60: processed.slice(-60),
  };

  // crypto.createSign cəhdi
  let sign_ok = false;
  let sign_error = "";
  try {
    const s = crypto.createSign("RSA-SHA256");
    s.update("test");
    s.sign(processed, "base64url");
    sign_ok = true;
  } catch (e) {
    sign_error = (e as Error).message;
  }

  // crypto.subtle cəhdi
  let subtle_ok = false;
  let subtle_error = "";
  try {
    const pemContent = processed
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\s+/g, "");
    const keyBuffer = Buffer.from(pemContent, "base64");
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await globalThis.crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      Buffer.from("test")
    );
    subtle_ok = sig.byteLength > 0;
  } catch (e) {
    subtle_error = (e as Error).message;
  }

  return NextResponse.json({ info, sign_ok, sign_error, subtle_ok, subtle_error });
}
