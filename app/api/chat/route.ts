import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";
import { getHistory, saveHistory } from "@/lib/conversation-store";
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
    const { sessionId, message } = await req.json();
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

    const result = await getAIResponse(message, history);
    const raw = result.message
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
      .replace(/[\u{2600}-\u{27BF}]/gu, "")
      .replace(/[━✈️✓✔★☆♦♣♠♥❤🔥💫⚡🎯📊📈📉🏆🎁🎉🎊]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Operator keçidi aşkar et
    const isHandoff = raw.startsWith("OPERATOR_HANDOFF:");
    const reply = isHandoff
      ? raw.replace("OPERATOR_HANDOFF:", "").trim()
      : raw;

    const updated = [
      ...history,
      { role: "user" as const,      content: message },
      { role: "assistant" as const, content: reply   },
    ];
    await saveHistory(historyKey, updated);

    // Telegram bildirişi
    notifyTelegram(sessionId, message, reply, isHandoff).catch(() => {});

    return NextResponse.json({ reply, handoff: isHandoff });
  } catch (err) {
    console.error("[CHAT API]", err);
    return NextResponse.json({ reply: "Bağlantı xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin." });
  }
}
