import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sən Flynatoure turizm şirkətinin peşəkar satış menecerisən.
Şirkət Bakıda yerləşir və Türkiyə, Ərəb ölkələri və Avropa ölkələrinə turlar təşkil edir.

Qaydalar:
- Həmişə Azərbaycanca cavab ver
- Mehriban, peşəkar və satışa yönəlmiş ol
- Müştərinin adını, telefon nömrəsini və email-ini öyrənməyə çalış
- Tur qiymətlərini, tarixlərini soruş
- Müştəri məlumatlarını JSON formatında çıxar

Tur məlumatları:
- Türkiyə: 7 gecə 8 gün, 500$-dan başlayır (otel+uçuş+transfer)
- Dubai: 5 gecə 6 gün, 800$-dan başlayır
- Misir: 7 gecə 8 gün, 600$-dan başlayır
- İtaliya: 7 gecə 8 gün, 1200$-dan başlayır
- İspaniya: 7 gecə 8 gün, 1100$-dan başlayır
- Fransa: 5 gecə 6 gün, 1300$-dan başlayır

Cavabın sonunda müştəri məlumatlarını bu JSON formatında ver (məlumat yoxdursa null yaz):
<customer_data>
{
  "name": "ad soyad və ya null",
  "phone": "telefon və ya null",
  "email": "email və ya null",
  "destination": "istiqamət və ya null",
  "travel_date": "tarix və ya null"
}
</customer_data>`;

export interface CustomerData {
  name: string | null;
  phone: string | null;
  email: string | null;
  destination: string | null;
  travel_date: string | null;
}

export interface AIResponse {
  message: string;
  customerData: CustomerData;
}

export async function getAIResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<AIResponse> {
  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: userMessage },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const fullText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // customer_data JSON-u çıxar
  const jsonMatch = fullText.match(
    /<customer_data>([\s\S]*?)<\/customer_data>/
  );
  let customerData: CustomerData = {
    name: null,
    phone: null,
    email: null,
    destination: null,
    travel_date: null,
  };

  if (jsonMatch) {
    try {
      customerData = JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Cavabdan customer_data hissəsini çıxar
  const message = fullText.replace(/<customer_data>[\s\S]*?<\/customer_data>/, "").trim();

  return { message, customerData };
}
