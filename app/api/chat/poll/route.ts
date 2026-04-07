import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId || !redis) return NextResponse.json({ message: null });

  // Admin tərəfindən gözləyən mesaj varmı?
  const msg = await redis.lpop<string>(`admin_pending:${sessionId}`);
  if (!msg) return NextResponse.json({ message: null });

  return NextResponse.json({ message: msg, from: "admin" });
}
