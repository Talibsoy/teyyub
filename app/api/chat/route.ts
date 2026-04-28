import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";
import { getHistory, saveHistory } from "@/lib/conversation-store";
import { getCRMProfileByUserId } from "@/lib/crm-profile";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

async function notifyTelegram(sessionId: string, userMsg: string, aiReply: string, urgent = false) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  const text = urgent
    ? `🚨 *OPERATOR TƏLƏBİ — Sayt Chat*\n` +
      `🆔 \`${sessionId.slice(0, 8)}\`\n` +
      `👤 *Müştəri:* ${userMsg}\n\n` +
      `Müştəri canlı operatorla danışmaq istəyir!`
    : `💬 *Sayt Chat*\n` +
      `🆔 \`${sessionId.slice(0, 8)}\`\n` +
      `👤 *Müştəri:* ${userMsg}\n` +
      `🤖 *Nigar:* ${aiReply}`;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
    });
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, userId } = await req.json();
    if (!sessionId || !message) {
      return NextResponse.json({ error: "sessionId və message lazımdır" }, { status: 400 });
    }

    const historyKey = `chat:${sessionId}`;
    const history = await getHistory(historyKey);

    // Admin aktiv olanda AI cavab vermir
    if (redis) {
      const adminActive = await redis.exists(`admin_active:${sessionId}`);
      if (adminActive) {
        const updated = [...history, { role: "user" as const, content: message }];
        await saveHistory(historyKey, updated);
        notifyTelegram(sessionId, message, "[Admin cavab gözlənilir]").catch(() => {});
        return NextResponse.json({ reply: null, adminActive: true });
      }
    }

    // CRM profili — qeydiyyatlı istifadəçi varsa çək
    const crmProfile = userId ? await getCRMProfileByUserId(userId) : null;

    const result = await getAIResponse(message, history, undefined, crmProfile);
    const raw = result.message
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
      .replace(/[\u{2600}-\u{27BF}]/gu, "")
      .replace(/[━✈️✓✔★☆♦♣♠♥❤🔥💫⚡🎯📊📈📉🏆🎁🎉🎊]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Operator keçidi aşkar et — cavabın istənilən yerində ola bilər
    const handoffMatch = raw.match(/(?:^|\n)OPERATOR_HANDOFF:([^\n]+)/);
    const isHandoff = !!handoffMatch;

    // Brace-depth extraction — multiline JSON-u da düzgün tutur
    function extractJsonBlock(text: string, key: string): Record<string, unknown> | null {
      const idx = text.indexOf(`${key}:{`);
      if (idx === -1) return null;
      let depth = 0;
      const start = idx + key.length + 1;
      for (let i = start; i < text.length; i++) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") {
          depth--;
          if (depth === 0) {
            try { return JSON.parse(text.slice(start, i + 1)) as Record<string, unknown>; } catch { return null; }
          }
        }
      }
      return null;
    }

    function removeJsonBlock(text: string, key: string): string {
      const idx = text.indexOf(`${key}:{`);
      if (idx === -1) return text;
      let depth = 0;
      const start = idx + key.length + 1;
      for (let i = start; i < text.length; i++) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") {
          depth--;
          if (depth === 0) return text.slice(0, idx) + text.slice(i + 1);
        }
      }
      return text;
    }

    const tourPackage   = extractJsonBlock(raw, "TOUR_PACKAGE");
    const hotelPackage  = extractJsonBlock(raw, "HOTEL_PACKAGE");
    const flightPackage = extractJsonBlock(raw, "FLIGHT_PACKAGE");

    let cleaned = removeJsonBlock(raw, "TOUR_PACKAGE");
    cleaned = removeJsonBlock(cleaned, "HOTEL_PACKAGE");
    cleaned = removeJsonBlock(cleaned, "FLIGHT_PACKAGE");

    const reply = isHandoff
      ? (handoffMatch![1] || raw.replace(/(?:^|\n)OPERATOR_HANDOFF:[^\n]*/g, "")).trim()
      : cleaned.trim();

    const updated = [
      ...history,
      { role: "user" as const,      content: message },
      { role: "assistant" as const, content: reply   },
    ];
    await saveHistory(historyKey, updated);

    // Aktiv sessiyalar siyahısına əlavə et (CRM canlı chat üçün)
    if (redis) {
      await redis.zadd("active_chat_sessions", { score: Date.now(), member: sessionId });
      await redis.expire("active_chat_sessions", 86400 * 7); // 7 gün
      // Son mesajı da saxla
      await redis.hset(`chat_meta:${sessionId}`, {
        lastMessage: message.slice(0, 100),
        lastRole: "user",
        updatedAt: Date.now(),
      });
      await redis.expire(`chat_meta:${sessionId}`, 86400 * 7);
    }

    // Telegram bildirişi
    notifyTelegram(sessionId, message, reply, isHandoff).catch(() => {});

    return NextResponse.json({ reply, handoff: isHandoff, tourPackage, hotelPackage, flightPackage });
  } catch (err) {
    console.error("[CHAT API]", err);
    return NextResponse.json({ reply: "Bağlantı xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin." });
  }
}
