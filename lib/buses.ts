// lib/buses.ts
// Flynatoure Bus Search & Routing Engine (USD Primary)

export interface BusOffer {
  id: string;
  busNumber: string;
  operator: string;
  origin: string;
  destination: string;
  departureTime: string; // HH:MM
  arrivalTime: string;   // HH:MM
  durationMinutes: number;
  date: string;
  priceUsd: number;
  rating: number;
  amenities: string[];
  seatsLeft: number;
}

const BUS_TEMPLATES = [
  // --- US REGIONAL BUS LINES ---
  {
    operator: "FlixBus US",
    busNumber: "FLX-4102",
    origin: "New York",
    destination: "Washington D.C.",
    departureTime: "07:30",
    arrivalTime: "11:55",
    durationMinutes: 265,
    priceUsd: 29,
    rating: 4.3,
    amenities: ["Free WiFi", "Power Outlets", "Restroom", "Extra Legroom"],
    seatsLeft: 22
  },
  {
    operator: "Greyhound Express",
    busNumber: "GH-819",
    origin: "New York",
    destination: "Washington D.C.",
    departureTime: "10:00",
    arrivalTime: "14:35",
    durationMinutes: 275,
    priceUsd: 25,
    rating: 4.1,
    amenities: ["WiFi", "Power Outlets", "Restroom", "Reclining Seats"],
    seatsLeft: 14
  },
  {
    operator: "FlixBus US",
    busNumber: "FLX-4309",
    origin: "New York",
    destination: "Boston",
    departureTime: "08:15",
    arrivalTime: "12:45",
    durationMinutes: 270,
    priceUsd: 32,
    rating: 4.4,
    amenities: ["Free WiFi", "Power Outlets", "Restroom", "Snacks available"],
    seatsLeft: 18
  },

  // --- EUROPEAN CORRIDORS ---
  {
    operator: "FlixBus EU",
    busNumber: "FLX-1207",
    origin: "Paris",
    destination: "Amsterdam",
    departureTime: "09:30",
    arrivalTime: "17:15",
    durationMinutes: 465,
    priceUsd: 39,
    rating: 4.5,
    amenities: ["Free WiFi", "Power Outlets", "Restroom", "2 Bags Free"],
    seatsLeft: 28
  },

  // --- AZERBAIJAN REGIONAL BUS LINES ---
  {
    operator: "Baku Passenger Terminals (ADY)",
    busNumber: "Baku-Sheki Express",
    origin: "Baku",
    destination: "Sheki",
    departureTime: "09:00",
    arrivalTime: "14:30",
    durationMinutes: 330,
    priceUsd: 6, // $6 equivalent to ~10 AZN
    rating: 4.6,
    amenities: ["Air Conditioning", "WiFi", "Complimentary Water"],
    seatsLeft: 34
  },
  {
    operator: "Baku Passenger Terminals (ADY)",
    busNumber: "Baku-Quba Express",
    origin: "Baku",
    destination: "Quba",
    departureTime: "10:30",
    arrivalTime: "13:00",
    durationMinutes: 150,
    priceUsd: 4, // $4 equivalent to ~7 AZN
    rating: 4.5,
    amenities: ["Air Conditioning", "Complimentary Water", "Audio entertainment"],
    seatsLeft: 40
  },
  {
    operator: "Trans-Caucasus Express",
    busNumber: "Baku-Tbilisi Direct",
    origin: "Baku",
    destination: "Tbilisi",
    departureTime: "21:00",
    arrivalTime: "07:30",
    durationMinutes: 630, // Overnight bus
    priceUsd: 18, // $18 equivalent to ~30 AZN
    rating: 4.2,
    amenities: ["Restroom", "Air Conditioning", "Power Outlets", "Reclining Seats"],
    seatsLeft: 12
  }
];

export async function searchBuses(
  origin: string,
  destination: string,
  date: string,
  passengers: number = 1
): Promise<BusOffer[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const targetOrigin = origin?.toLowerCase() || "";
  const targetDest = destination?.toLowerCase() || "";

  // Dynamic filter based on city matches
  const filtered = BUS_TEMPLATES.filter(
    (b) =>
      (b.origin.toLowerCase().includes(targetOrigin) || targetOrigin.includes(b.origin.toLowerCase())) &&
      (b.destination.toLowerCase().includes(targetDest) || targetDest.includes(b.destination.toLowerCase()))
  );

  if (filtered.length > 0) {
    return filtered.map((b, index) => {
      const priceWithMarkup = Math.ceil(b.priceUsd * 1.15 * passengers);
      return {
        id: `BUS-${index + 4001}`,
        busNumber: b.busNumber,
        operator: b.operator,
        origin: b.origin,
        destination: b.destination,
        departureTime: b.departureTime,
        arrivalTime: b.arrivalTime,
        durationMinutes: b.durationMinutes,
        date: date || new Date().toISOString().split("T")[0],
        priceUsd: priceWithMarkup,
        rating: b.rating,
        amenities: b.amenities,
        seatsLeft: Math.max(0, b.seatsLeft - passengers)
      };
    });
  }

  // Generate dynamic premium bus routes if the city pair is not explicitly templates
  const capitalizedOrigin = origin.charAt(0).toUpperCase() + origin.slice(1);
  const capitalizedDest = destination.charAt(0).toUpperCase() + destination.slice(1);

  return [
    {
      id: "BUS-DYN-5001",
      busNumber: "Greyhound Regional 450",
      operator: "Greyhound",
      origin: capitalizedOrigin || "Boston",
      destination: capitalizedDest || "New York",
      departureTime: "08:30",
      arrivalTime: "13:15",
      durationMinutes: 285,
      date: date || new Date().toISOString().split("T")[0],
      priceUsd: Math.ceil(24 * 1.15 * passengers),
      rating: 4.2,
      amenities: ["WiFi", "Power Outlets", "Restroom"],
      seatsLeft: 30
    },
    {
      id: "BUS-DYN-5002",
      busNumber: "FlixBus Express FLX-330",
      operator: "FlixBus",
      origin: capitalizedOrigin || "Munich",
      destination: capitalizedDest || "Vienna",
      departureTime: "11:00",
      arrivalTime: "16:45",
      durationMinutes: 345,
      date: date || new Date().toISOString().split("T")[0],
      priceUsd: Math.ceil(34 * 1.15 * passengers),
      rating: 4.4,
      amenities: ["Free WiFi", "Power Outlets", "Restroom", "Snacks"],
      seatsLeft: 25
    }
  ];
}
