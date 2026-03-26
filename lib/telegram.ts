import { CustomerData } from "@/lib/ai-agent";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramAlert(
  platform: string,
  message: string,
  customerData: CustomerData
) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const lines = [
    `🔔 *Yeni Mesaj — ${platform}*`,
    customerData.name ? `👤 Ad: ${customerData.name}` : null,
    customerData.phone ? `📞 Telefon: ${customerData.phone}` : null,
    customerData.destination ? `📍 Tur: ${customerData.destination}` : null,
    customerData.travel_date ? `📅 Tarix: ${customerData.travel_date}` : null,
    `💬 "${message.slice(0, 200)}"`,
  ].filter(Boolean).join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: lines,
        parse_mode: "Markdown",
      }),
    });
  } catch {
    // Telegram xətası webhook-u dayandırmasın
  }
}
