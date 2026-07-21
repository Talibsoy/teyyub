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
  "budget_estimate": "$1,800–2,400 per person",
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

RULES:
- 5-8 activities per day (transport + lunch + dinner + main activities)
- Activity types: "transport", "accommodation", "food", "activity", "free"
- Times in order (start at 08:00, end by 22:00)
- Cost estimates in USD ($)
- Write in clear, natural English
- Add a practical "tips" note for each activity
- budget_estimate — total per-person cost (hotel + meals + activities; flights NOT included)
- travel_tips — 4-6 practical tips
- Reflect realistic opening hours and seasonality (park hours, tour seasons, closures)
- This is an ESTIMATED plan: prefer real, well-known places; do NOT present prices as guaranteed — they are estimates confirmed at booking`;

export async function generateItinerary(req: ItineraryRequest): Promise<GeneratedItinerary> {
  const endDate = new Date(req.start_date);
  endDate.setDate(endDate.getDate() + req.duration_days - 1);
  const end_date = endDate.toISOString().split("T")[0];

  const userPrompt = `Destination: ${req.destination}
Start date: ${req.start_date}
End date: ${end_date}
Days: ${req.duration_days}
Guests: ${req.guests}
${req.budget ? `Budget: ${req.budget}` : ""}
${req.preferences ? `Preferences: ${req.preferences}` : ""}

Create a full day-by-day itinerary from these details. Return ONLY JSON.`;

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
