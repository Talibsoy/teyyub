import Anthropic from "@anthropic-ai/sdk";
import { getToursContext } from "./rag";
import { getExamples, formatExamplesForPrompt } from "./ai-memory";
import { searchFlights, formatOffersForAI } from "./duffel";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sən Natoure.az-ın peşəkar turizm satış menecerisən. Adın Nigar xanımdır.
Azərbaycan bazarında işləyirsən, məqsədin hər söhbəti satışa çevirməndir.

=== KİMLİYİN ===
- Real insan kimi danış — robot deyilsən
- Qısa, aydın, satış yönümlü
- Uzun mətn yazma — müştəri oxumur
- Hər cavab satışa doğru bir addım olmalıdır
- Rəqib şirkətləri xatırlama

=== DİL ===
- Azərbaycan dili, sadə və səmimi
- "Siz" ilə müraciət et (böyük hərflə)
- Emoji — hər cavabda 1-2, artıq deyil

=== İLK MESAJ — MÜŞTƏRİ ANALİZİ ===
İlk mesajda bu 4 sualı qısa şəkildə soruş:
1. Hara getmək istəyirsiniz?
2. Neçə nəfərsiniz?
3. Tarixlər?
4. Büdcə aralığı?

Müştəri qərar verə bilmirsə — bu istiqamətləri təklif et:
🌴 Antalya | 🏙 Dubai | 🕌 Istanbul | 🌊 Şarm əl-Şeyx | 🗼 Avropa

=== UÇUŞ AXTARIŞI ===
Müştəri bilet, uçuş, avia soruşanda — search_flights alətini çağır.
IATA kodları: Istanbul=IST, Antalya=AYT, Dubai=DXB, Paris=CDG, London=LHR,
Doha=DOH, Qahirə=CAI, Şarm=SSH, Hurgada=HRG, Maldiv=MLE, Bangkok=BKK,
Bali=DPS, Tokyo=NRT, Pekin=PEK, Berlin=BER, Amsterdam=AMS, Roma=FCO,
Barselona=BCN, Madrid=MAD, Tbilisi=TBS, Moskva=SVO, Abu Dhabi=AUH

Tarix məlum deyilsə — soruş, sonra axtar.
Qiymətlərə 15% komissiya əlavə et, $1 = 1.7 AZN ilə çevir.

=== TƏKLİF FORMATI ===
📍 Məkan: [şəhər, ölkə]
🏨 Otel: [ad + ulduz]
🗓 Tarix: [başlanğıc – son]
💰 Qiymət: [X.XXX AZN (~$X.XXX)] / nəfər
✈️ Daxildir: uçuş, otel, transfer
❗ Üstünlük: [1 cümlə — niyə bu?]

2-3 variant göstər: büdcəyə görə (ekonom / standart / premium).

=== SATIŞ TEXNİKASI ===
- Təciliyyət: "Bu tarixə son 2-3 yer qalıb"
- Sosial sübut: "Bu ay ən çox seçilən turdur"
- Emosional toxunuş: "Tam rahatlıq — bütün məsələləri biz həll edirik"

=== ETİRAZ İDARƏSİ ===
"Bahadır" → Daha ucuz variant ver + dəyəri izah et
"Fikirləşim" → "Yerlər tez dolur, sizin üçün 24 saat saxlaya bilərəm. Razısınız?"
"Sonra yazaram" → "Bir sual: hansı tarix sizə daha uyğundur?"

=== ENDİRİM TƏLƏBI ===
HEÇ VAXT birbaşa endirim vermə.
"Bu qiymət artıq optimal tarifdır. Rəhbərliyimizlə məsləhətləşib 24 saat ərzində əlaqə saxlayacağıq. Nömrənizi ala bilərəmmi?"

=== UPSELL ===
Müştəri razılaşanda əlavə təklif et:
- 🚌 Transfer (+30-50 AZN)
- 🛡 Sığorta (+20-40 AZN)
- 🗺 Ekskursiya paketi (+100-200 AZN)
- ⬆️ Otel upgrade (+150-300 AZN)

=== REZERVASIYA ===
Müştəri razılaşanda al:
1. Ad, soyad
2. Telefon nömrəsi
3. Email
4. Nəfər sayı
→ "Rezervasiyanız qeydə alındı! Komandamız ən qısa zamanda əlaqə saxlayacaq."

=== AKTUAL TURLAR ===
{TOURS_CONTEXT}

=== GİZLİ PAKETLƏR ===
[GİZLİ PAKET] etiketli turları "xüsusi, seçilmiş müştərilərə" kimi təqdim et.
Upgrade mümkündürsə — bir dəfə soruş, israr etmə.

=== HƏR CAVAB ===
Mütləq CTA ilə bitsin:
"Rezerv edək?" / "Sizə saxlayım?" / "Hansı variant daha uyğundur?"

=== QADAĞANLAR ===
- Uzun izahat
- Texniki detallar
- Müştərini gözlətmək
- Uydurma məlumat — bilmirsənsə "komandamız əlaqə saxlayacaq" de

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

// Claude Tool Use — search_flights aləti
const FLIGHT_TOOL: Anthropic.Tool = {
  name: "search_flights",
  description: `Bakı (GYD) aeroportundan göstərilən istiqamətə real-time uçuş axtarır.
Müştəri bilet, uçuş, avia, flight sözlərini işlətdikdə və ya hər hansı şəhərə/ölkəyə getmək haqqında soruşanda bu aləti çağır.
Tarix məlum deyilsə əvvəl müştəridən soruş, sonra axtarış et.`,
  input_schema: {
    type: "object" as const,
    properties: {
      destination: {
        type: "string",
        description: "Gediş aeroportunun IATA kodu. Misal: IST (Istanbul), DXB (Dubai), CDG (Paris), LHR (London), AYT (Antalya), DOH (Doha), CAI (Qahirə), BKK (Bangkok), MLE (Maldiv), NRT (Tokyo), FCO (Roma), BCN (Barselona), MUC (Münhen), TBS (Tbilisi), SSH (Şarm), HRG (Hurgada), DPS (Bali), BER (Berlin), AMS (Amsterdam), MAD (Madrid), PRG (Praq), WAW (Varşava), BUD (Budapeşt), SVO (Moskva), AUH (Abu Dhabi), ADB (İzmir), ESB (Ankara)"
      },
      date: {
        type: "string",
        description: "Uçuş tarixi YYYY-MM-DD formatında. Misal: 2026-05-20"
      },
      passengers: {
        type: "number",
        description: "Sərnişin sayı. Default: 1"
      }
    },
    required: ["destination", "date"]
  }
};

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

export interface MediaInput {
  type: "url" | "base64";
  url?: string;
  data?: string;
  mimeType?: string;
  mediaType?: "şəkil" | "video" | "fayl" | "ses";
}

function parseCustomerData(text: string): { message: string; customerData: CustomerData } {
  const defaultData: CustomerData = {
    name: null,
    phone: null,
    email: null,
    destination: null,
    travel_date: null,
  };

  const jsonMatch = text.match(/<customer_data>([\s\S]*?)<\/customer_data>/);
  let customerData = defaultData;

  if (jsonMatch) {
    try {
      customerData = JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  const message = text.replace(/<customer_data>[\s\S]*?<\/customer_data>/, "").trim();
  return { message, customerData };
}

export async function getAIResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  media?: MediaInput
): Promise<AIResponse> {
  let userContent: Anthropic.MessageParam["content"];

  if (media) {
    const mediaLabel = media.mediaType || "şəkil";
    const textPrompt = userMessage || `Müştəri bir ${mediaLabel} göndərdi. Bu tur ilə əlaqəli ola bilər? Müştəriyə cavab ver.`;

    if (media.type === "url" && media.url) {
      userContent = [
        { type: "image", source: { type: "url", url: media.url } },
        { type: "text", text: textPrompt },
      ];
    } else if (media.type === "base64" && media.data && media.mimeType) {
      const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (supportedTypes.includes(media.mimeType)) {
        userContent = [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: media.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: media.data,
            },
          },
          { type: "text", text: textPrompt },
        ];
      } else if (media.mimeType?.startsWith("audio") || media.mimeType?.startsWith("video")) {
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Mən ${mediaLabel} fayllarını oxuya bilmirəm. Müştəriyə mehriban şəkildə cavab ver: mətn yazaraq sualını bildirsin, kömək etməyə hazırsan.`;
      } else {
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Bunu qeyd edib müştəriyə sualını mətnlə bildirməsini xahiş et.`;
      }
    } else {
      userContent = textPrompt;
    }
  } else {
    userContent = userMessage;
  }

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userContent },
  ];

  // Tur məlumatlarını system prompt-a inject et
  const msgText = typeof userContent === "string" ? userContent : userMessage;
  const toursContext = await getToursContext(msgText);

  const systemWithTours = SYSTEM_PROMPT
    .replace("{TOURS_CONTEXT}", toursContext || "Hal-hazırda aktiv tur məlumatı yoxdur.");

  // Uğurlu satış nümunələrini əlavə et
  const destinationMatch = msgText.match(/antalya|dubai|bali|paris|rome|roma|istanbul|maldiv|türkiy|ərəb|avropa/i);
  const detectedDest = destinationMatch ? destinationMatch[0] : null;
  const examples = await getExamples(detectedDest);
  const systemFinal = systemWithTours + formatExamplesForPrompt(examples);

  // === İLK ÇAĞIRIŞ — Tool Use ilə ===
  const firstResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    system: systemFinal,
    messages,
    tools: [FLIGHT_TOOL],
    tool_choice: { type: "auto" },
  });

  // Tool istifadəsi olmadısa birbaşa cavab qaytar
  if (firstResponse.stop_reason !== "tool_use") {
    const textBlock = firstResponse.content.find((b) => b.type === "text");
    const fullText = textBlock?.type === "text" ? textBlock.text : "";
    return parseCustomerData(fullText);
  }

  // === TOOL ÇAĞIRILDI — Duffel axtarışı et ===
  const toolResults: Anthropic.ToolResultBlockParam[] = [];

  for (const block of firstResponse.content) {
    if (block.type !== "tool_use") continue;

    if (block.name === "search_flights") {
      const input = block.input as { destination: string; date: string; passengers?: number };
      let resultText: string;

      try {
        const offers = await searchFlights({
          origin: "GYD",
          destination: input.destination,
          date: input.date,
          passengers: input.passengers || 1,
        });
        resultText = offers.length > 0
          ? formatOffersForAI(offers)
          : `${input.destination} istiqaməti üçün ${input.date} tarixinə uçuş tapılmadı.`;
      } catch (e) {
        resultText = `Uçuş axtarışında xəta baş verdi: ${e instanceof Error ? e.message : String(e)}`;
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultText,
      });
    }
  }

  // === İKİNCİ ÇAĞIRIŞ — Tool nəticəsi ilə ===
  const messagesWithTool: Anthropic.MessageParam[] = [
    ...messages,
    { role: "assistant" as const, content: firstResponse.content },
    { role: "user" as const, content: toolResults },
  ];

  const finalResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    system: systemFinal,
    messages: messagesWithTool,
    tools: [FLIGHT_TOOL],
    tool_choice: { type: "auto" },
  });

  const textBlock = finalResponse.content.find((b) => b.type === "text");
  const fullText = textBlock?.type === "text" ? textBlock.text : "";
  return parseCustomerData(fullText);
}
