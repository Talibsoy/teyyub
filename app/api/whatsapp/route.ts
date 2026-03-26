import { NextRequest, NextResponse } from "next/server";
import { getAIResponse, MediaInput } from "@/lib/ai-agent";
import { addCustomerToSheet } from "@/lib/google-sheets";
import { sendTelegramAlert } from "@/lib/telegram";
import { analyzeMedia } from "@/lib/media-analyzer";
import { getHistory, saveHistory } from "@/lib/conversation-store";
import { saveLead } from "@/lib/crm";
import { checkRateLimit } from "@/lib/rate-limit";

const WA_TOKEN = process.env.WA_ACCESS_TOKEN!;
const WA_PHONE_ID = process.env.WA_PHONE_NUMBER_ID!;
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
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const messages = change.value?.messages || [];
          for (const msg of messages) {
            const from = msg.from;

            // Rate limit yoxla
            const allowed = await checkRateLimit(`wa:${from}`);
            if (!allowed) continue;

            if (msg.type === "text") {
              const text = msg.text?.body;
              if (!text) continue;
              await handleWhatsApp(from, text);
            } else if (msg.type === "image") {
              const mediaId = msg.image?.id;
              const mimeType = msg.image?.mime_type || "image/jpeg";
              const media = mediaId ? await fetchWAMedia(mediaId, mimeType, "şəkil") : undefined;
              await handleWhatsApp(from, "", media);
            } else if (msg.type === "video") {
              const mediaId = msg.video?.id;
              const mimeType = msg.video?.mime_type || "video/mp4";
              if (mediaId) {
                const fetched = await fetchWAMedia(mediaId, mimeType, "video");
                if (fetched?.data) {
                  const description = await analyzeMedia(fetched.data, mimeType, "video");
                  await handleWhatsApp(from, `[Müştəri video göndərdi. Gemini təsviri: ${description}]`);
                } else {
                  await handleWhatsApp(from, "[Müştəri video göndərdi]");
                }
              }
            } else if (msg.type === "audio" || msg.type === "voice") {
              const mediaId = msg.audio?.id || msg.voice?.id;
              const mimeType = msg.audio?.mime_type || msg.voice?.mime_type || "audio/ogg";
              if (mediaId) {
                const fetched = await fetchWAMedia(mediaId, mimeType, "ses");
                if (fetched?.data) {
                  const transcript = await analyzeMedia(fetched.data, mimeType, "ses");
                  await handleWhatsApp(from, transcript);
                } else {
                  await handleWhatsApp(from, "[Müştəri ses mesajı göndərdi, transkript alınmadı]");
                }
              }
            } else if (msg.type === "document") {
              const mediaId = msg.document?.id;
              const mimeType = msg.document?.mime_type || "application/pdf";
              const media = mediaId ? await fetchWAMedia(mediaId, mimeType, "fayl") : undefined;
              await handleWhatsApp(from, "", media);
            } else if (msg.type === "sticker") {
              const mediaId = msg.sticker?.id;
              const mimeType = msg.sticker?.mime_type || "image/webp";
              const media = mediaId ? await fetchWAMedia(mediaId, mimeType, "şəkil") : undefined;
              await handleWhatsApp(from, "", media);
            } else {
              await sendWhatsAppMessage(from, "Zəhmət olmasa mətn, şəkil, video və ya ses göndərin! 🙏");
            }
          }
        }
      }
    }
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook xətası:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function fetchWAMedia(
  mediaId: string,
  mimeType: string,
  mediaType: MediaInput["mediaType"]
): Promise<MediaInput | undefined> {
  try {
    // 1. Media URL-ni al
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    });
    const meta = await metaRes.json();
    const mediaUrl: string = meta.url;
    if (!mediaUrl) return undefined;

    // 2. Binary faylı yüklə (Authorization header ilə)
    const mediaRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    });
    if (!mediaRes.ok) return undefined;

    const buffer = await mediaRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return { type: "base64", data: base64, mimeType, mediaType };
  } catch {
    return undefined;
  }
}

async function handleWhatsApp(from: string, userMessage: string, media?: MediaInput) {
  const historyKey = `WA_${from}`;
  const history = await getHistory(historyKey);

  const { message: aiMessage, customerData } = await getAIResponse(userMessage, history, media);

  const mediaLabel = media?.mediaType || "media";
  history.push({ role: "user", content: userMessage || `[${mediaLabel}]` });
  history.push({ role: "assistant", content: aiMessage });
  await saveHistory(historyKey, history);

  await sendWhatsAppMessage(from, aiMessage);

  if (customerData.name || customerData.phone || customerData.email || customerData.destination) {
    await Promise.all([
      addCustomerToSheet("WhatsApp", from, customerData, userMessage),
      saveLead("WhatsApp", from, customerData, userMessage),
    ]);
  }
  await sendTelegramAlert("WhatsApp", userMessage || `[${mediaLabel} göndərdi]`, customerData);
}

async function sendWhatsAppMessage(to: string, message: string) {
  await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });
}
