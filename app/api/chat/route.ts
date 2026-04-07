import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";
import { getHistory, saveHistory } from "@/lib/conversation-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

async function notifyTelegram(sessionId: string, userMsg: string, aiReply: string) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  const text =
    `💬 *Sayt Chat*\n` +
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

    const result = await getAIResponse(message, history);
    const reply = result.message
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
      .replace(/[\u{2600}-\u{27BF}]/gu, "")
      .replace(/[━✈️✓✔★☆♦♣♠♥❤🔥💫⚡🎯📊📈📉🏆🎁🎉🎊]/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const updated = [
      ...history,
      { role: "user" as const,      content: message },
      { role: "assistant" as const, content: reply   },
    ];
    await saveHistory(historyKey, updated);

    // Telegram bildirişi (gözləmirik)
    notifyTelegram(sessionId, message, reply).catch(() => {});

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[CHAT API]", err);
    return NextResponse.json({ reply: "Bağlantı xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin." });
  }
}
