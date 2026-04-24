import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getAIResponse, MediaInput } from "@/lib/ai-agent";
// google-sheets dinamik import — googleapis TLS qlobal dəyişdirir
import { sendTelegramAlert, sendConversationSummary } from "@/lib/telegram";
import { analyzeMedia } from "@/lib/media-analyzer";
import { getHistory, saveHistory, saveConvMeta, getConvMeta, markSummarySent } from "@/lib/conversation-store";
import { saveLead } from "@/lib/crm";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCRMProfileByPhone } from "@/lib/crm-profile";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

const PAGE_TOKEN = process.env.FB_PAGE_TOKEN!;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN!;
const APP_SECRET = process.env.FB_APP_SECRET;

function verifyMetaSignature(rawBody: string, signature: string | null): boolean {
  if (!APP_SECRET || !signature) return !APP_SECRET; // secret yoxdursa dev rejimi — keç
  const expected = `sha256=${createHmac("sha256", APP_SECRET).update(rawBody).digest("hex")}`;
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

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
  let rawBody: string;
  let body;
  try {
    rawBody = await req.text();
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    if (body.object === "page" || body.object === "instagram") {
      for (const entry of body.entry) {
        // Instagram mesajları entry.messaging-də gəlir
        for (const event of entry.messaging || []) {
          if (event.message?.is_echo) continue;

          // Deduplication — webhook retry loop qarşısı (mid = mesaj ID)
          const mid: string | undefined = event.message?.mid;
          if (mid && redis) {
            const seen = await redis.get(`fb_seen:${mid}`);
            if (seen) continue;
            await redis.set(`fb_seen:${mid}`, 1, { ex: 300 });
          }

          // Facebook Səhifəsinin öz ID-si ilə gələn mesajları atla
          const isFBPage = event.sender?.id === process.env.FB_PAGE_ID;
          // Instagram hesabının IGSID-si ilə gələn mesajları atla
          const isIGSelf = event.sender?.id === process.env.IG_USER_ID;
          if (isFBPage || isIGSelf) continue;

          // Platformu müəyyən et
          const isInstagram = body.object === "instagram" ||
            (entry.id && entry.id === process.env.IG_PAGE_ID);
          const platform = isInstagram ? "Instagram" : "Facebook";

          // Rate limit yoxla
          const allowed = await checkRateLimit(`${platform.toLowerCase()}:${event.sender.id}`);
          if (!allowed) continue;

          // Postback (Get Started və s.)
          if (event.postback) {
            await handleMessage(platform, event.sender.id, "Salam", undefined);
            continue;
          }

          if (!event.message) continue;

          const text = event.message.text;
          const { userMessage: mediaText, media } = await resolveFBAttachment(event.message.attachments?.[0]);

          if (!text && !mediaText && !media) {
            await sendFBMessage(event.sender.id, "Zəhmət olmasa mətn, şəkil, video və ya ses göndərin! 🙏");
            continue;
          }

          await handleMessage(platform, event.sender.id, text || mediaText || "", media);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook xətası:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MB

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
        const contentLength = Number(res.headers.get("content-length") ?? 0);
        if (contentLength > MAX_MEDIA_BYTES) return { userMessage: "[Fayl ölçüsü həddindən böyükdür]" };
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
        const contentLength = Number(res.headers.get("content-length") ?? 0);
        if (contentLength > MAX_MEDIA_BYTES) return { userMessage: "[Ses faylı həddindən böyükdür]" };
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
        const contentLength = Number(res.headers.get("content-length") ?? 0);
        if (contentLength > MAX_MEDIA_BYTES) return { userMessage: "[Video faylı həddindən böyükdür]" };
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

  // Əvvəlki sessiya 30+ dəq bitibsə — özət göndər
  const prevMeta = await getConvMeta(historyKey);
  const INACTIVE_MS = 30 * 60 * 1000;
  if (prevMeta && !prevMeta.summarySent && Date.now() - prevMeta.lastActivity >= INACTIVE_MS) {
    await sendConversationSummary(prevMeta);
    await markSummarySent(`conv_meta:${historyKey}`);
  }

  const history = await getHistory(historyKey);

  // CRM profili — Instagram sender phone-u yoxdur, amma əvvəlki saveLead-dən phone ola bilər
  const crmProfile = await getCRMProfileByPhone(senderId).catch(() => null);

  const { message: aiMessage, customerData } = await getAIResponse(userMessage, history, media, crmProfile);

  const mediaLabel = media?.mediaType || "media";
  history.push({ role: "user", content: userMessage || `[${mediaLabel}]` });
  history.push({ role: "assistant", content: aiMessage });
  await saveHistory(historyKey, history);

  await sendFBMessage(senderId, aiMessage);

  if (customerData.name || customerData.phone || customerData.email || customerData.destination) {
    await Promise.all([
      import("@/lib/google-sheets").then(m =>
        m.addCustomerToSheet(platform, senderId, customerData, userMessage)
      ).catch(e => console.error("[Webhook] Google Sheets xətası:", e)),
      saveLead(platform, senderId, customerData, userMessage),
    ]);
  }

  // Hər mesajda conv_meta yenilə — özət cron tərəfindən göndəriləcək
  await saveConvMeta(historyKey, {
    platform,
    senderId,
    customerData,
    messageCount: history.length,
    lastUserMessage: userMessage || `[${mediaLabel}]`,
  });
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
