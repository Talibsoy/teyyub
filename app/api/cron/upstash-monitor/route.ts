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
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return NextResponse.json({ error: "Redis env yoxdur" }, { status: 500 });
  }

  const redis = new Redis({ url, token });
  const keyCount = await redis.dbsize();

  // Upstash REST API ilə INFO memory al
  let usedMB = 0;
  let maxMB = 256;
  let pct = 0;

  try {
    const res = await fetch(`${url}/info/memory`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    const usedMatch = text.match(/used_memory:(\d+)/);
    const maxMatch = text.match(/maxmemory:(\d+)/);
    const usedBytes = usedMatch ? parseInt(usedMatch[1]) : 0;
    const maxBytes = maxMatch && parseInt(maxMatch[1]) > 0
      ? parseInt(maxMatch[1])
      : 268435456;
    usedMB = parseFloat((usedBytes / 1024 / 1024).toFixed(1));
    maxMB = Math.round(maxBytes / 1024 / 1024);
    pct = Math.round((usedBytes / maxBytes) * 100);
  } catch {
    // memory info alınmasa key sayına görə qiymətləndir
    pct = Math.round((keyCount / 5000) * 100);
  }

  if (pct >= 70) {
    await sendAlert(
      `⚠️ *Upstash Redis Xəbərdarlığı*\n\n` +
      `📦 İstifadə: *${usedMB} MB / ${maxMB} MB* (${pct}%)\n` +
      `🔑 Açar sayı: *${keyCount}*\n\n` +
      `Upstash limitinə yaxınlaşırsınız!`
    );
  }

  return NextResponse.json({ usedMB, maxMB, pct, keyCount, alerted: pct >= 70 });
}
