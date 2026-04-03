import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

export async function GET() {
  const timestamp = new Date().toISOString();
  const results: Record<string, string> = {};

  // Supabase yoxla
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.from("leads").select("id").limit(1);
    results.supabase = error ? `error: ${error.message}` : "connected";
  } catch (e) {
    results.supabase = `error: ${String(e)}`;
  }

  // Redis yoxla
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.ping();
      results.redis = "connected";
    } else {
      results.redis = "not configured";
    }
  } catch (e) {
    results.redis = `error: ${String(e)}`;
  }

  results.duffel_key = process.env.DUFFEL_API_KEY ? `ok (${process.env.DUFFEL_API_KEY.slice(0, 15)}...)` : "MISSING";

  const allOk = Object.values(results).every((v) => v === "connected" || v === "not configured" || v.startsWith("ok"));

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", ...results, timestamp },
    { status: allOk ? 200 : 503 }
  );
}
