import { NextRequest, NextResponse } from "next/server";
import { getAIResponse, MediaInput } from "@/lib/ai-agent";
import { addCustomerToSheet } from "@/lib/google-sheets";
import { sendTelegramAlert } from "@/lib/telegram";
import { analyzeMedia } from "@/lib/media-analyzer";
import { getHistory, saveHistory } from "@/lib/conversation-store";
import { saveLead } from "@/lib/crm";
import { checkRateLimit } from "@/lib/rate-limit";

const PAGE_TOKEN = process.env.FB_PAGE_TOKEN!;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN!;

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
          if (event.message?.is_echo) continue;
          if (event.sender?.id === process.env.FB_PAGE_ID) continue;

          // Rate limit yoxla
          const allowed = await checkRateLimit(`fb:${event.sender.id}`);
          if (!allowed) continue;

          // Get Started düyməsi və ya digər postback-lər
          if (event.postback) {
            await handleMessage("Facebook", event.sender.id, "Salam", undefined);
            continue;
          }

          if (!event.message) continue;

          const text = event.message.text;
          const { userMessage: mediaText, media } = await resolveFBAttachment(event.message.attachments?.[0]);

          if (!text && !mediaText && !media) {
            await sendFBMessage(event.sender.id, "Zəhmət olmasa mətn, şəkil, video və ya ses göndərin! 🙏");
            continue;
          }

          await handleMessage("Facebook", event.sender.id, text || mediaText || "", media);
        }
      }
    }

    if (body.object === "instagram") {
      for (const entry of body.entry) {
        for (const event of entry.messaging || []) {
          if (event.message?.is_echo) continue;
          if (!event.message) continue;

          // Rate limit yoxla
          const igAllowed = await checkRateLimit(`ig:${event.sender.id}`);
          if (!igAllowed) continue;

          const text = event.message.text;
          const { userMessage: mediaText, media } = await resolveFBAttachment(event.message.attachments?.[0]);

          if (!text && !mediaText && !media) {
            await sendFBMessage(event.sender.id, "Zəhmət olmasa mətn, şəkil, video və ya ses göndərin! 🙏");
            continue;
          }

          await handleMessage("Instagram", event.sender.id, text || mediaText || "", media);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook xətası:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function resolveFBAttachment(
  attachment: { type: string; payload?: { url?: string } } | undefined
): Promise<{ userMessage?: string; media?: MediaInput }> {
  if (!attachment?.payload?.url) return {};
  const url = attachment.payload.url;

  if (attachment.type === "image") {
    // Şəkili binary yüklə, Gemini ilə analiz et
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = res.headers.get("content-type") || "image/jpeg";
        return { media: { type: "base64", data: base64, mimeType, mediaType: "şəkil" } };
      }
    } catch {}
    // Fallback: URL ilə
    return { media: { type: "url", url, mediaType: "şəkil" } };
  }

  if (attachment.type === "audio") {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = res.headers.get("content-type") || "audio/mpeg";
        const transcript = await analyzeMedia(base64, mimeType, "ses");
        return { userMessage: transcript };
      }
    } catch {}
    return { userMessage: "[Müştəri səs mesajı göndərdi, transkript alınmadı]" };
  }

  if (attachment.type === "video") {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = res.headers.get("content-type") || "video/mp4";
        const description = await analyzeMedia(base64, mimeType, "video");
        return { userMessage: `[Müştəri video göndərdi. Gemini təsviri: ${description}]` };
      }
    } catch {}
    return { userMessage: "[Müştəri video göndərdi]" };
  }

  if (attachment.type === "file") {
    return { media: { type: "url", url, mediaType: "fayl" } };
  }

  return {};
}

async function handleMessage(platform: string, senderId: string, userMessage: string, media?: MediaInput) {
  const historyKey = `${platform}_${senderId}`;
  const history = await getHistory(historyKey);

  const { message: aiMessage, customerData } = await getAIResponse(userMessage, history, media);

  const mediaLabel = media?.mediaType || "media";
  history.push({ role: "user", content: userMessage || `[${mediaLabel}]` });
  history.push({ role: "assistant", content: aiMessage });
  await saveHistory(historyKey, history);

  await sendFBMessage(senderId, aiMessage);

  if (customerData.name || customerData.phone || customerData.email || customerData.destination) {
    await Promise.all([
      addCustomerToSheet(platform, senderId, customerData, userMessage),
      saveLead(platform, senderId, customerData, userMessage),
    ]);
  }
  await sendTelegramAlert(platform, userMessage || `[${mediaLabel} göndərdi]`, customerData);
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
