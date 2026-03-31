import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";
import { getHistory, saveHistory } from "@/lib/conversation-store";
import { saveLead } from "@/lib/crm";

// ManyChat External Request → AI cavab qaytarır
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ManyChat payload strukturu
    const userId: string = body.subscriber_id || body.user_id || "mc_unknown";
    const text: string = body.text || body.message || "";
    const firstName: string = body.first_name || "";
    const lastName: string = body.last_name || "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || "Müştəri";

    if (!text.trim()) {
      return NextResponse.json({ messages: [{ type: "text", text: "Salam! Sizə necə kömək edə bilərəm?" }] });
    }

    const historyKey = `mc:${userId}`;
    const history = await getHistory(historyKey);

    // Lead saxla
    await saveLead("instagram", userId, { name, phone: null, email: null, destination: null, travel_date: null }, text).catch(() => {});

    const aiText = await getAIResponse(text, history, { name });

    history.push({ role: "user", content: text });
    history.push({ role: "assistant", content: aiText });
    await saveHistory(historyKey, history);

    // ManyChat "Dynamic Messages" formatı
    return NextResponse.json({
      messages: [
        {
          type: "text",
          text: aiText,
        },
      ],
    });
  } catch (err) {
    console.error("[ManyChat] Xəta:", err);
    return NextResponse.json({
      messages: [{ type: "text", text: "Bir xəta baş verdi, zəhmət olmasa yenidən yazın." }],
    });
  }
}
