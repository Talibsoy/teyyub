import { CustomerData } from "@/lib/ai-agent";
import { ConvMeta } from "@/lib/conversation-store";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function tgSend(text: string) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "Markdown" }),
    });
  } catch {
    // Telegram xətası əsas axını dayandırmasın
  }
}

// Artıq hər mesajda çağrılmır — yalnız özət göndərir
export async function sendTelegramAlert(
  _platform: string,
  _message: string,
  _customerData: CustomerData
) {
  // Bildirişlər indi söhbət özəti kimi gəlir (sendConversationSummary)
  // Bu funksiya geriyə uyğunluq üçün saxlanılır
}

export async function sendConversationSummary(meta: ConvMeta) {
  const cd = meta.customerData;
  const durationMs = meta.lastActivity - meta.startTime;
  const durationMin = Math.round(durationMs / 60000);

  const startStr = new Date(meta.startTime).toLocaleTimeString("az-AZ", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku"
  });
  const endStr = new Date(meta.lastActivity).toLocaleTimeString("az-AZ", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku"
  });

  const lines = [
    `📋 *Söhbət Özəti — ${meta.platform}*`,
    ``,
    cd.name       ? `👤 Ad: ${cd.name}`              : `👤 Ad: —`,
    cd.phone      ? `📞 Telefon: ${cd.phone}`         : `📞 Telefon: —`,
    cd.email      ? `📧 Email: ${cd.email}`           : null,
    cd.destination ? `📍 İstiqamət: ${cd.destination}` : null,
    cd.travel_date ? `📅 Tarix: ${cd.travel_date}`    : null,
    ``,
    `💬 Mesaj sayı: ${meta.messageCount}`,
    `⏱ ${startStr} — ${endStr} (${durationMin} dəq)`,
    ``,
    `Son mesaj: _"${meta.lastUserMessage.slice(0, 150)}"_`,
  ].filter(line => line !== null).join("\n");

  await tgSend(lines);
}
