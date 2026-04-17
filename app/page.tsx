"use client";

import { useEffect, useRef, useState } from "react";
import NewsletterSection from "@/components/NewsletterSection";
import { Sparkles, X, Loader2, ArrowRight, MapPin } from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
interface SearchTour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  hotel: string | null;
  max_seats: number;
  booked_seats: number;
}
interface SearchResult {
  tours: SearchTour[];
  ai_intro: string;
  fallback: boolean;
}

/* ─── Helpers ────────────────────────────────────────── */
function waLink(t: string) {
  return `https://wa.me/994517769632?text=${encodeURIComponent(t)}`;
}

const TAGS = [
  "Romantik cütlük səyahəti",
  "Ailə ilə Dubaya uçuş",
  "Büdcəyə uyğun Antalya",
  "Baliyə ekzotik tur",
  "Parisə mədəniyyət səyahəti",
  "Tokio macərası",
];

const DESTINATIONS = [
  { name: "Dubai",      country: "BƏƏ",        img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",  big: true  },
  { name: "Malediv",    country: "Hind Okeanı", img: "https://images.unsplash.com/photo-1499396010447-c75e58d61c2b?w=600&q=80"          },
  { name: "Barselona",  country: "İspaniya",    img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80"          },
  { name: "Antalya",    country: "Türkiyə",     img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"            },
  { name: "Tokio",      country: "Yaponiya",    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80"         },
  { name: "Kapri",      country: "İtaliya",     img: "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=600&q=80"         },
];

const LOADING_STEPS = ["Təhlil edilir...", "Məkanlar axtarılır...", "Paket hazırlanır...", "Tamamlanır..."];

/* ─── GlowOrbs ───────────────────────────────────────── */
function GlowOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
      <div className="blob absolute top-[-8rem] left-[-6rem] w-[500px] h-[500px] rounded-full bg-sky-400/20 blur-3xl" />
      <div className="blob blob-delay absolute bottom-[5%] right-[-4rem] w-96 h-96 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="blob blob-delay2 absolute top-[40%] left-[35%] w-72 h-72 rounded-full bg-indigo-400/15 blur-3xl" />
    </div>
  );
}

/* ─── Result Modal ───────────────────────────────────── */
function ResultModal({ onClose, result }: { onClose: () => void; result: SearchResult | null }) {
  if (!result) return null;
  const { tours, ai_intro } = result;
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ animation: "fadeIn .3s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        style={{ animation: "slideUp .4s cubic-bezier(.34,1.56,.64,1)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <span className="text-white font-bold text-base">AI Tövsiyəsi</span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {ai_intro && (
            <div className="bg-sky-50 border-l-4 border-sky-500 rounded-xl p-4 mb-4">
              <p className="text-slate-700 text-sm leading-relaxed m-0">{ai_intro}</p>
            </div>
          )}

          {tours.length > 0 ? (
            <div className="flex flex-col gap-3 mb-4">
              {tours.map(tour => {
                const seatsLeft = tour.max_seats - tour.booked_seats;
                return (
                  <div key={tour.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-3 py-0.5 rounded-full">{tour.destination}</span>
                        <p className="mt-2 font-bold text-slate-800 text-sm leading-snug">{tour.name}</p>
                        {tour.hotel && <p className="text-xs text-slate-400 mt-1">🏨 {tour.hotel}</p>}
                        {seatsLeft > 0 && seatsLeft <= 3 && (
                          <span className="text-xs text-red-500 font-bold">Son {seatsLeft} yer!</span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-extrabold text-sky-600 text-lg">{tour.price_azn} AZN</p>
                        <p className="text-xs text-slate-400">/nəfər</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 flex items-center justify-between px-4 py-2.5">
                      <a href={`/turlar/${tour.id}`}
                        className="text-sm font-semibold text-sky-600 hover:underline transition">
                        Ətraflı bax →
                      </a>
                      <a href={waLink(`Salam, "${tour.name}" turu haqqında məlumat almaq istəyirəm`)}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline transition">
                        WhatsApp ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center mb-4">
              Hal-hazırda uyğun tur tapılmadı. Yeni turlar üçün bizi izləyin.
            </p>
          )}

          <a href="/turlar"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm">
            Bütün Turlara Bax <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  /* quick search */
  const [qDest, setQDest] = useState("hamisi");
  const [qMonth, setQMonth] = useState("");
  const [qPersons, setQPersons] = useState(2);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) => setTimeout(() => setLoadingStep(i), i * 900));
    try {
      const sessionToken = typeof window !== "undefined"
        ? (localStorage.getItem("nf_session_token") ?? undefined) : undefined;
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, session_token: sessionToken }),
      });
      const data = await res.json();
      timers.forEach(clearTimeout);
      setSearchResult(data.ok
        ? { tours: data.tours || [], ai_intro: data.ai_intro || "", fallback: data.fallback ?? false }
        : { tours: [], ai_intro: "Axtarış zamanı xəta baş verdi. Turlar səhifəsinə baxın.", fallback: true });
      setShowModal(true);
    } catch {
      timers.forEach(clearTimeout);
      setSearchResult({ tours: [], ai_intro: "Bağlantı xətası. Yenidən cəhd edin.", fallback: true });
      setShowModal(true);
    } finally {
      setIsLoading(false);
      setLoadingStep(-1);
    }
  };

  return (
    <>
      <style>{`
        @keyframes blob {
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(30px,-20px) scale(1.05)}
          66%{transform:translate(-15px,15px) scale(.97)}
        }
        @keyframes fadeInUp {
          from{opacity:0;transform:translateY(24px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp {
          from{opacity:0;transform:translateY(40px) scale(.95)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        .blob{animation:blob 7s ease-in-out infinite}
        .blob-delay{animation-delay:2s}
        .blob-delay2{animation-delay:4s}
        .fade-in-up{animation:fadeInUp .6s ease both}
      `}</style>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 py-24 text-center overflow-hidden bg-[#f8fafc]">
        <GlowOrbs />
        <div className="relative z-10 w-full max-w-2xl mx-auto">

          <span className="fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold tracking-wide uppercase mb-6">
            <Sparkles size={13} /> AI ilə Gücləndirilib
          </span>

          <h1 className="fade-in-up text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900 mb-5"
            style={{ animationDelay: ".1s" }}>
            Dünyanı Kəşf Etməyin{" "}
            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              Ən Ağıllı Yolu
            </span>
          </h1>

          <p className="fade-in-up text-lg text-slate-500 max-w-md mx-auto mb-10 leading-relaxed"
            style={{ animationDelay: ".2s" }}>
            Sadəcə arzunuzu yazın — AI qalan hər şeyi planlaşdırır.
          </p>

          {/* AI Prompt Box */}
          <div className="fade-in-up bg-white/90 backdrop-blur-xl rounded-3xl p-2 shadow-xl ring-1 ring-sky-200/60 mb-5"
            style={{ animationDelay: ".3s" }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleGenerate(); }}
              placeholder="Məsələn: Gələn ay yoldaşımla romantik və isti bir yerə getmək istəyirik, büdcəmiz 2000 AZN-dir..."
              className="w-full min-h-[110px] p-5 bg-transparent text-slate-800 text-base leading-relaxed resize-none outline-none placeholder:text-slate-400 rounded-2xl"
            />
            <div className="flex items-center justify-between px-3 pb-3 gap-3">
              <span className="text-xs text-slate-400">Ctrl+Enter ilə göndər</span>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-200"
                style={{
                  background: isLoading || !prompt.trim()
                    ? "#cbd5e1"
                    : "linear-gradient(135deg,#0284c7,#4f46e5)",
                  boxShadow: isLoading || !prompt.trim() ? "none" : "0 8px 25px rgba(2,132,199,.4)",
                  cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
                }}>
                {isLoading
                  ? <><Loader2 size={16} className="animate-spin" />{LOADING_STEPS[loadingStep] || "..."}</>
                  : <><Sparkles size={16} />Generasiya Et</>}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="fade-in-up flex flex-wrap gap-2 justify-center mb-8" style={{ animationDelay: ".4s" }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setPrompt(tag)}
                className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 bg-white/80 border border-sky-200/60 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-400 transition-all backdrop-blur">
                {tag}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="fade-in-up bg-white/80 backdrop-blur-xl rounded-2xl p-4 ring-1 ring-slate-200/60 shadow-sm" style={{ animationDelay: ".5s" }}>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest text-center mb-3">Sürətli Axtarış</p>
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <select value={qDest} onChange={e => setQDest(e.target.value)}
                className="flex-1 min-w-[130px] px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none cursor-pointer">
                <option value="hamisi">İstiqamət seç</option>
                <option value="turkiye">🇹🇷 Türkiyə</option>
                <option value="ereb">🇦🇪 Dubai / BƏƏ</option>
                <option value="misir">🇪🇬 Misir</option>
                <option value="avropa">🇪🇺 Avropa</option>
              </select>
              <select value={qMonth} onChange={e => setQMonth(e.target.value)}
                className="flex-1 min-w-[130px] px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none cursor-pointer">
                <option value="">Ay seç</option>
                {Array.from({ length: 8 }, (_, i) => {
                  const d = new Date(); d.setMonth(d.getMonth() + i);
                  const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                  return <option key={val} value={val}>{d.toLocaleString("az-AZ", { month: "long", year: "numeric" })}</option>;
                })}
              </select>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <MapPin size={13} className="text-slate-400" />
                <button onClick={() => setQPersons(p => Math.max(1, p - 1))}
                  className="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-slate-50 transition">−</button>
                <span className="text-sm font-semibold text-slate-700 w-[52px] text-center">{qPersons} nəfər</span>
                <button onClick={() => setQPersons(p => Math.min(20, p + 1))}
                  className="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-500 text-lg leading-none flex items-center justify-center hover:bg-slate-50 transition">+</button>
              </div>
              <a href={`/turlar${qDest !== "hamisi" || qMonth ? `?${new URLSearchParams({ ...(qDest !== "hamisi" && { dest: qDest }), ...(qMonth && { month: qMonth }) }).toString()}` : ""}`}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0 flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 4px 15px rgba(2,132,199,.3)" }}>
                Tur Axtar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ──────────────────────────────────── */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">Dünya Sizi Gözləyir</p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-10">Populyar Məkanlar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-[180px]">
            {DESTINATIONS.map((d, i) => (
              <a key={d.name} href={`/turlar?dest=${d.name.toLowerCase()}`}
                className={`relative rounded-2xl overflow-hidden group block ${i === 0 ? "row-span-2" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-bold text-base leading-tight">{d.name}</p>
                  <p className="text-white/70 text-xs">{d.country}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="px-4 py-20 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">Sadə Prosess</p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-12">Necə İşləyir?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: "01", emoji: "🧠", title: "İstəyini Bildir",  desc: "Arzuladığın səyahəti sadə sözlərlə yazın. Tarix, büdcə, zövq — hər şeyi söyləyin." },
              { n: "02", emoji: "⚡", title: "AI Analiz Edir",   desc: "Süni intellektimiz minlərlə variantı saniyələr içində analiz edir, sizə uyğun paketləri tapır." },
              { n: "03", emoji: "✈️", title: "Təsdiqlə və Get", desc: "Paketi bəyənin, bir kliklə WhatsApp vasitəsilə rezervasiya edin." },
            ].map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{s.emoji}</div>
                <div className="text-xs text-sky-600 font-bold uppercase tracking-widest mb-2">{s.n}</div>
                <h3 className="font-bold text-slate-800 text-lg mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">Niyə Natoure?</p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-12">Tam Səyahət Təcrübəsi</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { emoji: "🗓️", tag: "Pre-Trip",     title: "Mükəmməl Plan",  desc: "Viza, sığorta, otel, uçuş — hər şey bir yerdə.", color: "#0284c7" },
              { emoji: "🎧", tag: "On-Trip",      title: "24/7 Dəstək",    desc: "Səyahət zamanı istənilən problemdə AI köməyiniz hazırdır.", color: "#4f46e5" },
              { emoji: "📈", tag: "Smart Price",  title: "Ən Yaxşı Qiymət",desc: "AI real-time qiymət analizi aparır, ən sərfəli tarifi tapır.", color: "#0ea5e9" },
              { emoji: "⭐", tag: "Post-Trip",    title: "Xatirə & Növbəti",desc: "Rəylər, fotolar və növbəti mükəmməl tur tövsiyəsi.", color: "#6366f1" },
            ].map(f => (
              <div key={f.tag}
                className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                <div className="text-3xl mb-4">{f.emoji}</div>
                <span className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: f.color }}>{f.tag}</span>
                <h3 className="font-bold text-slate-800 text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-20 bg-[#f8fafc]">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-16 text-center text-white"
            style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 30px 80px rgba(2,132,199,.3)" }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Səyahətinizi Planlamağa Hazırsınız?</h2>
            <p className="text-white/80 text-base mb-10 leading-relaxed">İlk AI ilə planlanmış turunu pulsuz sınayın. Heç bir ödəniş tələb olunmur.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-7 py-3.5 rounded-2xl bg-white text-sky-700 font-bold text-base hover:-translate-y-0.5 transition-transform flex items-center gap-2">
                İndi Başla <ArrowRight size={18} />
              </button>
              <a href="/haqqimizda"
                className="px-7 py-3.5 rounded-2xl font-semibold text-base text-white border border-white/40 bg-white/15 hover:bg-white/25 transition backdrop-blur">
                Bizi Tanı
              </a>
            </div>
          </div>
        </div>
      </section>

      <NewsletterSection />

      {showModal && <ResultModal onClose={() => setShowModal(false)} result={searchResult} />}
    </>
  );
}
