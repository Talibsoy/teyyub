"use client";

import { useEffect, useState } from "react";
import NewsletterSection from "@/components/NewsletterSection";
import ReviewsSection from "@/components/ReviewsSection";
import QuizWidget from "@/components/personalization/QuizWidget";
import DNAProfileCard from "@/components/DNAProfileCard";
import { Sparkles, X, Loader2, ArrowRight, Brain, Zap, Plane, Calendar, Shield, TrendingUp } from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
interface SearchTour {
  id: string; name: string; destination: string; price_azn: number;
  start_date: string | null; hotel: string | null;
  max_seats: number; booked_seats: number;
}
interface SearchResult { tours: SearchTour[]; ai_intro: string; fallback: boolean; }

function waLink(t: string) { return `https://wa.me/994517769632?text=${encodeURIComponent(t)}`; }

const TAGS = ["Romantik cütlük", "Ailə ilə Dubai", "Büdcəyə uyğun Antalya", "Bali ekzotika", "Paris mədəniyyəti", "Tokio macərası"];

const DESTINATIONS = [
  { name: "Dubai",         country: "BƏƏ",         img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", big: true },
  { name: "Maldiv Adaları",country: "Hind Okeanı", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80" },
  { name: "Antalya",       country: "Türkiyə",     img: "https://images.unsplash.com/photo-1600183740878-a39a7cf7a3b0?w=600&q=80" },
  { name: "Paris",         country: "Fransa",      img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80" },
  { name: "Bali",          country: "İndoneziya",  img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
  { name: "Barselona",     country: "İspaniya",    img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80" },
  { name: "Tokio",         country: "Yaponiya",    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
  { name: "Roma",          country: "İtaliya",     img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80" },
];

const ITINERARY_PREVIEW = [
  { day: "G1", title: "Varış & Notting Hill", sub: "Portobello Market, gizli İtalyan restoranı", tags: ["Sakit", "Autentik"] },
  { day: "G2", title: "British Museum & Bloomsbury", sub: "Açılışdan əvvəl qalereyaya xüsusi giriş", tags: ["Museum-heavy", "Mədəniyyət"] },
  { day: "G3", title: "Thames & Tate Modern", sub: "Çay kənarı, Borough Market, qalereyalar", tags: ["Sənət", "Yerli"] },
  { day: "+4", title: "4 gün tam planlaşdırılıb", sub: "Gizli nöqtələr, yerli icma, büdcə izlənməsi", tags: ["AI seçimi"] },
];

const TESTIMONIALS = [
  { name: "Aynur M.", dest: "Dubai turu", text: "Natoure ilə Dubai turumuz mükəmməl keçdi! AI axtarışı ilə büdcəmizə tam uyğun paket tapdıq, hər detal öncədən planlanmışdı.", initials: "AM", color: "#0284c7" },
  { name: "Rauf H.", dest: "Antalya turu", text: "Qiymət-keyfiyyət nisbəti əla. Hər sualıma dərhal cavab aldım. Rezervasiya prosesi isə çox sadə idi, tövsiyə edirəm.", initials: "RH", color: "#4f46e5" },
  { name: "Leyla K.", dest: "Paris turu", text: "Ailə ilə Paris... Uşaqlar çox xoşlandı. Gün-gün detallı plan sayəsində heç bir gözəl yeri qaçırmadıq!", initials: "LK", color: "#7c3aed" },
];

const LOADING_STEPS = ["Təhlil edilir...", "Məkanlar axtarılır...", "Paket hazırlanır...", "Tamamlanır..."];

/* ─── Result Modal ───────────────────────────────────── */
function ResultModal({ onClose, result }: { onClose: () => void; result: SearchResult | null }) {
  if (!result) return null;
  const { tours, ai_intro } = result;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ animation: "fadeIn .3s ease" }}>
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" style={{ animation: "slideUp .4s cubic-bezier(.34,1.56,.64,1)" }}>
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <span className="text-white font-bold text-base">AI Tövsiyəsi</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"><X size={16} /></button>
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
                        {seatsLeft > 0 && seatsLeft <= 3 && <span className="text-xs text-red-500 font-bold">Son {seatsLeft} yer!</span>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-extrabold text-sky-600 text-lg">{tour.price_azn} AZN</p>
                        <p className="text-xs text-slate-400">/nəfər</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 flex items-center justify-between px-4 py-2.5">
                      <a href={`/turlar/${tour.id}`} className="text-sm font-semibold text-sky-600 hover:underline">Ətraflı bax →</a>
                      <a href={waLink(`Salam, "${tour.name}" turu haqqında məlumat almaq istəyirəm`)} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">WhatsApp ↗</a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center mb-4">Hal-hazırda uyğun tur tapılmadı. Yeni turlar üçün bizi izləyin.</p>
          )}
          <a href="/turlar" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm">
            Bütün Turlara Bax <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function HomePage() {
  const [prompt, setPrompt]           = useState("");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [isLoading, setIsLoading]     = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [quizDone, setQuizDone]       = useState(false);
  const [archetypeName, setArchetypeName] = useState("");

  useEffect(() => {
    const arch = localStorage.getItem("nf_archetype");
    const scores = localStorage.getItem("nf_dna_scores");
    if (arch && scores) { setQuizDone(true); }
    if (arch) {
      const labels: Record<string, string> = {
        efficiency_seeker: "Dinamik Səyahətçi",
        deep_relaxer:      "Dərin Relaksator",
        silent_explorer:   "Sakit Explorer",
        budget_optimizer:  "Büdcə Ustası",
        luxury_curator:    "Lüks Kurator",
      };
      setArchetypeName(labels[arch] || arch);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true); setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) => setTimeout(() => setLoadingStep(i), i * 900));
    try {
      const sessionToken = localStorage.getItem("nf_session_token") ?? undefined;
      const res = await fetch("/api/ai-search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, session_token: sessionToken }),
      });
      const data = await res.json();
      timers.forEach(clearTimeout);
      setSearchResult(data.ok
        ? { tours: data.tours || [], ai_intro: data.ai_intro || "", fallback: data.fallback ?? false }
        : { tours: [], ai_intro: "Axtarış zamanı xəta baş verdi.", fallback: true });
      setShowModal(true);
    } catch {
      timers.forEach(clearTimeout);
      setSearchResult({ tours: [], ai_intro: "Bağlantı xətası. Yenidən cəhd edin.", fallback: true });
      setShowModal(true);
    } finally { setIsLoading(false); setLoadingStep(-1); }
  };

  return (
    <>
      <style>{`
        @keyframes blob {
          0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-15px,15px) scale(.97)}
        }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes countUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .blob{animation:blob 7s ease-in-out infinite} .blob-delay{animation-delay:2s} .blob-delay2{animation-delay:4s}
        .fade-in-up{animation:fadeInUp .6s ease both}
        .how-connector::after {
          content:""; position:absolute; top:50%; left:100%; width:100%; height:2px;
          background:repeating-linear-gradient(90deg,#cbd5e1 0,#cbd5e1 6px,transparent 6px,transparent 12px);
          transform:translateY(-50%);
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center px-4 py-14 text-center overflow-hidden bg-[#f8fafc]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob absolute top-[-8rem] left-[-6rem] w-[500px] h-[500px] rounded-full bg-sky-400/20 blur-3xl" />
          <div className="blob blob-delay absolute bottom-[5%] right-[-4rem] w-96 h-96 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="blob blob-delay2 absolute top-[40%] left-[35%] w-72 h-72 rounded-full bg-indigo-400/15 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto">
          <div className="fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold tracking-widest uppercase mb-8">
            <Sparkles size={12} /> AI Qərar Mühərriki
          </div>

          {/* Main headline */}
          <h1 className="fade-in-up text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] text-slate-900 mb-6 tracking-tight"
            style={{ animationDelay: ".1s" }}>
            Səyahətiniz{" "}
            <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">3 Nəticəyə</span>{" "}
            endirilir.
          </h1>

          <p className="fade-in-up text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: ".2s" }}>
            NatoureFly sizin <strong className="text-slate-700">Səyahət DNT-nizi</strong> analiz edir, minlərlə variantı süzgəcdən keçirir və yalnız{" "}
            <strong className="text-slate-700">100% uyğun</strong>, tam büdcələşdirilmiş holistik marşrut təqdim edir.
          </p>

          {/* CTAs */}
          <div className="fade-in-up flex flex-col sm:flex-row gap-3 justify-center mb-10" style={{ animationDelay: ".25s" }}>
            <button
              onClick={() => { const el = document.getElementById("quiz-section"); el?.scrollIntoView({ behavior: "smooth" }); }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 12px 32px rgba(2,132,199,.4)" }}>
              Səyahət DNT-ni Başla <ArrowRight size={18} />
            </button>
            <button
              onClick={() => { const el = document.getElementById("ai-chat-trigger"); (el as HTMLButtonElement)?.click(); }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-700 border-2 border-slate-200 hover:border-sky-300 hover:bg-white/80 transition-all bg-white/60 backdrop-blur">
              <Brain size={18} className="text-sky-600" /> AI Bələdçi ilə Başla
            </button>
          </div>

          {/* Stats */}
          <div className="fade-in-up grid grid-cols-3 gap-4 mb-10" style={{ animationDelay: ".3s" }}>
            {[
              { val: "99%", label: "Uyğunluq dəqiqliyi" },
              { val: "50+", label: "Destinasiya" },
              { val: "24/7", label: "AI Dəstək" },
            ].map(s => (
              <div key={s.val} className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-sky-600 mb-1" style={{ animation: "countUp 0.6s ease both" }}>{s.val}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AI Prompt Box */}
          <div className="fade-in-up bg-white/90 backdrop-blur-xl rounded-3xl p-2 shadow-xl ring-1 ring-sky-200/60 mb-5" style={{ animationDelay: ".35s" }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleGenerate(); }}
              placeholder="Məsələn: Gələn ay yoldaşımla romantik bir yerə getmək istəyirik, büdcəmiz 2000 AZN-dir..."
              className="w-full min-h-[100px] p-5 bg-transparent text-slate-800 text-base leading-relaxed resize-none outline-none placeholder:text-slate-400 rounded-2xl"
            />
            <div className="flex items-center justify-between px-3 pb-3 gap-3">
              <span className="text-xs text-slate-400">Ctrl+Enter ilə göndər</span>
              <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all"
                style={{
                  background: isLoading || !prompt.trim() ? "#cbd5e1" : "linear-gradient(135deg,#0284c7,#4f46e5)",
                  boxShadow: isLoading || !prompt.trim() ? "none" : "0 8px 25px rgba(2,132,199,.4)",
                  cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
                }}>
                {isLoading ? <><Loader2 size={16} className="animate-spin" />{LOADING_STEPS[loadingStep] || "..."}</> : <><Sparkles size={16} />Generasiya Et</>}
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

          {/* Quiz section */}
          <div id="quiz-section" className="fade-in-up flex justify-center mb-6" style={{ animationDelay: ".45s" }}>
            <QuizWidget onComplete={() => { setQuizDone(true); window.location.reload(); }} />
          </div>

        </div>
      </section>

      {/* ── DNA PROFILE (quiz bitibsə) ─────────────────── */}
      {quizDone && (
        <section className="px-4 py-16 bg-[#0a0f1e]">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <p className="text-[11px] text-sky-400 font-bold uppercase tracking-widest mb-3">Sizin Profiliniz</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                  Səyahət DNT-niz<br />
                  <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">analiz edildi</span>
                </h2>
                <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-sm">
                  Turlar sizin psixometrik profilinizə görə sıralanır. Ən uyğun variantlar ən yuxarıda görünür.
                </p>
                <a href="/turlar"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 8px 24px rgba(2,132,199,.35)" }}>
                  Turlarıma Bax <ArrowRight size={16} />
                </a>
              </div>
              <div className="flex-1 flex justify-center lg:justify-end w-full max-w-sm">
                <DNAProfileCard archetypeName={archetypeName} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ITINERARY PREVIEW ─────────────────────────── */}
      <section className="px-4 py-14 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-[11px] text-sky-600 font-bold uppercase tracking-widest mb-3">Holistik Marşrut</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">
                Saatbasaat planlanmış<br />
                <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">tam proqram</span>
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-sm">
                Yalnız bilet deyil — hər günün planı, yerli restoranlar, gizli məkanlar, büdcə izlənməsi. Hamısı bir yerdə.
              </p>
              <a href="/turlar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 8px 24px rgba(2,132,199,.35)" }}>
                Nümunə Marşrut Gör <ArrowRight size={16} />
              </a>
            </div>

            {/* Right: preview card */}
            <div className="flex-1 w-full max-w-md">
              <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shadow-lg">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                  <p className="text-[10px] text-sky-600 font-bold uppercase tracking-widest mb-1">HOLİSTİK MARŞRUT — SAATBASAAT</p>
                  <h3 className="text-2xl font-black text-slate-900">London, 7 gün</h3>
                </div>
                <div className="px-6 py-4 space-y-0">
                  {ITINERARY_PREVIEW.map((item, i) => (
                    <div key={i} className="flex gap-4 group py-3" style={{ borderBottom: i < ITINERARY_PREVIEW.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      {/* Dot + line */}
                      <div className="flex flex-col items-center" style={{ width: 40 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          border: "2px solid #0284c7", background: "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#0284c7" }}>{item.day}</span>
                        </div>
                        {i < ITINERARY_PREVIEW.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: "#e2e8f0", marginTop: 4, minHeight: 16 }} />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{item.title}</p>
                        <p className="text-xs text-sky-600 mb-2">{item.sub}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map(t => (
                            <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-medium">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">BÜDCƏ ŞƏFFAFLIĞI</span>
                  <span className="text-sky-400 text-xs font-bold">$2,500 büdcə üçün real çıxış →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ──────────────────────────────────── */}
      <section className="px-4 py-14 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">Dünya Sizi Gözləyir</p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-10">Populyar Məkanlar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[160px] sm:auto-rows-[200px]">
            {DESTINATIONS.map((d, i) => (
              <a key={d.name} href={`/turlar?dest=${encodeURIComponent(d.name)}`}
                className={`relative rounded-2xl overflow-hidden group block ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-bold text-base leading-tight drop-shadow">{d.name}</p>
                  <p className="text-white/75 text-xs">{d.country}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="px-4 py-14 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">Sadə Prosess</p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-14">Necə İşləyir?</h2>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            {[
              { n: "01", icon: <Brain size={28} className="text-sky-600" />, title: "DNT-ni Müəyyən Et", desc: "10 sual psixometrik quiz-lə səyahət profilin çıxarılır. OCEAN + Plog modeli əsasında." },
              { n: "02", icon: <Zap size={28} className="text-indigo-600" />, title: "AI Analiz Edir", desc: "Minlərlə uçuş, otel, fəaliyyət saniyələr içində süzgəcdən keçirilir. Yalnız sənə uyğunlar qalır." },
              { n: "03", icon: <Plane size={28} className="text-sky-600" />, title: "Tam Proqram Al", desc: "Gün-gün, saat-saat marşrut. Büdcə şəffaflığı. Rezervasiya bir kliklə." },
            ].map((s, i) => (
              <div key={s.n} className="relative bg-white rounded-2xl p-7 border border-slate-100 shadow-sm text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                {i < 2 && (
                  <div className="hidden sm:block absolute top-12 -right-3 z-10">
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f1f5f9", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ArrowRight size={12} className="text-slate-400" />
                    </div>
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">{s.icon}</div>
                <div className="text-xs text-sky-600 font-bold uppercase tracking-widest mb-2">{s.n}</div>
                <h3 className="font-bold text-slate-800 text-lg mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section className="px-4 py-14 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">Niyə Natoure?</p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-12">Tam Səyahət Təcrübəsi</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Calendar size={24} className="text-sky-600" />, tag: "Səyahət Öncəsi", title: "Mükəmməl Plan", desc: "Viza, sığorta, otel, uçuş — hər şey bir yerdə.", bg: "bg-sky-50", border: "border-sky-100" },
              { icon: <Shield size={24} className="text-indigo-600" />, tag: "Səyahətdə",  title: "24/7 Dəstək",  desc: "Səyahət zamanı istənilən problemdə AI köməyiniz hazırdır.", bg: "bg-indigo-50", border: "border-indigo-100" },
              { icon: <TrendingUp size={24} className="text-sky-500" />, tag: "Ağıllı Qiymət", title: "Ən Yaxşı Qiymət", desc: "AI real-time qiymət analizi aparır, ən sərfəli tarifi tapır.", bg: "bg-sky-50", border: "border-sky-100" },
              { icon: <Sparkles size={24} className="text-violet-600" />, tag: "Səyahət Sonrası", title: "Növbəti Tövsiyə", desc: "Rəylər, fotolar və növbəti mükəmməl tur tövsiyəsi.", bg: "bg-violet-50", border: "border-violet-100" },
            ].map(f => (
              <div key={f.tag} className={`${f.bg} rounded-2xl p-6 border ${f.border} hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}>
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">{f.icon}</div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">{f.tag}</span>
                <h3 className="font-bold text-slate-800 text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section className="px-4 py-14 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">Müştəri Rəyləri</p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-10">Onlar artıq getdi, sıra sizdədir</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-none mb-0.5">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.dest}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ─────────────────────────────────────── */}
      <section style={{ background: "#0b0b0b" }}>
        <ReviewsSection />
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-14 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl p-14 text-center text-white" style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 30px 80px rgba(2,132,199,.3)" }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Səyahətinizi Planlamağa Hazırsınız?</h2>
            <p className="text-white/80 text-base mb-10 leading-relaxed">İlk AI ilə planlanmış turunu pulsuz sınayın. Heç bir ödəniş tələb olunmur.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-7 py-3.5 rounded-2xl bg-white text-sky-700 font-bold text-base hover:-translate-y-0.5 transition-transform flex items-center gap-2">
                İndi Başla <ArrowRight size={18} />
              </button>
              <a href="/haqqimizda" className="px-7 py-3.5 rounded-2xl font-semibold text-base text-white border border-white/40 bg-white/15 hover:bg-white/25 transition backdrop-blur">
                Bizi Tanı
              </a>
            </div>
          </div>
        </div>
      </section>

      <NewsletterSection />

      {/* Result Modal */}
      {showModal && <ResultModal onClose={() => setShowModal(false)} result={searchResult} />}
    </>
  );
}
