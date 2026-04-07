import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";
import { getHistory, saveHistory } from "@/lib/conversation-store";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json();
    if (!sessionId || !message) {
      return NextResponse.json({ error: "sessionId və message lazımdır" }, { status: 400 });
    }

    const historyKey = `chat:${sessionId}`;
    const history = await getHistory(historyKey);

    const result = await getAIResponse(message, history);

    const updated = [
      ...history,
      { role: "user" as const, content: message },
      { role: "assistant" as const, content: result.message },
    ];
    await saveHistory(historyKey, updated);

    return NextResponse.json({ reply: result.message });
  } catch (err) {
    console.error("[CHAT API]", err);
    return NextResponse.json({ reply: "Bağlantı xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin." });
  }
}
