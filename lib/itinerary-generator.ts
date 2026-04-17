import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface Activity {
  time: string;
  title: string;
  description: string;
  type: "transport" | "accommodation" | "food" | "activity" | "free";
  duration?: string;
  location?: string;
  cost_estimate?: string;
  tips?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  theme?: string;
  activities: Activity[];
}

export interface GeneratedItinerary {
  destination: string;
  title: string;
  summary: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  guests: number;
  budget_estimate: string;
  days: ItineraryDay[];
  travel_tips: string[];
  best_season: string;
}

export interface ItineraryRequest {
  destination: string;
  start_date: string;
  duration_days: number;
  guests: number;
  budget?: string;
  preferences?: string;
}

const ITINERARY_PROMPT = `Sən peşəkar səyahət planlaşdırma ekspertisən. İstifadəçi məlumatlarına əsasən detallı günlük səyahət proqramı hazırla.

ÇIXIŞ FORMATI: Yalnız JSON qaytarmalısan, başqa heç bir mətn yox. JSON strukturu:

{
  "destination": "İstanbul, Türkiyə",
  "title": "İstanbul — Tarixi Şəhər Kəşfi",
  "summary": "2-3 cümlə ümumi xülasə",
  "duration_days": 5,
  "start_date": "2026-05-10",
  "end_date": "2026-05-14",
  "guests": 2,
  "budget_estimate": "1.800–2.400 AZN/nəfər",
  "days": [
    {
      "day": 1,
      "date": "2026-05-10",
      "title": "Sultanahmet — Tarixi Mərkəz",
      "theme": "Tarixi kəşf",
      "activities": [
        {
          "time": "09:00",
          "title": "Ayasofya ziyarəti",
          "description": "Bizans dövrünün möhtəşəm abidəsi. Səhər getmək tövsiyə edilir — adam az olur.",
          "type": "activity",
          "duration": "1.5 saat",
          "location": "Sultanahmet, Fatih",
          "cost_estimate": "Pulsuz",
          "tips": "Qadınlar üçün baş örtüsü lazımdır"
        }
      ]
    }
  ],
  "travel_tips": [
    "İstanbulkart alın — nəqliyyat 50% ucuzlaşır",
    "Turistik restoranlarda qiymətlər yüksəkdir — Eminönü ətraflarda yerlilərin getdiyi yerləri tercih edin"
  ],
  "best_season": "Aprel–May və Sentyabr–Oktyabr"
}

QAYDALAR:
- Hər gün üçün 5-8 aktivlik yaz (transport + nahar + şam + əsas aktivliklər)
- Aktivlik tipləri: "transport", "accommodation", "food", "activity", "free"
- Vaxtlar ardıcıl olsun (08:00-dan başla, 22:00-da bitir)
- Qiymət qiymətləndirmələri AZN-də olsun
- Azərbaycan ədəbi dilində yaz
- Hər aktivlik üçün praktiki "tips" əlavə et
- budget_estimate — nəfər başına ümumi xərc (otel + nahar + aktivliklər, uçuş daxil deyil)
- travel_tips — 4-6 praktiki məsləhət
- Mövcud tarixlərə uyğun fəaliyyət saatları göstər (muzey vaxtları, namaz vaxtları, tətillər)`;

export async function generateItinerary(req: ItineraryRequest): Promise<GeneratedItinerary> {
  const endDate = new Date(req.start_date);
  endDate.setDate(endDate.getDate() + req.duration_days - 1);
  const end_date = endDate.toISOString().split("T")[0];

  const userPrompt = `Məqsəd: ${req.destination}
Başlanğıc tarixi: ${req.start_date}
Son tarix: ${end_date}
Gün sayı: ${req.duration_days}
Qonaq sayı: ${req.guests} nəfər
${req.budget ? `Büdcə: ${req.budget}` : ""}
${req.preferences ? `Seçimlər: ${req.preferences}` : ""}

Bu məlumatlara əsasən tam günlük proqram hazırla. Yalnız JSON qaytart.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: ITINERARY_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find(b => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude cavab vermedi");
  }

  const raw = textBlock.text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("JSON tapılmadı");

  return JSON.parse(jsonMatch[0]) as GeneratedItinerary;
}
