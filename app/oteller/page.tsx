import { getSupabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Otel Rezervasiyası | Natoure",
  description: "Antalya, Dubai, İstanbul, Bali və daha çox istiqamətdə ən yaxşı otel qiymətləri. Natoure ilə sərfəli otel rezervasiyası.",
};

export const revalidate = 3600; // 1 saat cache

interface Hotel {
  id: string;
  hotel_key: string;
  hotel_name: string;
  destination: string;
  checkin: string;
  checkout: string;
  price_usd: number;
  stars: number;
  room_type: string;
  meal: string;
  updated_at: string;
  status: string;
}

const AZN_RATE = 1.70;

function starsLabel(n: number) {
  return "★".repeat(Math.min(5, Math.max(1, n)));
}

function mealLabel(meal: string): string {
  const MAP: Record<string, string> = {
    "breakfast": "Səhər yeməyi",
    "half_board": "Yarım pansion",
    "full_board": "Tam pansion",
    "all_inclusive": "Hər şey daxil",
    "room_only": "Yalnız otaq",
    "no_meals": "Yemək daxil deyil",
  };
  return MAP[meal?.toLowerCase()] ?? meal ?? "—";
}

function nights(checkin: string, checkout: string): number {
  return Math.max(1, Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000
  ));
}

const DEST_ICONS: Record<string, string> = {
  "istanbul":  "🕌",
  "antalya":   "🌊",
  "dubai":     "🏙️",
  "bali":      "🌴",
  "barcelona": "🗼",
  "paris":     "🗼",
  "rome":      "🏛️",
  "maldives":  "🐚",
  "maldiv":    "🐚",
  "sharm":     "🌅",
};

function destIcon(dest: string): string {
  const key = dest.toLowerCase().split(/[, ]/)[0];
  for (const [k, v] of Object.entries(DEST_ICONS)) {
    if (key.includes(k)) return v;
  }
  return "📍";
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const n = nights(hotel.checkin, hotel.checkout);
  const priceAzn = Math.round(hotel.price_usd * AZN_RATE);
  const perNight = Math.round(priceAzn / n);
  const waMsg = encodeURIComponent(
    `Salam! ${hotel.hotel_name} — ${hotel.destination}, ${hotel.checkin} tarixinə otel rezervasiyası haqqında məlumat almaq istəyirəm.`
  );
  const checkinStr = new Date(hotel.checkin).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
  const checkoutStr = new Date(hotel.checkout).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Stars bar */}
      <div className="h-1.5 bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${(hotel.stars / 5) * 100}%` }} />
      <div className="p-5">
        {/* Stars + Name */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-amber-400 text-sm tracking-tight">{starsLabel(hotel.stars)}</span>
          {hotel.meal && hotel.meal !== "room_only" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              {mealLabel(hotel.meal)}
            </span>
          )}
        </div>
        <h3 className="font-bold text-slate-900 leading-snug mb-3">{hotel.hotel_name}</h3>

        {/* Dates + Room */}
        <div className="text-xs text-slate-500 space-y-1 mb-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            {checkinStr} — {checkoutStr} ({n} gecə)
          </div>
          {hotel.room_type && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/>
              </svg>
              {hotel.room_type}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-sky-600">{priceAzn.toLocaleString()}</span>
            <span className="text-sm text-slate-500 ml-1">AZN</span>
            <p className="text-xs text-slate-400">≈ {perNight} AZN/gecə</p>
          </div>
          <a
            href={`https://wa.me/994517769632?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
          >
            Rezervasiya
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function OtellerPage({
  searchParams,
}: {
  searchParams: Promise<{ dest?: string }>;
}) {
  const { dest } = await searchParams;

  const supabase = getSupabaseAdmin();
  const { data: hotels } = await supabase
    .from("hotels")
    .select("*")
    .eq("status", "active")
    .order("stars", { ascending: false })
    .returns<Hotel[]>();

  const allHotels = hotels ?? [];

  // Unikal destinasiyalar
  const destinations = [...new Set(allHotels.map((h) => h.destination))].sort();

  // Aktiv filter
  const activeFilter = dest || "all";
  const filtered = activeFilter === "all"
    ? allHotels
    : allHotels.filter((h) => h.destination.toLowerCase() === activeFilter.toLowerCase());

  // Destinasiyaya görə qruplaşdır
  const grouped: Record<string, Hotel[]> = {};
  for (const h of filtered) {
    if (!grouped[h.destination]) grouped[h.destination] = [];
    grouped[h.destination].push(h);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-sky-600 text-sm font-semibold mb-2 uppercase tracking-widest">Otel Rezervasiyası</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Ən Yaxşı Otel Qiymətləri
          </h1>
          <p className="text-slate-500 max-w-xl">
            RateHawk vasitəsilə hər gün yenilənən real qiymətlər. Rezervasiya üçün WhatsApp-a yazın.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {allHotels.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🏨</p>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Otel məlumatları yüklənir</h2>
            <p className="text-slate-500 mb-6">Sistem hər gün saat 08:00-da otel qiymətlərini yeniləyir.</p>
            <a
              href="https://wa.me/994517769632?text=Salam%2C%20otel%20rezervasiyası%20haqqında%20məlumat%20almaq%20istəyirəm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
            >
              WhatsApp-da Soruşun
            </a>
          </div>
        ) : (
          <>
            {/* Destination filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href="/oteller"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === "all" ? "bg-sky-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300"}`}
              >
                Hamısı ({allHotels.length})
              </Link>
              {destinations.map((d) => (
                <Link
                  key={d}
                  href={`/oteller?dest=${encodeURIComponent(d)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === d ? "bg-sky-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-sky-300"}`}
                >
                  {destIcon(d)} {d} ({allHotels.filter((h) => h.destination === d).length})
                </Link>
              ))}
            </div>

            {/* Hotel groups */}
            {Object.entries(grouped).map(([destName, destHotels]) => (
              <section key={destName} className="mb-12">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-5">
                  <span>{destIcon(destName)}</span>
                  {destName}
                  <span className="text-sm font-normal text-slate-400">({destHotels.length} otel)</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {destHotels.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} />
                  ))}
                </div>
              </section>
            ))}

            {/* CTA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mt-4">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Axtardığınızı Tapmadınız?</h3>
              <p className="text-slate-500 text-sm mb-5">
                Fərdi istək üçün komandamız sizə uyğun oteli tapır.
              </p>
              <a
                href="https://wa.me/994517769632?text=Salam%2C%20xüsusi%20otel%20sorğusu%20ilə%20yardım%20istəyirəm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
              >
                WhatsApp-da Yazın
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
