"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { waLink } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";
import WishlistButton from "@/components/WishlistButton";
import type { Archetype } from "@/lib/quiz-processor";
import { ARCHETYPE_LABELS } from "@/lib/quiz-processor";
import { tracker } from "@/lib/tracking-client";

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
  return <Suspense fallback={null}><TurlarContent /></Suspense>;
}

// ─── Match score (arxetip əsasında, RateHawk API olmadan sadə heuristik) ──────
const BEACH_KEYWORDS = ["antalya", "bodrum", "maldiv", "bali", "hurqada", "şarm", "rodos", "krit"];
const CULTURE_KEYWORDS = ["paris", "istanbul", "roma", "barselona", "amsterdam", "tokio", "kyoto"];

function calcTourMatchScore(tour: Tour, archetype: Archetype | null): number | null {
  if (!archetype || archetype === "undetermined") return null;

  const dest = tour.destination.toLowerCase();
  const price = tour.price_azn;
  const duration = getDuration(tour.start_date, tour.end_date);

  let score = 55; // Baza

  if (archetype === "budget_optimizer") {
    if (price < 800)  score += 25;
    else if (price < 1400) score += 12;
    else score -= 10;
  } else if (archetype === "luxury_curator") {
    if (price >= 2500) score += 25;
    else if (price >= 1500) score += 10;
    else score -= 15;
  } else if (archetype === "deep_relaxer") {
    if (BEACH_KEYWORDS.some(k => dest.includes(k))) score += 25;
    if (duration >= 7) score += 10;
    if (price >= 1200) score += 8;
  } else if (archetype === "silent_explorer") {
    if (CULTURE_KEYWORDS.some(k => dest.includes(k))) score += 25;
    if (duration >= 5) score += 10;
  } else if (archetype === "efficiency_seeker") {
    if (duration <= 5) score += 15;
    if (price < 1800) score += 10;
    if (BEACH_KEYWORDS.some(k => dest.includes(k))) score += 8;
  }

  return Math.min(99, Math.max(30, score));
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#0284c7" : "#64748b";
  const bg    = score >= 80 ? "rgba(22,163,74,0.1)" : score >= 60 ? "rgba(2,132,199,0.1)" : "rgba(100,116,139,0.08)";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, border: `1px solid ${color}30`,
      borderRadius: 20, padding: "3px 8px",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{score}% uyğun</span>
    </div>
  );
}

function TurlarContent() {
  const searchParams = useSearchParams();
  const [active, setActive]       = useState(searchParams.get("dest") || "hamisi");
  const [durFilter, setDurFilter] = useState(searchParams.get("dur") || "hamisi");
  const [search, setSearch]       = useState(searchParams.get("q") || "");
  const [minPrice, setMinPrice]   = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice]   = useState(searchParams.get("maxPrice") || "");
  const [tours, setTours]         = useState<Tour[]>([]);
  const [loading, setLoading]     = useState(true);
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [rankedIds, setRankedIds] = useState<string[] | null>(null);

  useEffect(() => {
    supabase.from("tours").select("*").eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setTours(data || []); setLoading(false); });

    const saved = localStorage.getItem("nf_archetype");
    if (saved) setArchetype(saved as Archetype);

    // pgvector sıralama — yalnız quiz tamamlanmışsa
    const token = localStorage.getItem("nf_session_token");
    if (token) {
      fetch(`/api/tours/ranked?session_token=${token}`)
        .then(r => r.json())
        .then(d => { if (d.ranked?.length) setRankedIds(d.ranked.map((r: { id: string }) => r.id)); })
        .catch(() => {});
    }

    tracker.init();
  }, []);

  // URL parametrlərini yenilə (shallow routing)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams();
    if (active !== "hamisi") p.set("dest", active);
    if (durFilter !== "hamisi") p.set("dur", durFilter);
    if (search.trim()) p.set("q", search.trim());
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    const qs = p.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [active, durFilter, search, minPrice, maxPrice]);

  const filtered = useMemo(() => {
    const list = tours.filter((t) => {
      if (active !== "hamisi" && getCategory(t.destination) !== active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.destination.toLowerCase().includes(q)) return false;
      }
      if (minPrice && t.price_azn < Number(minPrice)) return false;
      if (maxPrice && t.price_azn > Number(maxPrice)) return false;
      if (durFilter !== "hamisi") {
        const d = getDuration(t.start_date, t.end_date);
        if (durFilter === "1-5"  && !(d >= 1 && d <= 5)) return false;
        if (durFilter === "6-8"  && !(d >= 6 && d <= 8)) return false;
        if (durFilter === "9+"   && d < 9) return false;
      }
      return true;
    });

    // pgvector sıralama (travel_dna_vector əsaslı) — birinci prioritet
    if (rankedIds && rankedIds.length > 0) {
      const order = new Map(rankedIds.map((id, i) => [id, i]));
      list.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
      return list;
    }

    // Fallback: heuristik arxetip sıralama
    if (archetype && archetype !== "undetermined") {
      if (archetype === "budget_optimizer") {
        list.sort((a, b) => a.price_azn - b.price_azn);
      } else if (archetype === "luxury_curator") {
        list.sort((a, b) => b.price_azn - a.price_azn);
      } else {
        list.sort((a, b) => {
          const sa = calcTourMatchScore(a, archetype) ?? 0;
          const sb = calcTourMatchScore(b, archetype) ?? 0;
          return sb - sa;
        });
      }
    }

    return list;
  }, [tours, active, search, minPrice, maxPrice, durFilter, archetype, rankedIds]);

  const hasFilters = search || minPrice || maxPrice || active !== "hamisi" || durFilter !== "hamisi";

  function clearFilters() {
    setSearch(""); setMinPrice(""); setMaxPrice(""); setActive("hamisi"); setDurFilter("hamisi");
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 py-12 md:py-16 text-center" style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#1e40af" }}>Bütün Turlar</h1>
        <p className="text-sm" style={{ color: "#475569" }}>Türkiyə, Ərəb ölkələri, Misir və Avropa istiqamətlərindəki bütün tur paketlərimiz</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* ── Arxetip banneri ── */}
        {archetype && archetype !== "undetermined" && (() => {
          const label = ARCHETYPE_LABELS[archetype];
          const sortDesc: Record<Archetype, string> = {
            budget_optimizer:  "Ən sərfəli qiymətdən başlayaraq sıralandı",
            luxury_curator:    "Ən premium paketlər birinci göstərilir",
            deep_relaxer:      "Çimərliq & istirahət turları öndə",
            silent_explorer:   "Mədəniyyət & kəşf turları öndə",
            efficiency_seeker: "Qısa müddətli sürətli turlar öndə",
            undetermined:      "",
          };
          return (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "linear-gradient(135deg, rgba(2,132,199,0.06), rgba(79,70,229,0.06))",
              border: "1px solid rgba(2,132,199,0.18)",
              borderRadius: 14, padding: "12px 18px", marginBottom: 20,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>
                {label.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#0284c7", fontWeight: 700 }}>
                  {label.name} profili üçün
                </div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  {sortDesc[archetype]}
                </div>
              </div>
              <a href="/" style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none", whiteSpace: "nowrap" }}>
                Dəyiş →
              </a>
            </div>
          );
        })()}

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
              style={{ background: "white", border: "1px solid #e2e8f0" }}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#555" }}>Min.</span>
            <input
              type="number"
              placeholder="Min (AZN)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="pl-10 pr-3 py-2.5 rounded-xl text-sm outline-none w-full sm:w-32"
              style={{ background: "white", border: "1px solid #e2e8f0" }}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#555" }}>Maks.</span>
            <input
              type="number"
              placeholder="Maks (AZN)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="pl-12 pr-4 py-2.5 rounded-xl text-sm outline-none w-full sm:w-36"
              style={{ background: "white", border: "1px solid #e2e8f0",  }}
            />
          </div>
        </div>

        {/* Kateqoriya filtri */}
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActive(cat.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={active === cat.id
                ? { background: "#0284c7", color: "#fff" }
                : { background: "white", color: "#64748b", border: "1px solid #e2e8f0" }}>
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
                ? { background: "#0284c7", color: "#fff", border: "1px solid #0284c7" }
                : { background: "white", color: "#94a3b8", border: "1px solid #e2e8f0" }}>
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
              <button onClick={clearFilters} className="text-xs underline" style={{ color: "#0284c7" }}>
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
              const matchScore = calcTourMatchScore(tour, archetype);
              return (
                <div key={tour.id}
                  className="rounded-xl flex flex-col overflow-hidden"
                  style={{ background: "white", border: "1px solid #e2e8f0" }}
                  onMouseEnter={() => {
                    tracker.track({
                      event_type: "view_detail",
                      entity_type: "package",
                      entity_id: tour.id,
                      metadata: { price: tour.price_azn, destination: tour.destination },
                    });
                  }}
                >
                  {almostFull && (
                    <div className="text-xs font-bold text-center py-1.5" style={{ background: "#ef4444",  }}>
                      Son {seatsLeft} yer!
                    </div>
                  )}
                  <div className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{tour.destination}</p>
                      <div className="flex items-center gap-2">
                        {matchScore !== null && <MatchBadge score={matchScore} />}
                        <WishlistButton tourId={tour.id} />
                      </div>
                    </div>
                    <Link href={`/turlar/${tour.id}`}>
                      <h3 className="font-bold text-base mb-1 hover:text-yellow-400 transition-colors cursor-pointer" style={{ color: "#0f172a" }}>{tour.name}</h3>
                    </Link>
                    {durationLabel && <p className="text-xs mb-2" style={{ color: "#555" }}>⏱ {durationLabel}</p>}
                    {tour.hotel && <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>🏨 {tour.hotel}</p>}
                    {tour.description && <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "#94a3b8" }}>{tour.description}</p>}
                  </div>
                  <div className="p-4 pt-0">
                    <div className="flex items-center justify-between mb-3 pt-3" style={{ borderTop: "1px solid #e2e8f0" }}>
                      <span className="text-lg font-bold" style={{ color: "#0284c7" }}>{tour.price_azn} AZN</span>
                      <span className="text-xs" style={{ color: "#555" }}>/nəfər</span>
                    </div>
                    <Link href={`/turlar/${tour.id}`}
                      onClick={() => tracker.track({ event_type: "booking_start", entity_type: "package", entity_id: tour.id, metadata: { price: tour.price_azn, destination: tour.destination } })}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", color: "white" }}>
                      Ətraflı bax →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl p-8 md:p-10 text-center" style={{ background: "white", border: "1px solid #e2e8f0" }}>
          <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: "#0f172a" }}>İstədiyiniz Turu Tapmadınız?</h3>
          <p className="text-sm mb-5" style={{ color: "#475569" }}>Fərdi tur paketləri də hazırlayırıq. WhatsApp-da yazın.</p>
          <a href={waLink("Salam, fərdi tur paketi haqqında məlumat almaq istəyirəm")}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold py-3 px-6 rounded-xl"
            style={{ background: "#25D366",  }}>
            Fərdi Tur Sifariş Et
          </a>
        </div>
      </div>
    </div>
  );
}
