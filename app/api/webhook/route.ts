import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";
import { addCustomerToSheet } from "@/lib/google-sheets";
import { sendTelegramAlert } from "@/lib/telegram";

const PAGE_TOKEN = process.env.FB_PAGE_TOKEN!;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN!;

const conversations = new Map<string, { role: "user" | "assistant"; content: string }[]>();

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

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const event of entry.messaging || []) {
          if (!event.message?.text) continue;
          await handleMessage("Facebook", event.sender.id, event.message.text);
        }
      }
    }

    if (body.object === "instagram") {
      for (const entry of body.entry) {
        for (const event of entry.messaging || []) {
          if (!event.message?.text) continue;
          await handleMessage("Instagram", event.sender.id, event.message.text);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook xətası:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function handleMessage(platform: string, senderId: string, userMessage: string) {
  const historyKey = `${platform}_${senderId}`;
  const history = conversations.get(historyKey) || [];

  const { message: aiMessage, customerData } = await getAIResponse(userMessage, history);

  history.push({ role: "user", content: userMessage });
  history.push({ role: "assistant", content: aiMessage });
  if (history.length > 20) history.splice(0, 2);
  conversations.set(historyKey, history);

  if (platform === "Facebook" || platform === "Instagram") {
    await sendFBMessage(senderId, aiMessage);
  }

  if (customerData.name || customerData.phone || customerData.email || customerData.destination) {
    await addCustomerToSheet(platform, senderId, customerData, userMessage);
    await sendTelegramAlert(platform, userMessage, customerData);
  }
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
