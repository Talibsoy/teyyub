import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendAlert(text: string) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
  });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const urlToken = new URL(req.url).searchParams.get("token");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}` && urlToken !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return NextResponse.json({ error: "Redis env yoxdur" }, { status: 500 });
  }

  const redis = new Redis({ url, token });

  // Key sayı
  const keyCount = await redis.dbsize();

  // Memory məlumatı (INFO memory)
  const info = await redis.info("memory") as string;
  const usedMemMatch = info.match(/used_memory:(\d+)/);
  const maxMemMatch = info.match(/maxmemory:(\d+)/);

  const usedBytes = usedMemMatch ? parseInt(usedMemMatch[1]) : 0;
  const maxBytes = maxMemMatch ? parseInt(maxMemMatch[1]) : 268435456; // 256MB default

  const usedMB = (usedBytes / 1024 / 1024).toFixed(1);
  const maxMB = (maxBytes / 1024 / 1024).toFixed(0);
  const pct = maxBytes > 0 ? Math.round((usedBytes / maxBytes) * 100) : 0;

  // 70%-dən artıq olsa xəbərdarlıq
  if (pct >= 70) {
    await sendAlert(
      `⚠️ *Upstash Redis Xəbərdarlığı*\n\n` +
      `📦 İstifadə: *${usedMB} MB / ${maxMB} MB* (${pct}%)\n` +
      `🔑 Açar sayı: *${keyCount}*\n\n` +
      `Upstash limitinə yaxınlaşırsınız! Köhnə söhbətlər silinə bilər.`
    );
  }

  return NextResponse.json({
    usedMB: parseFloat(usedMB),
    maxMB: parseInt(maxMB),
    pct,
    keyCount,
    alerted: pct >= 70,
  });
}
