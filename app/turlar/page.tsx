"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Tour {
  id: string;
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
}

const DEST_MAP: Record<string, { label: string; flag: string; category: string }> = {
  "Türkiyə":    { label: "Türkiyə",      flag: "🇹🇷", category: "turkiye" },
  "Istanbul":   { label: "Türkiyə",      flag: "🇹🇷", category: "turkiye" },
  "Antalya":    { label: "Türkiyə",      flag: "🇹🇷", category: "turkiye" },
  "Dubai":      { label: "BƏƏ",          flag: "🇦🇪", category: "ereb" },
  "BƏƏ":        { label: "BƏƏ",          flag: "🇦🇪", category: "ereb" },
  "Misir":      { label: "Misir",        flag: "🇪🇬", category: "ereb" },
  "Ərəbistan":  { label: "Ərəbistan",    flag: "🇸🇦", category: "ereb" },
  "Fransa":     { label: "Fransa",       flag: "🇫🇷", category: "avropa" },
  "İtaliya":    { label: "İtaliya",      flag: "🇮🇹", category: "avropa" },
  "İspaniya":   { label: "İspaniya",     flag: "🇪🇸", category: "avropa" },
  "Yunanıstan": { label: "Yunanıstan",   flag: "🇬🇷", category: "avropa" },
  "Avstriya":   { label: "Avstriya",     flag: "🇦🇹", category: "avropa" },
  "Hollandiya": { label: "Hollandiya",   flag: "🇳🇱", category: "avropa" },
};

function getDestInfo(destination: string) {
  const key = Object.keys(DEST_MAP).find((k) =>
    destination.toLowerCase().includes(k.toLowerCase())
  );
  return key ? DEST_MAP[key] : { label: destination, flag: "✈️", category: "diger" };
}

function getDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return `${days} gün / ${days - 1} gecə`;
}

const categories = [
  { id: "hamisi",  label: "Hamısı" },
  { id: "turkiye", label: "🇹🇷 Türkiyə" },
  { id: "ereb",    label: "🇦🇪 Ərəb Ölkələri" },
  { id: "avropa",  label: "🇪🇺 Avropa" },
];

export default function TurlarPage() {
  const [active, setActive] = useState("hamisi");
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tours")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTours(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = tours.filter((t) => {
    if (active === "hamisi") return true;
    const info = getDestInfo(t.destination);
    return info.category === active;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0057A8] to-[#004a90] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Bütün Turlar</h1>
        <p className="text-blue-200 max-w-xl mx-auto">Türkiyə, Ərəb ölkələri və Avropa istiqamətlərindəki bütün tur paketlərimiz</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                active === cat.id
                  ? "bg-[#0057A8] text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#0057A8]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-gray-400">Turlar yüklənir...</div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            Bu kateqoriyada hal-hazırda aktiv tur yoxdur.
          </div>
        )}

        {/* Tours Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((tour) => {
              const info = getDestInfo(tour.destination);
              const duration = getDuration(tour.start_date, tour.end_date);
              const seatsLeft = tour.max_seats - tour.booked_seats;
              const isAlmostFull = seatsLeft <= 3 && seatsLeft > 0;

              return (
                <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  {isAlmostFull ? (
                    <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 text-center">
                      Son {seatsLeft} yer!
                    </div>
                  ) : (
                    <div className="h-1 bg-gradient-to-r from-[#0057A8] to-[#009B77]" />
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                      <span>{info.flag}</span>
                      <span>{tour.destination}</span>
                    </div>
                    <h3 className="font-bold text-[#1a1a2e] text-lg mb-1">{tour.name}</h3>
                    {duration && <p className="text-sm text-gray-400 mb-2">⏱ {duration}</p>}
                    {tour.hotel && (
                      <p className="text-xs text-gray-500 mb-3">🏨 {tour.hotel}</p>
                    )}
                    {tour.description && (
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{tour.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-bold text-[#0057A8]">{tour.price_azn} AZN</span>
                        <span className="text-xs text-gray-400 ml-1">/nəfər</span>
                      </div>
                      <Link
                        href="/elaqe"
                        className="bg-[#0057A8] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#004a90] transition-colors"
                      >
                        Sifariş Et
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#0057A8] to-[#009B77] rounded-2xl p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">İstədiyiniz Turu Tapmadınız?</h3>
          <p className="text-blue-100 mb-6">Fərdi tur paketləri də hazırlayırıq. Bizimlə əlaqə saxlayın.</p>
          <Link href="/elaqe" className="inline-block bg-[#D4AF37] text-[#0057A8] font-bold px-8 py-3 rounded-full hover:bg-yellow-400 transition-colors">
            Fərdi Tur Sifariş Et
          </Link>
        </div>
      </div>
    </div>
  );
}
