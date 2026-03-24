import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";
import { addCustomerToSheet } from "@/lib/google-sheets";
import { sendTelegramAlert } from "@/lib/telegram";

const PAGE_TOKEN = process.env.FB_PAGE_TOKEN!;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN!;

// Söhbət tarixçəsi (yaddaşda saxlayır)
const conversations = new Map<string, { role: "user" | "assistant"; content: string }[]>();

// Webhook doğrulama (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Mesaj qəbul (POST)
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.object === "page") {
    for (const entry of body.entry) {
      for (const event of entry.messaging || []) {
        if (!event.message?.text) continue;

        const senderId = event.sender.id;
        const userMessage = event.message.text;

        // Söhbət tarixçəsini al
        const history = conversations.get(senderId) || [];

        // AI cavab al
        const { message: aiMessage, customerData } = await getAIResponse(
          userMessage,
          history
        );

        // Tarixçəni yenilə
        history.push({ role: "user", content: userMessage });
        history.push({ role: "assistant", content: aiMessage });
        if (history.length > 20) history.splice(0, 2); // Son 10 mesaj
        conversations.set(senderId, history);

        // Facebook-a cavab göndər
        await sendFBMessage(senderId, aiMessage);

        // Müştəri məlumatı varsa saxla
        if (customerData.name || customerData.phone || customerData.email || customerData.destination) {
          await addCustomerToSheet("Facebook", senderId, customerData, userMessage);
          await sendTelegramAlert("Facebook", userMessage, customerData);
        }
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}

async function sendFBMessage(recipientId: string, message: string) {
  await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
      }),
    }
  );
}
