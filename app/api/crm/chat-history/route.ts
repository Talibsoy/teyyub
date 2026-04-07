import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export async function GET(req: NextRequest) {
  if (!redis) return NextResponse.json([]);
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json([]);

  const history = await redis.get<{ role: string; content: string }[]>(`chat:${sessionId}`);
  return NextResponse.json(history || []);
}
