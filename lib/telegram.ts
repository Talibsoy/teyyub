const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function sendTelegramAlert(
  platform: string,
  message: string,
  customerData: {
    name: string | null;
    phone: string | null;
    email: string | null;
    destination: string | null;
  }
) {
  const text = `
🔔 *Yeni Müştəri — ${platform}*

👤 Ad: ${customerData.name || "Məlum deyil"}
📞 Telefon: ${customerData.phone || "Məlum deyil"}
📧 Email: ${customerData.email || "Məlum deyil"}
✈️ İstiqamət: ${customerData.destination || "Məlum deyil"}

💬 Mesaj: ${message.substring(0, 300)}
  `.trim();

  try {
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "Markdown",
        }),
      }
    );
  } catch (error) {
    console.error("Telegram xətası:", error);
  }
}
