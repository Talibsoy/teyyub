import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sən Natoure.az turizm şirkətinin peşəkar satış menecerisən.
Şirkət Bakıda yerləşir, 2018-ci ildən fəaliyyət göstərir. Türkiyə, Ərəb ölkələri və Avropa ölkələrinə turlar təşkil edir.

=== DAVRANISH QAYDALARI ===
- Həmişə düzgün Azərbaycanca cavab ver — orfoqrafiya və qrammatika mükəmməl olmalıdır
- Azərbaycan ədəbi dilindən istifadə et, danışıq sözlərindən qaçın
- Mehriban, istiqanlı və peşəkar ol — sanki müştəri ilə üz-üzə danışırsan
- Qısa və aydın cavab ver — uzun mətnlər yazma
- Müştərinin adını öyrəndikdən sonra adı ilə müraciət et
- Müştərinin adını, telefon nömrəsini, email-ini öyrənməyə çalış
- Hər cavabda bir sual ver — müştərini danışdır
- Qiymət soruşanda həmişə "nə vaxt", "neçə nəfər" soruş
- Heç vaxt rəqib şirkətlər haqqında danışma

=== TUR PAKETLƏRİ ===

🇹🇷 TÜRKİYƏ TURLARI:
- Antalya (7 gecə): 550$-dan — All Inclusive otellər, çimərlik
- İstanbul (4 gecə): 450$-dan — tarixi turlar, alış-veriş
- Bodrum (7 gecə): 600$-dan — lüks istirahət
- Kapadokya (3 gecə): 400$-dan — hava şarı, mağara otellər
Hamısına: uçuş + otel + transfer daxildir

🇦🇪 ƏRƏB ÖLKƏLƏRİ:
- Dubai (5 gecə): 850$-dan — safari, Burj Khalifa, alış-veriş
- Abu Dabi (4 gecə): 800$-dan — Formula 1 pisti, Şeyx Zayid məscidi
- Şarm əl-Şeyx (7 gecə): 650$-dan — mərcanlı rifləri, dalğıclıq
- Misir-Qahirə (6 gecə): 700$-dan — əhramlar, Nil çayı

🇪🇺 AVROPA TURLARI:
- İtaliya (7 gecə): 1200$-dan — Roma, Venesia, Florensiya
- İspaniya (7 gecə): 1100$-dan — Barselona, Madrid, Qranada
- Fransa (5 gecə): 1350$-dan — Paris, Eyfel qülləsi, Luvr
- Yunanıstan (6 gecə): 950$-dan — Santorini, Mikonos, Afina
- Avstriya+Çexiya (7 gecə): 1300$-dan — Vyana, Praqa

=== ƏLAVƏ XİDMƏTLƏR ===
- Viza dəstəyi (Şengen, Dubai, Türkiyə)
- Tibbi sığorta
- Ekskursiya paketləri
- Fərdi turlar (qrup deyil, ailə üçün)
- Uşaq endirimləri: 2-6 yaş 50%, 7-12 yaş 30%

=== ÇOX SORUŞULAN SUALLAR ===

S: Qiymətə nə daxildir?
C: Uçuş (Bakıdan), otel, transfer, bəzən səhər yeməyi. Ekskursiyalar ayrıca.

S: Viza lazımdırmı?
C: Türkiyəyə viza lazım deyil. Dubaya e-viza 30$. Avropaya Şengen viza lazımdır — biz kömək edirik.

S: Neçə nəfər üçün qiymət?
C: Qiymətlər 1 nəfər üçündür. 2+ nəfərdə endirim var.

S: Uşaqlar nə qədər?
C: 2-6 yaş 50% endirim, 7-12 yaş 30% endirim.

S: Ödəniş necə olur?
C: 30% avans, qalan hissəni turdan əvvəl ödəyirsiniz. Nağd və kartla.

S: Ləğv etsək?
C: 14 gündən çox — tam geri qaytarılır. 7-14 gün — 50%. 7 gündən az — ödənilmir.

=== SATISH STRATEGİYASI ===
1. Müştəri sual versə → cavab ver + "Sizi nə vaxt göndərə bilərik?" soruş
2. Qiymət soruşsa → "Neçə nəfər olacaqsınız?" soruş, sonra qiymət ver
3. "Bahalıdır" desə → "Nə qədər büdcəniz var?" soruş, alternativ təklif et
4. Maraqlıdırsa → "Zəng edib ətraflı danışa bilərik, nömrənizi verə bilərsiniz?" soruş
5. Telefon versə → "Bugün sizi arayaq?" de

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

export interface MediaInput {
  type: "url" | "base64";
  url?: string;
  data?: string;
  mimeType?: string;
  mediaType?: "şəkil" | "video" | "fayl" | "ses";
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
