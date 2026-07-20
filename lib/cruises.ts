// lib/cruises.ts
// ⚠ DEPRECATED (Faza 0 — Zero-Hallucination): This returns 100% hardcoded FAKE data.
// It is NO LONGER wired to the AI agent. Do NOT re-import into any user-facing flow.
// Replace with a real provider integration before exposing cruises as bookable.
// Flynatoure Cruise Search & Itinerary Engine (USD Primary)

export interface CruiseOffer {
  id: string;
  name: string;
  shipName: string;
  cruiseLine: string;
  destination: string;
  departurePort: string;
  durationNights: number;
  startDate: string;
  endDate: string;
  priceUsd: number;
  rating: number;
  cabinTypes: { type: string; priceUsd: number; available: boolean }[];
  itinerary: { day: number; port: string; arrival: string; departure: string; activity: string }[];
  image: string;
}

const CRUISE_TEMPLATES = [
  {
    cruiseLine: "Royal Caribbean International",
    shipName: "Symphony of the Seas",
    name: "7-Night Western Caribbean Cruise",
    destination: "Caribbean",
    departurePort: "Miami, Florida",
    durationNights: 7,
    priceUsd: 799,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80",
    itinerary: [
      { day: 1, port: "Miami, Florida", arrival: "—", departure: "16:30", activity: "Embarkation and Sail Away Party" },
      { day: 2, port: "Perfect Day at CocoCay, Bahamas", arrival: "07:00", departure: "17:00", activity: "Private Island Thrills & Beaches" },
      { day: 3, port: "At Sea", arrival: "—", departure: "—", activity: "FlowRider surfing & Broadway show onboard" },
      { day: 4, port: "Cozumel, Mexico", arrival: "08:00", departure: "18:00", activity: "Mayan ruins or snorkeling excursions" },
      { day: 5, port: "Roatan, Honduras", arrival: "08:00", departure: "17:00", activity: "Zip-lining through tropical forests" },
      { day: 6, port: "Costa Maya, Mexico", arrival: "07:00", departure: "14:00", activity: "Snorkeling at the Mesoamerican Barrier Reef" },
      { day: 7, port: "At Sea", arrival: "—", departure: "—", activity: "Relaxation at the Solarium & premium dining" },
      { day: 8, port: "Miami, Florida", arrival: "06:00", departure: "—", activity: "Disembarkation" }
    ]
  },
  {
    cruiseLine: "Celebrity Cruises",
    shipName: "Celebrity Edge",
    name: "10-Night Greek Isles & Italy Cruise",
    destination: "Mediterranean",
    departurePort: "Civitavecchia (Rome), Italy",
    durationNights: 10,
    priceUsd: 1499,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    itinerary: [
      { day: 1, port: "Rome (Civitavecchia), Italy", arrival: "—", departure: "17:00", activity: "Embarkation" },
      { day: 2, port: "Naples, Italy", arrival: "07:00", departure: "18:30", activity: "Explore Pompeii or Amalfi Coast" },
      { day: 3, port: "At Sea", arrival: "—", departure: "—", activity: "Indulge in French fine dining and theater" },
      { day: 4, port: "Santorini, Greece", arrival: "07:00", departure: "22:00", activity: "Sunset dinner overlooking the caldera" },
      { day: 5, port: "Mykonos, Greece", arrival: "07:00", departure: "18:00", activity: "Beaches and iconic windmills tour" },
      { day: 6, port: "Athens (Piraeus), Greece", arrival: "06:00", departure: "18:00", activity: "Visit the historical Acropolis" },
      { day: 7, port: "Ephesus (Kusadasi), Turkey", arrival: "07:00", departure: "17:00", activity: "Walking through ancient Roman ruins" },
      { day: 8, port: "Rhodes, Greece", arrival: "08:00", departure: "18:00", activity: "Stroll in the medieval Old Town" },
      { day: 9, port: "At Sea", arrival: "—", departure: "—", activity: "Relax at the rooftop garden pool" },
      { day: 10, port: "Valletta, Malta", arrival: "08:00", departure: "17:00", activity: "Baroque city walks and fort tours" },
      { day: 11, port: "Rome (Civitavecchia), Italy", arrival: "05:00", departure: "—", activity: "Disembarkation" }
    ]
  },
  {
    cruiseLine: "Norwegian Cruise Line",
    shipName: "Norwegian Encore",
    name: "7-Night Glacier Bay Alaskan Cruise",
    destination: "Alaska",
    departurePort: "Seattle, Washington",
    durationNights: 7,
    priceUsd: 949,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    itinerary: [
      { day: 1, port: "Seattle, Washington", arrival: "—", departure: "16:00", activity: "Embarkation & Puget Sound sail-off" },
      { day: 2, port: "At Sea", arrival: "—", departure: "—", activity: "Gourmet dining and Go-Karting on the top deck" },
      { day: 3, port: "Ketchikan, Alaska", arrival: "07:00", departure: "16:00", activity: "Salmon fishing and totem pole tour" },
      { day: 4, port: "Juneau, Alaska", arrival: "06:00", departure: "13:30", activity: "Whale watching or Mendenhall Glacier hike" },
      { day: 5, port: "Glacier Bay National Park", arrival: "06:00", departure: "15:00", activity: "Glacier cruising & park ranger commentary" },
      { day: 6, port: "Skagway, Alaska", arrival: "07:00", departure: "17:00", activity: "White Pass & Yukon Route scenic railway" },
      { day: 7, port: "Victoria, British Columbia", arrival: "16:00", departure: "23:59", activity: "High tea or Buchart Gardens evening walk" },
      { day: 8, port: "Seattle, Washington", arrival: "06:00", departure: "—", activity: "Disembarkation" }
    ]
  }
];

export async function searchCruises(destination: string, date: string, durationNights?: number): Promise<CruiseOffer[]> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const targetDest = destination?.toLowerCase() || "";
  const filtered = CRUISE_TEMPLATES.filter(
    (c) =>
      c.destination.toLowerCase().includes(targetDest) ||
      targetDest.includes(c.destination.toLowerCase()) ||
      c.departurePort.toLowerCase().includes(targetDest) ||
      targetDest === ""
  );

  // Fallback to all templates if none match
  const matches = filtered.length > 0 ? filtered : CRUISE_TEMPLATES;

  // Resolve dynamic dates starting from search date
  const baseDate = new Date(date || new Date().toISOString().split("T")[0]);
  if (isNaN(baseDate.getTime())) {
    baseDate.setTime(Date.now() + 30 * 86400000); // 30 days out fallback
  }

  return matches.map((c, index) => {
    const start = new Date(baseDate);
    // Offset each offer start by a few days to create variety
    start.setDate(start.getDate() + index * 3);
    const end = new Date(start);
    end.setDate(end.getDate() + c.durationNights);

    const priceWithTax = Math.ceil(c.priceUsd * 1.15); // 15% Flynatoure global commission

    return {
      id: `CRUISE-${index + 1001}`,
      name: c.name,
      shipName: c.shipName,
      cruiseLine: c.cruiseLine,
      destination: c.destination,
      departurePort: c.departurePort,
      durationNights: c.durationNights,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      priceUsd: priceWithTax,
      rating: c.rating,
      image: c.image,
      cabinTypes: [
        { type: "Inside Cabin", priceUsd: priceWithTax, available: true },
        { type: "Oceanview Cabin", priceUsd: Math.ceil(priceWithTax * 1.25), available: true },
        { type: "Balcony Suite", priceUsd: Math.ceil(priceWithTax * 1.6), available: true },
        { type: "Luxury Club Suite", priceUsd: Math.ceil(priceWithTax * 2.2), available: index % 2 === 0 }
      ],
      itinerary: c.itinerary
    };
  });
}
