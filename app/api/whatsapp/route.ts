import { NextRequest, NextResponse } from "next/server";
import { getAIResponse, MediaInput } from "@/lib/ai-agent";
import { sendTelegramAlert } from "@/lib/telegram";
import { analyzeMedia } from "@/lib/media-analyzer";
import { getHistory, saveHistory } from "@/lib/conversation-store";
import { saveLead } from "@/lib/crm";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCRMProfileByPhone } from "@/lib/crm-profile";
import { Redis } from "@upstash/redis";
// google-sheets dinamik import — googleapis modulu TLS qlobal dəyişdirir,
// statik import bütün prosesi yoluxdurur (NODE_TLS_REJECT_UNAUTHORIZED=0)

export const maxDuration = 60;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

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

  // Meta webhook-u həmişə 200 almalıdır — 500 qaytarsan retry loop başlayır
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

            // Deduplication — eyni mesajı iki dəfə işləmə (webhook retry)
            const msgId: string = msg.id;
            if (msgId && redis) {
              const seen = await redis.get(`wa_seen:${msgId}`);
              if (seen) continue;
              await redis.set(`wa_seen:${msgId}`, 1, { ex: 300 }); // 5 dəqiqə
            }

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
    // 200 qaytarırıq — 500 göndərsək Meta webhook-u yenidən göndərir (retry loop)
    console.error("[WA Webhook] Xəta:", error);
    return NextResponse.json({ status: "ok" });
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
  const mediaLabel = media?.mediaType || "media";

  try {
    const historyKey = `WA_${from}`;
    const history = await getHistory(historyKey);

    const crmProfile = await getCRMProfileByPhone(from).catch(() => null);

    const { message: aiMessage, customerData } = await getAIResponse(
      userMessage, history, media, crmProfile,
      { maxRounds: 3, maxTokens: 2048 }
    );

    history.push({ role: "user", content: userMessage || `[${mediaLabel}]` });
    history.push({ role: "assistant", content: aiMessage });
    await saveHistory(historyKey, history);

    await sendWhatsAppMessage(from, aiMessage);

    if (customerData.name || customerData.phone || customerData.email || customerData.destination) {
      await Promise.all([
        import("@/lib/google-sheets").then(m =>
          m.addCustomerToSheet("WhatsApp", from, customerData, userMessage)
        ).catch(e => console.error("[WA] Google Sheets xətası:", e)),
        saveLead("WhatsApp", from, customerData, userMessage).catch(e =>
          console.error("[WA] CRM lead xətası:", e)
        ),
      ]);
    }

    await sendTelegramAlert("WhatsApp", userMessage || `[${mediaLabel} göndərdi]`, customerData).catch(() => {});
  } catch (err) {
    console.error(`[WA handleWhatsApp] from=${from} xəta:`, err);
    // Müştəriyə fallback mesaj göndər
    await sendWhatsAppMessage(
      from,
      "Bağlantı xətası baş verdi. Zəhmət olmasa bir az sonra yenidən yazın və ya +994517769632 nömrəsinə zəng edin."
    ).catch(() => {});
  }
}

async function sendWhatsAppMessage(to: string, message: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.error("[WA] WA_ACCESS_TOKEN və ya WA_PHONE_NUMBER_ID env var yoxdur!");
    return;
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
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

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[WA] Mesaj göndərmə xətası — status=${res.status} to=${to} body=${errBody}`);
  }
}
