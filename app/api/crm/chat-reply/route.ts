import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { requireStaff, isAuthError } from "@/lib/require-auth";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  if (!redis) return NextResponse.json({ error: "Redis yoxdur" }, { status: 500 });

  const { sessionId, message, pauseAI } = await req.json();
  if (!sessionId || !message) return NextResponse.json({ error: "sessionId və message lazımdır" }, { status: 400 });

  // Widgete göndəriləcək admin mesajını növbəyə əlavə et
  await redis.rpush(`admin_pending:${sessionId}`, message);
  await redis.expire(`admin_pending:${sessionId}`, 3600);

  // Söhbət tarixçəsinə əlavə et
  const history = await redis.get<{ role: string; content: string }[]>(`chat:${sessionId}`) || [];
  history.push({ role: "assistant", content: `[Admin] ${message}` });
  await redis.set(`chat:${sessionId}`, history, { ex: 86400 * 365 });

  // AI-ı durdur (isteğe bağlı)
  if (pauseAI) {
    await redis.set(`admin_active:${sessionId}`, 1, { ex: 3600 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  if (!redis) return NextResponse.json({ error: "Redis yoxdur" }, { status: 500 });
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId lazımdır" }, { status: 400 });

  // AI-ı yenidən aktiv et
  await redis.del(`admin_active:${sessionId}`);
  return NextResponse.json({ ok: true });
}
