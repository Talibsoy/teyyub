"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { waLink } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";

interface Tour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  end_date: string | null;
  max_seats: number;
  booked_seats: number;
  hotel: string | null;
  description: string | null;
}

function getDuration(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function getDurationLabel(start: string | null, end: string | null): string {
  const d = getDuration(start, end);
  if (!d) return "";
  return `${d} gün / ${d - 1} gecə`;
}

const categories = [
  { id: "hamisi",  label: "Hamısı" },
  { id: "turkiye", label: "🇹🇷 Türkiyə" },
  { id: "ereb",    label: "🇦🇪 Ərəb" },
  { id: "misir",   label: "🇪🇬 Misir" },
  { id: "avropa",  label: "🇪🇺 Avropa" },
];

const durations = [
  { id: "hamisi", label: "Hamısı" },
  { id: "1-5",    label: "1–5 gün" },
  { id: "6-8",    label: "6–8 gün" },
  { id: "9+",     label: "9+ gün" },
];

const DEST_CATEGORY: Record<string, string> = {
  "türkiyə": "turkiye", "istanbul": "turkiye", "antalya": "turkiye", "bodrum": "turkiye",
  "dubai": "ereb", "bəə": "ereb", "ərəb": "ereb", "əbu": "ereb",
  "misir": "misir", "şarm": "misir", "hurqada": "misir",
  "fransa": "avropa", "italiya": "avropa", "ispaniya": "avropa", "avropa": "avropa",
};

function getCategory(destination: string): string {
  const d = destination.toLowerCase();
  for (const [key, cat] of Object.entries(DEST_CATEGORY)) {
    if (d.includes(key)) return cat;
  }
  return "diger";
}

export default function TurlarPage() {
  const [active, setActive]       = useState("hamisi");
  const [durFilter, setDurFilter] = useState("hamisi");
  const [search, setSearch]       = useState("");
  const [maxPrice, setMaxPrice]   = useState("");
  const [tours, setTours]         = useState<Tour[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase.from("tours").select("*").eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setTours(data || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return tours.filter((t) => {
      // Kateqoriya
      if (active !== "hamisi" && getCategory(t.destination) !== active) return false;

      // Axtarış
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.destination.toLowerCase().includes(q)) return false;
      }

      // Maksimum qiymət
      if (maxPrice && t.price_azn > Number(maxPrice)) return false;

      // Müddət
      if (durFilter !== "hamisi") {
        const d = getDuration(t.start_date, t.end_date);
        if (durFilter === "1-5"  && !(d >= 1 && d <= 5)) return false;
        if (durFilter === "6-8"  && !(d >= 6 && d <= 8)) return false;
        if (durFilter === "9+"   && d < 9) return false;
      }

      return true;
    });
  }, [tours, active, search, maxPrice, durFilter]);

  const hasFilters = search || maxPrice || active !== "hamisi" || durFilter !== "hamisi";

  function clearFilters() {
    setSearch(""); setMaxPrice(""); setActive("hamisi"); setDurFilter("hamisi");
  }

  return (
    <div style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 py-12 md:py-16 text-center" style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Bütün Turlar</h1>
        <p className="text-sm" style={{ color: "#666" }}>Türkiyə, Ərəb ölkələri, Misir və Avropa istiqamətlərindəki bütün tur paketlərimiz</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Axtarış + Qiymət */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#555" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Tur adı və ya istiqamət axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#fff" }}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#555" }}>Maks.</span>
            <input
              type="number"
              placeholder="Qiymət (AZN)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="pl-12 pr-4 py-2.5 rounded-xl text-sm outline-none w-full sm:w-44"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#fff" }}
            />
          </div>
        </div>

        {/* Kateqoriya filtri */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActive(cat.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={active === cat.id
                ? { background: "#D4AF37", color: "#000" }
                : { background: "#111", color: "#aaa", border: "1px solid #1a1a1a" }}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Müddət filtri */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {durations.map((d) => (
            <button key={d.id} onClick={() => setDurFilter(d.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={durFilter === d.id
                ? { background: "#333", color: "#D4AF37", border: "1px solid #D4AF37" }
                : { background: "#111", color: "#666", border: "1px solid #1a1a1a" }}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Nəticə sayı + sil */}
        {!loading && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm" style={{ color: "#555" }}>
              {filtered.length} tur tapıldı
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs underline" style={{ color: "#D4AF37" }}>
                Filterləri sil
              </button>
            )}
          </div>
        )}

        {loading && <div className="text-center py-16" style={{ color: "#555" }}>Yüklənir...</div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p style={{ color: "#555" }} className="mb-3">Bu filterlərə uyğun tur tapılmadı.</p>
            <button onClick={clearFilters} className="text-sm underline" style={{ color: "#D4AF37" }}>Filterləri sil</button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((tour) => {
              const durationLabel = getDurationLabel(tour.start_date, tour.end_date);
              const seatsLeft = tour.max_seats - tour.booked_seats;
              const almostFull = seatsLeft <= 3 && seatsLeft > 0;
              return (
                <div key={tour.id} className="rounded-xl flex flex-col overflow-hidden" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                  {almostFull && (
                    <div className="text-xs font-bold text-center py-1.5" style={{ background: "#ef4444", color: "#fff" }}>
                      Son {seatsLeft} yer!
                    </div>
                  )}
                  <div className="p-4 flex-1">
                    <p className="text-xs mb-1" style={{ color: "#666" }}>{tour.destination}</p>
                    <h3 className="font-bold text-white text-base mb-1">{tour.name}</h3>
                    {durationLabel && <p className="text-xs mb-2" style={{ color: "#555" }}>⏱ {durationLabel}</p>}
                    {tour.hotel && <p className="text-xs mb-2" style={{ color: "#666" }}>🏨 {tour.hotel}</p>}
                    {tour.description && <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "#666" }}>{tour.description}</p>}
                  </div>
                  <div className="p-4 pt-0">
                    <div className="flex items-center justify-between mb-3 pt-3" style={{ borderTop: "1px solid #1a1a1a" }}>
                      <span className="text-lg font-bold" style={{ color: "#D4AF37" }}>{tour.price_azn} AZN</span>
                      <span className="text-xs" style={{ color: "#555" }}>/nəfər</span>
                    </div>
                    <a href={waLink(`Salam, "${tour.name}" turu haqqında məlumat almaq istəyirəm`)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                      style={{ background: "#25D366", color: "#fff" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp-da Sifariş Et
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl p-8 md:p-10 text-center" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">İstədiyiniz Turu Tapmadınız?</h3>
          <p className="text-sm mb-5" style={{ color: "#666" }}>Fərdi tur paketləri də hazırlayırıq. WhatsApp-da yazın.</p>
          <a href={waLink("Salam, fərdi tur paketi haqqında məlumat almaq istəyirəm")}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold py-3 px-6 rounded-xl"
            style={{ background: "#25D366", color: "#fff" }}>
            Fərdi Tur Sifariş Et
          </a>
        </div>
      </div>
    </div>
  );
}
