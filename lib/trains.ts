// lib/trains.ts
// Flynatoure Rail Search & Routing Engine (USD Primary)

export interface TrainOffer {
  id: string;
  trainNumber: string;
  operator: string;
  trainType: string; // High-Speed, Express, Regional
  origin: string;
  destination: string;
  departureTime: string; // HH:MM
  arrivalTime: string;   // HH:MM
  durationMinutes: number;
  date: string;
  priceUsd: number;
  rating: number;
  classes: { className: string; priceUsd: number; seatsLeft: number }[];
  co2SavedKg: number; // Eco-friendly metric
}

const TRAIN_TEMPLATES = [
  // --- US NORTHEAST CORRIDOR (Amtrak) ---
  {
    operator: "Amtrak",
    trainNumber: "Acela Express 2153",
    trainType: "High-Speed Rail",
    origin: "New York",
    destination: "Washington D.C.",
    departureTime: "08:00",
    arrivalTime: "10:55",
    durationMinutes: 175,
    priceUsd: 145,
    rating: 4.8,
    co2SavedKg: 42.5,
    classes: [
      { className: "Business Class", priceUsd: 145, seatsLeft: 12 },
      { className: "First Class Suite", priceUsd: 280, seatsLeft: 4 }
    ]
  },
  {
    operator: "Amtrak",
    trainNumber: "Northeast Regional 172",
    trainType: "Express Train",
    origin: "New York",
    destination: "Washington D.C.",
    departureTime: "09:30",
    arrivalTime: "12:50",
    durationMinutes: 200,
    priceUsd: 79,
    rating: 4.4,
    co2SavedKg: 41.2,
    classes: [
      { className: "Coach Class", priceUsd: 79, seatsLeft: 48 },
      { className: "Business Class", priceUsd: 119, seatsLeft: 18 }
    ]
  },
  {
    operator: "Amtrak",
    trainNumber: "Acela Express 2234",
    trainType: "High-Speed Rail",
    origin: "New York",
    destination: "Boston",
    departureTime: "07:15",
    arrivalTime: "10:45",
    durationMinutes: 210,
    priceUsd: 135,
    rating: 4.7,
    co2SavedKg: 51.0,
    classes: [
      { className: "Business Class", priceUsd: 135, seatsLeft: 9 },
      { className: "First Class", priceUsd: 260, seatsLeft: 2 }
    ]
  },

  // --- EUROPEAN HIGH-SPEED (Eurostar, TGV) ---
  {
    operator: "Eurostar",
    trainNumber: "ES 9018",
    trainType: "High-Speed Rail",
    origin: "London",
    destination: "Paris",
    departureTime: "10:24",
    arrivalTime: "13:47",
    durationMinutes: 143,
    priceUsd: 120,
    rating: 4.9,
    co2SavedKg: 64.2,
    classes: [
      { className: "Standard Class", priceUsd: 120, seatsLeft: 35 },
      { className: "Standard Premier", priceUsd: 180, seatsLeft: 14 },
      { className: "Business Premier Suite", priceUsd: 310, seatsLeft: 6 }
    ]
  },
  {
    operator: "Eurostar",
    trainNumber: "ES 9126",
    trainType: "High-Speed Rail",
    origin: "London",
    destination: "Amsterdam",
    departureTime: "08:16",
    arrivalTime: "13:13",
    durationMinutes: 297,
    priceUsd: 140,
    rating: 4.8,
    co2SavedKg: 85.0,
    classes: [
      { className: "Standard Class", priceUsd: 140, seatsLeft: 22 },
      { className: "Standard Premier", priceUsd: 210, seatsLeft: 8 },
      { className: "Business Premier Suite", priceUsd: 340, seatsLeft: 3 }
    ]
  },

  // --- JAPAN SHINKANSEN (Bullet Train) ---
  {
    operator: "JR Central",
    trainNumber: "Nozomi 213 (Bullet Train)",
    trainType: "High-Speed Rail",
    origin: "Tokyo",
    destination: "Osaka",
    departureTime: "09:00",
    arrivalTime: "11:30",
    durationMinutes: 150,
    priceUsd: 130,
    rating: 4.95,
    co2SavedKg: 95.3,
    classes: [
      { className: "Ordinary Seat", priceUsd: 130, seatsLeft: 80 },
      { className: "Green Car (Premium)", priceUsd: 185, seatsLeft: 24 },
      { className: "Gran Class (Luxury)", priceUsd: 290, seatsLeft: 6 }
    ]
  },

  // --- AZERBAIJAN RAILWAYS (Stadler KİSS) ---
  {
    operator: "ADY (Azerbaijan Railways)",
    trainNumber: "Stadler High-Speed 702",
    trainType: "High-Speed Rail",
    origin: "Baku",
    destination: "Ganja",
    departureTime: "08:45",
    arrivalTime: "12:15",
    durationMinutes: 210,
    priceUsd: 20, // $20 equivalent to ~34 AZN
    rating: 4.8,
    co2SavedKg: 30.5,
    classes: [
      { className: "Standard Coach", priceUsd: 20, seatsLeft: 120 },
      { className: "Business Class", priceUsd: 35, seatsLeft: 32 },
      { className: "First Class", priceUsd: 55, seatsLeft: 8 }
    ]
  },
  {
    operator: "ADY (Azerbaijan Railways)",
    trainNumber: "ADY Express 044",
    trainType: "Express Train",
    origin: "Baku",
    destination: "Tbilisi",
    departureTime: "22:00",
    arrivalTime: "08:30",
    durationMinutes: 630, // Overnight sleeper
    priceUsd: 25, // $25 equivalent to ~42 AZN
    rating: 4.6,
    co2SavedKg: 52.8,
    classes: [
      { className: "Coupe Sleeper (4-berth)", priceUsd: 25, seatsLeft: 24 },
      { className: "SV Sleeper (2-berth)", priceUsd: 45, seatsLeft: 6 }
    ]
  }
];

export async function searchTrains(
  origin: string,
  destination: string,
  date: string,
  passengers: number = 1
): Promise<TrainOffer[]> {
  // Simulate database lookups
  await new Promise((resolve) => setTimeout(resolve, 400));

  const targetOrigin = origin?.toLowerCase() || "";
  const targetDest = destination?.toLowerCase() || "";

  // Dynamic filter based on string matches
  const filtered = TRAIN_TEMPLATES.filter(
    (t) =>
      (t.origin.toLowerCase().includes(targetOrigin) || targetOrigin.includes(t.origin.toLowerCase())) &&
      (t.destination.toLowerCase().includes(targetDest) || targetDest.includes(t.destination.toLowerCase()))
  );

  // Return filtered matches, or return a dynamic generated suite if they requested a custom city pair!
  if (filtered.length > 0) {
    return filtered.map((t, index) => {
      const priceWithMarkup = Math.ceil(t.priceUsd * 1.15 * passengers);
      return {
        id: `TRAIN-${index + 2001}`,
        trainNumber: t.trainNumber,
        operator: t.operator,
        trainType: t.trainType,
        origin: t.origin,
        destination: t.destination,
        departureTime: t.departureTime,
        arrivalTime: t.arrivalTime,
        durationMinutes: t.durationMinutes,
        date: date || new Date().toISOString().split("T")[0],
        priceUsd: priceWithMarkup,
        rating: t.rating,
        co2SavedKg: Math.round(t.co2SavedKg * passengers * 10) / 10,
        classes: t.classes.map((c) => ({
          className: c.className,
          priceUsd: Math.ceil(c.priceUsd * 1.15 * passengers),
          seatsLeft: Math.max(0, c.seatsLeft - passengers)
        }))
      };
    });
  }

  // Generate dynamic premium rail routes if the city pair is not explicitly templates
  // This is a premium touch! A user searching for "Boston" to "Washington" will get a custom Amtrak route generated!
  const capitalizedOrigin = origin.charAt(0).toUpperCase() + origin.slice(1);
  const capitalizedDest = destination.charAt(0).toUpperCase() + destination.slice(1);

  return [
    {
      id: "TRAIN-DYN-3001",
      trainNumber: "Amtrak Regional 117",
      operator: "Amtrak",
      trainType: "Express Rail Link",
      origin: capitalizedOrigin || "New York",
      destination: capitalizedDest || "Boston",
      departureTime: "08:15",
      arrivalTime: "11:45",
      durationMinutes: 210,
      date: date || new Date().toISOString().split("T")[0],
      priceUsd: Math.ceil(85 * 1.15 * passengers),
      rating: 4.5,
      co2SavedKg: 38.4 * passengers,
      classes: [
        { className: "Coach Class", priceUsd: Math.ceil(85 * 1.15 * passengers), seatsLeft: 42 },
        { className: "Business Class", priceUsd: Math.ceil(130 * 1.15 * passengers), seatsLeft: 12 }
      ]
    },
    {
      id: "TRAIN-DYN-3002",
      trainNumber: "InterCity Express ICE 541",
      operator: "Deutsche Bahn",
      trainType: "High-Speed Rail",
      origin: capitalizedOrigin || "Frankfurt",
      destination: capitalizedDest || "Munich",
      departureTime: "14:10",
      arrivalTime: "17:25",
      durationMinutes: 195,
      date: date || new Date().toISOString().split("T")[0],
      priceUsd: Math.ceil(95 * 1.15 * passengers),
      rating: 4.7,
      co2SavedKg: 44.2 * passengers,
      classes: [
        { className: "2nd Class Standard", priceUsd: Math.ceil(95 * 1.15 * passengers), seatsLeft: 60 },
        { className: "1st Class Premium", priceUsd: Math.ceil(155 * 1.15 * passengers), seatsLeft: 18 }
      ]
    }
  ];
}
