/**
 * RAG — Retrieval-Augmented Generation
 * 1. DB-dən aktiv turlar + gizli paketlər
 * 2. pgvector semantic axtarış (FAQ, destinasiyalar, şirkət məlumatları)
 * Hər ikisi birləşdirilərək AI agentə context kimi verilir
 */

import { getSupabaseAdmin } from "./supabase";
import { searchKnowledge } from "./knowledge";

interface Tour {
  name:        string;
  destination: string;
  price_azn:   number;
  price_usd:   number | null;
  start_date:  string | null;
  end_date:    string | null;
  max_seats:   number;
  booked_seats: number;
  hotel:       string | null;
  description: string | null;
  includes:    string[] | null;
}

// 5 dəqiqə cache
let cachedTours: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// Müştərinin mesajından destinasiya axtarır
function extractDestination(message: string): string | null {
  const keywords: Record<string, string[]> = {
    "Türkiyə":    ["türkiyə", "turkey", "antalya", "istanbul", "bodrum", "kapadokya", "istanbula", "antalyaya"],
    "Dubai":      ["dubai", "dubay", "əmirliklər", "uae"],
    "Misir":      ["misir", "şarm", "qahirə", "egypt", "hurgada", "hurghada"],
    "İtaliya":    ["italiya", "rom", "venesia", "florensiya", "italy"],
    "İspaniya":   ["ispaniya", "barselona", "madrid", "spain"],
    "Fransa":     ["fransa", "paris", "france"],
    "Yunanıstan": ["yunanıstan", "santorini", "mikonos", "greece"],
    "Avropa":     ["avropa", "europe", "avstriya", "çexiya", "praqa", "vyana"],
    "Ərəbistan":  ["abu dabi", "abu-dabi", "şeyx"],
    "Bali":       ["bali", "indoneziya"],
    "Tailand":    ["tailand", "thailand", "bangkok", "phuket", "pattaya"],
  };

  const lower = message.toLowerCase();
  for (const [dest, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) return dest;
  }
  return null;
}

// ─── 1. Aktiv turlar + gizli paketlər (DB-dən) ───────────────────────────────

async function getToursFromDB(userMessage?: string): Promise<string> {
  if (cachedTours && Date.now() - cacheTime < CACHE_TTL && !userMessage) {
    return cachedTours;
  }

  try {
    const admin = getSupabaseAdmin();
    const destination = userMessage ? extractDestination(userMessage) : null;

    let query = admin
      .from("tours")
      .select("name, destination, price_azn, price_usd, start_date, end_date, max_seats, booked_seats, hotel, description, includes")
      .eq("is_active", true)
      .order("start_date", { ascending: true });

    if (destination) query = query.ilike("destination", `%${destination}%`);

    const { data: tours } = await query;

    const lines = (tours as Tour[] || []).map((t) => {
      const available = t.max_seats - t.booked_seats;
      const parts = [
        `${t.name} (${t.destination})`,
        `  Qiymət: ${t.price_azn} AZN${t.price_usd ? ` / ${t.price_usd} USD` : ""}`,
        `  Otel: ${t.hotel || "məlum deyil"}`,
      ];
      if (t.start_date) {
        const start = new Date(t.start_date).toLocaleDateString("az-AZ");
        const end   = t.end_date ? new Date(t.end_date).toLocaleDateString("az-AZ") : "?";
        parts.push(`  Tarix: ${start} — ${end}`);
      }
      parts.push(`  Boş yer: ${available > 0 ? available : "YER YOX"}`);
      if (t.description) parts.push(`  ${t.description}`);
      if (t.includes?.length) parts.push(`  Daxildir: ${t.includes.join(", ")}`);
      return parts.join("\n");
    });

    // Gizli paketlər
    let pkgQuery = admin.from("private_packages").select("*").eq("is_active", true);
    if (destination) pkgQuery = pkgQuery.ilike("destination", `%${destination}%`);
    const { data: packages } = await pkgQuery;

    const typeLabel: Record<string, string> = {
      combo: "Kombo (Uçuş + Otel)",
      flight_only: "Yalnız Uçuş",
      hotel_only: "Yalnız Otel",
    };

    const pkgLines = (packages || []).map((p) => {
      const parts = [
        `${p.name} [GİZLİ PAKET] (${p.destination})`,
        `  Növ: ${typeLabel[p.package_type] || p.package_type}`,
        `  Qiymət: ${p.price_azn.toLocaleString()} AZN`,
      ];
      if (p.duration_nights) parts.push(`  Müddət: ${p.duration_nights} gecə`);
      if (p.flight_info)     parts.push(`  Uçuş: ${p.flight_info}`);
      if (p.hotel_name)      parts.push(`  Otel: ${p.hotel_name}${p.hotel_stars ? " " + "★".repeat(p.hotel_stars) : ""}`);
      if (p.includes)        parts.push(`  Daxildir: ${p.includes}`);
      if (p.excludes)        parts.push(`  Daxil deyil: ${p.excludes}`);
      if (p.valid_until)     parts.push(`  Son tarix: ${new Date(p.valid_until).toLocaleDateString("az-AZ")}`);
      return parts.join("\n");
    });

    const result = [...lines, ...pkgLines].join("\n\n");
    if (!userMessage) {
      cachedTours = result;
      cacheTime   = Date.now();
    }
    return result;
  } catch {
    return "";
  }
}

// ─── 2. Semantic knowledge search ─────────────────────────────────────────────

async function getSemanticContext(query: string): Promise<string> {
  if (!process.env.VOYAGE_API_KEY) return "";

  try {
    const chunks = await searchKnowledge(query, 4);
    if (!chunks.length) return "";

    return chunks
      .filter(c => (c.score ?? 0) > 0.6)  // yalnız uyğun nəticələr
      .map(c => c.content)
      .join("\n\n");
  } catch {
    return "";
  }
}

// ─── Ana funksiya: hər ikisini birləşdir ─────────────────────────────────────

export async function getToursContext(userMessage?: string): Promise<string> {
  const [dbContext, semanticContext] = await Promise.all([
    getToursFromDB(userMessage),
    userMessage ? getSemanticContext(userMessage) : Promise.resolve(""),
  ]);

  const parts: string[] = [];

  if (dbContext)       parts.push(`=== AKTİV TURLAR VƏ PAKETLƏR ===\n${dbContext}`);
  if (semanticContext) parts.push(`=== ƏLAVƏ MƏLUMAT ===\n${semanticContext}`);

  return parts.join("\n\n");
}
