// lib/location.ts
// Flynatoure Global Airport Geolocator & IATA Mapper

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

// Registry of top global hubs across major regions
export const GLOBAL_AIRPORTS: Airport[] = [
  // --- AZERBAIJAN ---
  { iata: "GYD", name: "Heydar Aliyev Int'l Airport", city: "Baku", country: "Azerbaijan", lat: 40.4675, lon: 50.0467 },
  { iata: "GNJ", name: "Ganja Int'l Airport", city: "Ganja", country: "Azerbaijan", lat: 40.7411, lon: 46.3164 },
  { iata: "NAJ", name: "Nakhchivan Int'l Airport", city: "Nakhchivan", country: "Azerbaijan", lat: 39.1897, lon: 45.4311 },

  // --- NORTH AMERICA (USA & CANADA) ---
  { iata: "JFK", name: "John F. Kennedy Int'l Airport", city: "New York", country: "United States", lat: 40.6413, lon: -73.7781 },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", lat: 40.7769, lon: -73.8740 },
  { iata: "EWR", name: "Newark Liberty Int'l Airport", city: "Newark", country: "United States", lat: 40.6895, lon: -74.1745 },
  { iata: "SFO", name: "San Francisco Int'l Airport", city: "San Francisco", country: "United States", lat: 37.6213, lon: -122.3790 },
  { iata: "LAX", name: "Los Angeles Int'l Airport", city: "Los Angeles", country: "United States", lat: 33.9416, lon: -118.4085 },
  { iata: "ORD", name: "O'Hare Int'l Airport", city: "Chicago", country: "United States", lat: 41.9742, lon: -87.9073 },
  { iata: "MIA", name: "Miami Int'l Airport", city: "Miami", country: "United States", lat: 25.7959, lon: -80.2870 },
  { iata: "DFW", name: "Dallas/Fort Worth Int'l Airport", city: "Dallas", country: "United States", lat: 32.8998, lon: -97.0403 },
  { iata: "IAD", name: "Dulles Int'l Airport", city: "Washington D.C.", country: "United States", lat: 38.9531, lon: -77.4565 },
  { iata: "SEA", name: "Seattle-Tacoma Int'l Airport", city: "Seattle", country: "United States", lat: 47.4502, lon: -122.3088 },
  { iata: "BOS", name: "Logan Int'l Airport", city: "Boston", country: "United States", lat: 42.3656, lon: -71.0096 },
  { iata: "ATL", name: "Hartsfield-Jackson Int'l Airport", city: "Atlanta", country: "United States", lat: 33.6407, lon: -84.4277 },
  { iata: "LAS", name: "Harry Reid Int'l Airport", city: "Las Vegas", country: "United States", lat: 36.0840, lon: -115.1537 },
  { iata: "DEN", name: "Denver Int'l Airport", city: "Denver", country: "United States", lat: 39.8561, lon: -104.6737 },
  { iata: "YYZ", name: "Toronto Pearson Int'l Airport", city: "Toronto", country: "Canada", lat: 43.6777, lon: -79.6248 },
  { iata: "YVR", name: "Vancouver Int'l Airport", city: "Vancouver", country: "Canada", lat: 49.1967, lon: -123.1815 },

  // --- EUROPE ---
  { iata: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", lat: 51.4700, lon: -0.4543 },
  { iata: "LGW", name: "Gatwick Airport", city: "London", country: "United Kingdom", lat: 51.1481, lon: -0.1903 },
  { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", lat: 49.0097, lon: 2.5479 },
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", lat: 50.0379, lon: 8.5622 },
  { iata: "AMS", name: "Schiphol Airport", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lon: 4.7683 },
  { iata: "FCO", name: "Leonardo da Vinci-Fiumicino Airport", city: "Rome", country: "Italy", lat: 41.7999, lon: 12.2462 },
  { iata: "BCN", name: "Barcelona-El Prat Airport", city: "Barcelona", country: "Spain", lat: 41.2974, lon: 2.0833 },
  { iata: "MAD", name: "Adolfo Suárez Madrid-Barajas Airport", city: "Madrid", country: "Spain", lat: 40.4839, lon: -3.5680 },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", lat: 47.4582, lon: 8.5555 },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", lat: 55.6180, lon: 12.6508 },
  { iata: "VIE", name: "Vienna Int'l Airport", city: "Vienna", country: "Austria", lat: 48.1103, lon: 16.5697 },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", lat: 48.3538, lon: 11.7861 },

  // --- TURKEY ---
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", lat: 41.2753, lon: 28.7519 },
  { iata: "SAW", name: "Sabiha Gökçen Int'l Airport", city: "Istanbul", country: "Turkey", lat: 40.8986, lon: 29.3092 },
  { iata: "AYT", name: "Antalya Airport", city: "Antalya", country: "Turkey", lat: 36.8987, lon: 30.8005 },
  { iata: "ADB", name: "Adnan Menderes Airport", city: "Izmir", country: "Turkey", lat: 38.2924, lon: 27.1570 },
  { iata: "ESB", name: "Esenboğa Airport", city: "Ankara", country: "Turkey", lat: 40.1281, lon: 32.9951 },

  // --- MIDDLE EAST ---
  { iata: "DXB", name: "Dubai Int'l Airport", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lon: 55.3657 },
  { iata: "AUH", name: "Zayed Int'l Airport", city: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4330, lon: 54.6511 },
  { iata: "DOH", name: "Hamad Int'l Airport", city: "Doha", country: "Qatar", lat: 25.2731, lon: 51.6081 },
  { iata: "RUH", name: "King Khalid Int'l Airport", city: "Riyadh", country: "Saudi Arabia", lat: 24.9576, lon: 46.6988 },

  // --- ASIA & OCEANIA ---
  { iata: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore", lat: 1.3644, lon: 103.9915 },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", lat: 13.6900, lon: 100.7501 },
  { iata: "NRT", name: "Narita Int'l Airport", city: "Tokyo", country: "Japan", lat: 35.7767, lon: 140.3864 },
  { iata: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan", lat: 35.5494, lon: 139.7798 },
  { iata: "DPS", name: "Ngurah Rai Int'l Airport", city: "Denpasar", country: "Indonesia", lat: -8.7482, lon: 115.1672 },
  { iata: "MLE", name: "Velana Int'l Airport", city: "Male", country: "Maldives", lat: 4.1919, lon: 73.5291 },
  { iata: "ICN", name: "Incheon Int'l Airport", city: "Seoul", country: "South Korea", lat: 37.4602, lon: 126.4407 },
  { iata: "HKG", name: "Hong Kong Int'l Airport", city: "Hong Kong", country: "Hong Kong", lat: 22.3080, lon: 113.9185 },
  { iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", lat: -33.9461, lon: 151.1772 },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", lat: -37.6690, lon: 144.8410 },

  // --- LATIN AMERICA ---
  { iata: "MEX", name: "Benito Juárez Int'l Airport", city: "Mexico City", country: "Mexico", lat: 19.4363, lon: -99.0721 },
  { iata: "GRU", name: "Guarulhos Int'l Airport", city: "Sao Paulo", country: "Brazil", lat: -23.4356, lon: -46.4731 },

  // --- CIS & EASTERN EUROPE ---
  { iata: "TBS", name: "Tbilisi Int'l Airport", city: "Tbilisi", country: "Georgia", lat: 41.6692, lon: 44.9547 },
  { iata: "EVN", name: "Zvartnots Int'l Airport", city: "Yerevan", country: "Armenia", lat: 40.1473, lon: 44.3959 },
  { iata: "SVO", name: "Sheremetyevo Int'l Airport", city: "Moscow", country: "Russia", lat: 55.9726, lon: 37.4146 },
  { iata: "ALA", name: "Almaty Int'l Airport", city: "Almaty", country: "Kazakhstan", lat: 43.3521, lon: 77.0142 },
  { iata: "TAS", name: "Tashkent Int'l Airport", city: "Tashkent", country: "Uzbekistan", lat: 41.2579, lon: 69.2812 },
];

/**
 * Calculates the spherical distance in kilometers between two coordinates using the Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Identifies the nearest primary airport in the registry based on coordinates
 */
export function getNearestAirport(lat: number, lon: number): Airport {
  if (isNaN(lat) || isNaN(lon)) {
    return GLOBAL_AIRPORTS[3]; // Fallback to JFK (New York)
  }

  let nearestAirport = GLOBAL_AIRPORTS[3]; // Default JFK
  let minDistance = Infinity;

  for (const airport of GLOBAL_AIRPORTS) {
    const dist = calculateDistance(lat, lon, airport.lat, airport.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearestAirport = airport;
    }
  }

  return nearestAirport;
}

/**
 * Resolves coordinate positions for country fallback
 */
export function getAirportByCountryCode(countryCode: string | null): Airport {
  if (!countryCode) return GLOBAL_AIRPORTS[3]; // JFK

  const code = countryCode.toUpperCase();
  if (code === "AZ") return GLOBAL_AIRPORTS[0]; // GYD (Baku)
  if (code === "TR") return GLOBAL_AIRPORTS[22]; // IST (Istanbul)
  if (code === "GB") return GLOBAL_AIRPORTS[14]; // LHR (London)
  if (code === "FR") return GLOBAL_AIRPORTS[16]; // CDG (Paris)
  if (code === "GE") return GLOBAL_AIRPORTS[39]; // TBS (Tbilisi)
  if (code === "AE") return GLOBAL_AIRPORTS[27]; // DXB (Dubai)
  if (code === "CA") return GLOBAL_AIRPORTS[12]; // YYZ (Toronto)

  return GLOBAL_AIRPORTS[3]; // Default: JFK
}
