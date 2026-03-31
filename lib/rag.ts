import { getSupabaseAdmin } from "./supabase";

interface Tour {
  name: string;
  destination: string;
  price_azn: number;
  price_usd: number | null;
  start_date: string | null;
  end_date: string | null;
  max_seats: number;
  booked_seats: number;
  hotel: string | null;
  description: string | null;
  includes: string[] | null;
}

// 5 dəqiqə cache
let cachedTours: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// Müştərinin mesajından destinasiya axtarır
function extractDestination(message: string): string | null {
  const keywords: Record<string, string[]> = {
    "Türkiyə": ["türkiyə", "turkey", "antalya", "istanbul", "bodrum", "kapadokya", "istanbula", "antalyaya"],
    "Dubai": ["dubai", "dubay", "əmirliklər", "uae"],
    "Misir": ["misir", "şarm", "qahirə", "egypt"],
    "İtaliya": ["italiya", "rom", "venesia", "florensiya", "italy"],
    "İspaniya": ["ispaniya", "barselona", "madrid", "spain"],
    "Fransa": ["fransa", "paris", "france"],
    "Yunanıstan": ["yunanıstan", "santorini", "mikonos", "greece"],
    "Avropa": ["avropa", "europe", "avstriya", "çexiya", "praqa", "vyana"],
    "Ərəbistan": ["abu dabi", "abu-dabi", "şeyx"],
  };

  const lower = message.toLowerCase();
  for (const [dest, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) return dest;
  }
  return null;
}

export async function getToursContext(userMessage?: string): Promise<string> {
  // Cache yoxla
  if (cachedTours && Date.now() - cacheTime < CACHE_TTL && !userMessage) {
    return cachedTours;
  }

  try {
    const admin = getSupabaseAdmin();

    let query = admin
      .from("tours")
      .select("name, destination, price_azn, price_usd, start_date, end_date, max_seats, booked_seats, hotel, description, includes")
      .eq("is_active", true)
      .order("start_date", { ascending: true });

    // Smart filter: müştəri müəyyən destinasiya haqqında soruşubsa yalnız onu ver
    const destination = userMessage ? extractDestination(userMessage) : null;
    if (destination) {
      query = query.ilike("destination", `%${destination}%`);
    }

    const { data: tours } = await query;

    if (!tours || tours.length === 0) {
      cachedTours = "";
      cacheTime = Date.now();
      return "";
    }

    const lines = (tours as Tour[]).map((t) => {
      const available = t.max_seats - t.booked_seats;
      const parts = [
        `🌍 ${t.name} (${t.destination})`,
        `   💰 Qiymət: ${t.price_azn} AZN${t.price_usd ? ` / ${t.price_usd} USD` : ""}`,
        `   🏨 Otel: ${t.hotel || "məlum deyil"}`,
      ];
      if (t.start_date) {
        const start = new Date(t.start_date).toLocaleDateString("az-AZ");
        const end = t.end_date ? new Date(t.end_date).toLocaleDateString("az-AZ") : "?";
        parts.push(`   📅 Tarix: ${start} — ${end}`);
      }
      parts.push(`   👥 Boş yer: ${available > 0 ? available : "YER YOX"} / ${t.max_seats}`);
      if (t.description) parts.push(`   📝 ${t.description}`);
      if (t.includes?.length) parts.push(`   ✅ Daxildir: ${t.includes.join(", ")}`);
      return parts.join("\n");
    });

    // Gizli paketləri də əlavə et
    let pkgQuery = admin
      .from("private_packages")
      .select("*")
      .eq("is_active", true);

    if (destination) {
      pkgQuery = pkgQuery.ilike("destination", `%${destination}%`);
    }

    const { data: packages } = await pkgQuery;

    const typeLabel: Record<string, string> = {
      combo: "Kombo (Uçuş + Otel)",
      flight_only: "Yalnız Uçuş",
      hotel_only: "Yalnız Otel",
    };

    const pkgLines = (packages || []).map((p) => {
      const parts = [
        `🎁 ${p.name} [GİZLİ PAKET] (${p.destination})`,
        `   📦 Növ: ${typeLabel[p.package_type] || p.package_type}`,
        `   💰 Qiymət: ${p.price_azn.toLocaleString()} AZN${p.price_usd ? ` (~$${p.price_usd.toLocaleString()})` : ""}`,
      ];
      if (p.duration_nights) parts.push(`   📅 Müddət: ${p.duration_nights} gecə`);
      if (p.flight_info) parts.push(`   ✈️ Uçuş: ${p.flight_info}`);
      if (p.hotel_name) parts.push(`   🏨 Otel: ${p.hotel_name}${p.hotel_stars ? " " + "★".repeat(p.hotel_stars) : ""}`);
      if (p.includes) parts.push(`   ✅ Daxildir: ${p.includes}`);
      if (p.excludes) parts.push(`   ❌ Daxil deyil: ${p.excludes}`);
      if (p.valid_until) parts.push(`   ⏰ Son tarix: ${new Date(p.valid_until).toLocaleDateString("az-AZ")}`);
      return parts.join("\n");
    });

    const allLines = [...lines, ...pkgLines];

    cachedTours = allLines.join("\n\n");
    cacheTime = Date.now();
    return cachedTours;
  } catch {
    return "";
  }
}
