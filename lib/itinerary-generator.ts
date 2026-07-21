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

const ITINERARY_PROMPT = `You are a professional outdoor-travel planning expert. Based on the user's details, create a detailed day-by-day itinerary.

OUTPUT FORMAT: Return ONLY JSON, no other text. JSON structure:

{
  "destination": "Anchorage, Alaska",
  "title": "Alaska — Wildlife & Glacier Adventure",
  "summary": "2-3 sentence overview",
  "duration_days": 5,
  "start_date": "2026-06-10",
  "end_date": "2026-06-14",
  "guests": 2,
  "budget_estimate": "$1,100–1,400/nəfər",
  "days": [
    {
      "day": 1,
      "date": "2026-06-10",
      "title": "Arrival & Coastal Trail",
      "theme": "Easy start",
      "activities": [
        {
          "time": "09:00",
          "title": "Tony Knowles Coastal Trail walk",
          "description": "Scenic waterfront trail with chances to spot moose and eagles. Best in the morning when it is quiet.",
          "type": "activity",
          "duration": "1.5 hours",
          "location": "Anchorage",
          "cost_estimate": "Free",
          "tips": "Bring layers — the coastal wind is cold even in summer"
        }
      ]
    }
  ],
  "travel_tips": [
    "Book wildlife and glacier tours early — summer slots fill fast",
    "Daylight lasts ~19 hours in June — pack an eye mask"
  ],
  "best_season": "June–August"
}

QAYDALAR:
- Hər gün üçün 5-8 aktivlik yaz (transport + nahar + şam + əsas aktivliklər)
- Aktivlik tipləri: "transport", "accommodation", "food", "activity", "free"
- Vaxtlar ardıcıl olsun (08:00-dan başla, 22:00-da bitir)
- Qiymət qiymətləndirmələri ABŞ dolları ($/USD) ilə olsun
- Azərbaycan ədəbi dilində yaz
- Hər aktivlik üçün praktiki "tips" əlavə et
- budget_estimate — nəfər başına ümumi xərc (otel + nahar + aktivliklər, uçuş daxil deyil)
- travel_tips — 4-6 praktiki məsləhət
- Mövcud tarixlərə uyğun fəaliyyət saatları göstər (muzey vaxtları, namaz vaxtları, tətillər)
- Bu TƏXMİNİ plandır: real, tanınmış yerlərə üstünlük ver; qiymətləri zəmanətli kimi təqdim etmə — onlar rezervasiya mərhələsində canlı yoxlanılır`;

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
