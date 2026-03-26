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
  const hasData = customerData.name || customerData.phone || customerData.email || customerData.destination;
  const icon = hasData ? "🔥" : "💬";
  const title = hasData ? "Yeni Lead" : "Yeni Mesaj";

  const text = `
${icon} *${title} — ${platform}*

👤 Ad: ${customerData.name || "—"}
📞 Telefon: ${customerData.phone || "—"}
📧 Email: ${customerData.email || "—"}
✈️ İstiqamət: ${customerData.destination || "—"}

💬 _${message.substring(0, 300)}_
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
