"use client";

import { useEffect, useState } from "react";
import NewsletterSection from "@/components/NewsletterSection";
import ReviewsSection from "@/components/ReviewsSection";
import QuizWidget from "@/components/personalization/QuizWidget";
import DNAProfileCard from "@/components/DNAProfileCard";
import { useLanguage } from "@/components/LanguageContext";
import { Sparkles, X, Loader2, ArrowRight, Brain, Zap, Plane, Calendar, Shield, TrendingUp, Bed, Compass, Train, Bus, Ship, MapPin, Search } from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
interface SearchTour {
  id: string; name: string; destination: string; price_azn: number;
  start_date: string | null; hotel: string | null;
  max_seats: number; booked_seats: number;
}
interface DynamicPackage {
  origin?: string;
  destination: string; checkin: string; checkout: string;
  nights: number; passengers: number;
  hotel_name: string; hotel_stars: number | null; hotel_rating: number | null;
  flight_stops: number; price_azn: number; per_person_azn: number;
  price_usd?: number; per_person_usd?: number; currency?: "USD" | "AZN";
  wa_text: string;
}
interface SearchResult { tours: SearchTour[]; ai_intro: string; fallback: boolean; dynamicPackage?: DynamicPackage | null; }

function waLink(t: string) { return `https://wa.me/994517769632?text=${encodeURIComponent(t)}`; }

const LOADING_STEPS = ["Təhlil edilir...", "Məkanlar axtarılır...", "Paket hazırlanır...", "Tamamlanır..."];

/* ─── Dynamic Package Card ───────────────────────────── */
function DynamicPackageCard({ pkg }: { pkg: DynamicPackage }) {
  const { t } = useLanguage();
  const isAzn = pkg.currency === "AZN";
  const displayPrice = isAzn ? pkg.price_azn : (pkg.price_usd ?? pkg.price_azn);
  const displayPerPerson = isAzn ? pkg.per_person_azn : (pkg.per_person_usd ?? pkg.per_person_azn);

  const checkInFmt  = new Date(pkg.checkin).toLocaleDateString(isAzn ? "az-AZ" : "en-US",  { day: "numeric", month: "long" });
  const checkOutFmt = new Date(pkg.checkout).toLocaleDateString(isAzn ? "az-AZ" : "en-US", { day: "numeric", month: "long" });
  const stars = pkg.hotel_stars ? "★".repeat(pkg.hotel_stars) : "";

  return (
    <div className="rounded-2xl overflow-hidden mb-4 shadow-lg border border-sky-100 text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{t("packageTitle")}</span>
        </div>
        <p className="text-white font-extrabold text-lg leading-tight">
          {pkg.origin || "Departure"} → {pkg.destination}
        </p>
        <p className="text-white/80 text-sm mt-0.5">
          {checkInFmt} – {checkOutFmt} · {pkg.nights} nights · {pkg.passengers} travelers
        </p>
      </div>

      {/* Details */}
      <div className="bg-white px-5 py-4 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5 text-sm text-slate-600">
          <span className="mt-0.5 text-sky-500">🏨</span>
          <div>
            <span className="font-semibold text-slate-800">{pkg.hotel_name}</span>
            {stars && <span className="ml-1.5 text-amber-400 text-xs">{stars}</span>}
            {pkg.hotel_rating && <span className="ml-1.5 text-slate-400 text-xs">({pkg.hotel_rating}/10)</span>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <span className="text-sky-500">✈️</span>
          <span>{t("flightIncluded")}{pkg.flight_stops === 0 ? ` · ${t("direct")}` : ` · ${pkg.flight_stops} ${t("stops")}`}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <span className="text-sky-500">✓</span>
          <span> {t("conciergeFeeIncluded")}</span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between pt-1 border-t border-slate-100 mt-1">
          <div>
            <p className="text-xs text-slate-400">{t("perPerson")}</p>
            <p className="text-sm font-semibold text-slate-600">{isAzn ? "" : "$"}{displayPerPerson.toLocaleString()} {isAzn ? "AZN" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{t("totalPrice")} ({pkg.passengers} {t("travelers")})</p>
            <p className="text-2xl font-extrabold text-sky-600">
              {isAzn ? "" : "$"}{displayPrice.toLocaleString()} <span className="text-base">{isAzn ? "AZN" : "USD"}</span>
            </p>
          </div>
        </div>

        {/* CTA */}
        <a href={`https://wa.me/994517769632?text=${encodeURIComponent(pkg.wa_text)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white mt-1"
          style={{ background: "#25D366", boxShadow: "0 4px 14px rgba(37,211,102,0.35)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          {t("reserveWhatsApp")}
        </a>
      </div>
    </div>
  );
}

/* ─── Result Modal ───────────────────────────────────── */
function ResultModal({ onClose, result }: { onClose: () => void; result: SearchResult | null }) {
  const { t, language } = useLanguage();
  if (!result) return null;
  const { tours, ai_intro, dynamicPackage } = result;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ animation: "fadeIn .3s ease" }}>
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" style={{ animation: "slideUp .4s cubic-bezier(.34,1.56,.64,1)" }}>
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <span className="text-white font-bold text-base">Natoure AI Selection</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition"><X size={16} /></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {ai_intro && (
            <div className="bg-sky-50 border-l-4 border-sky-500 rounded-xl p-4 mb-4 text-left">
              <p className="text-slate-700 text-sm leading-relaxed m-0">{ai_intro}</p>
            </div>
          )}
          {dynamicPackage && <DynamicPackageCard pkg={dynamicPackage} />}
          {tours.length > 0 ? (
            <div className="flex flex-col gap-3 mb-4 text-left">
              {tours.map(tour => {
                const seatsLeft = tour.max_seats - tour.booked_seats;
                return (
                  <div key={tour.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-3 py-0.5 rounded-full">{tour.destination}</span>
                        <p className="mt-2 font-bold text-slate-800 text-sm leading-snug">{tour.name}</p>
                        {tour.hotel && <p className="text-xs text-slate-400 mt-1">🏨 {tour.hotel}</p>}
                        {seatsLeft > 0 && seatsLeft <= 3 && <span className="text-xs text-red-500 font-bold">{t("seatsLeft", { seats: String(seatsLeft) })}</span>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-extrabold text-sky-600 text-lg">{tour.price_azn} AZN</p>
                        <p className="text-xs text-slate-400">/{language === "az" ? "nəfər" : language === "tr" ? "kişi" : "person"}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 flex items-center justify-between px-4 py-2.5">
                      <a href={`/turlar/${tour.id}`} className="text-sm font-semibold text-sky-600 hover:underline">{language === "az" ? "Təfərrüatlara bax →" : language === "tr" ? "Detayları gör →" : "View details →"}</a>
                      <a href={waLink(language === "az" ? `Salam, "${tour.name}" turu haqqında ətraflı məlumat almaq istəyirəm.` : language === "tr" ? `Merhaba, "${tour.name}" turu hakkında detaylı bilgi almak istiyorum.` : `Hi, I would like to get more information about the "${tour.name}" tour.`)} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">WhatsApp ↗</a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center mb-4">{t("noToursFound")}</p>
          )}
          <a href="/turlar" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm">
            {t("viewAllTours")} <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function HomePage() {
  const { t, language } = useLanguage();
  const [prompt, setPrompt]           = useState("");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [isLoading, setIsLoading]     = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [quizDone, setQuizDone]       = useState(false);
  const [archetypeName, setArchetypeName] = useState("");

  // Location detection states
  const [userLocation, setUserLocation] = useState<{
    country: string;
    city: string;
    airportCode: string;
    airportName: string;
  } | null>(null);

  // Bento search tabs state
  const [activeTab, setActiveTab] = useState<"flights" | "hotels" | "cruises" | "trains" | "buses" | "tours">("flights");

  // Flight Search Form States
  const [flightOrigin, setFlightOrigin] = useState("");
  const [flightDest, setFlightDest] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [flightPassengers, setFlightPassengers] = useState(1);

  // Hotel Search Form States
  const [hotelDest, setHotelDest] = useState("");
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [hotelGuests, setHotelGuests] = useState(2);

  // Cruise Search Form States
  const [cruiseRegion, setCruiseRegion] = useState("Caribbean");
  const [cruiseDate, setCruiseDate] = useState("");

  // Train Search Form States
  const [trainOrigin, setTrainOrigin] = useState("");
  const [trainDest, setTrainDest] = useState("");
  const [trainDate, setTrainDate] = useState("");
  const [trainPassengers, setTrainPassengers] = useState(1);

  // Bus Search Form States
  const [busOrigin, setBusOrigin] = useState("");
  const [busDest, setBusDest] = useState("");
  const [busDate, setBusDate] = useState("");
  const [busPassengers, setBusPassengers] = useState(1);

  // Tour Search Form States
  const [tourRegion, setTourRegion] = useState("");
  const [tourMonth, setTourMonth] = useState("");

  useEffect(() => {
    // 1. Check user persona archetype
    const arch = localStorage.getItem("nf_archetype");
    const scores = localStorage.getItem("nf_dna_scores");
    if (arch && scores) { setQuizDone(true); }
    if (arch) {
      const labels: Record<string, Record<string, string>> = {
        efficiency_seeker: { az: "Dinamik Səyahətçi", en: "Dynamic Traveler", tr: "Dinamik Gezgin" },
        deep_relaxer:      { az: "Dərin Relaksator", en: "Deep Relaxer", tr: "Derin Dinlenici" },
        silent_explorer:   { az: "Sakit Explorer", en: "Silent Explorer", tr: "Sessiz Kaşif" },
        budget_optimizer:  { az: "Büdcə Ustası", en: "Budget Optimizer", tr: "Bütçe Uzmanı" },
        luxury_curator:    { az: "Lüks Kurator", en: "Luxury Curator", tr: "Lüks Küratör" },
      };
      setArchetypeName(labels[arch]?.[language] || arch);
    }

    // 2. Perform Dynamic Auto-Location Resolution
    async function detectLocation() {
      try {
        const res = await fetch("/api/location");
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setUserLocation({
              country: data.country,
              city: data.city,
              airportCode: data.nearestAirport.code,
              airportName: data.nearestAirport.name,
            });
            // Pre-populate flight origin dynamically!
            setFlightOrigin(data.nearestAirport.code);
            setTrainOrigin(data.city);
            setBusOrigin(data.city);
          }
        }
      } catch (err) {
        console.error("Auto-location failed:", err);
      }
    }
    detectLocation();
  }, [language]);

  const handleGenerate = async (customPrompt?: string) => {
    const activePrompt = customPrompt || prompt;
    if (!activePrompt.trim() || isLoading) return;
    setIsLoading(true); setLoadingStep(0);
    const timers = LOADING_STEPS.map((_, i) => setTimeout(() => setLoadingStep(i), i * 900));
    try {
      const sessionToken = localStorage.getItem("nf_session_token") ?? undefined;
      const res = await fetch("/api/ai-search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          session_token: sessionToken,
          origin: flightOrigin || userLocation?.airportCode || "JFK" // Dynamically route flight parameters globally!
        }),
      });
      const data = await res.json();
      timers.forEach(clearTimeout);
      setIsLoading(false); setLoadingStep(-1);
      setSearchResult(data.ok
        ? { tours: data.tours || [], ai_intro: data.ai_intro || "", fallback: data.fallback ?? false, dynamicPackage: data.dynamicPackage ?? null }
        : {
            tours: [],
            ai_intro: language === "az"
              ? "Axtarış zamanı xəta baş verdi."
              : language === "tr"
              ? "Arama sırasında bir hata oluştu."
              : "An error occurred during the search.",
            fallback: true
          });
    } catch {
      timers.forEach(clearTimeout);
      setIsLoading(false); setLoadingStep(-1);
      setSearchResult({
        tours: [],
        ai_intro: language === "az"
          ? "Bağlantı xətası. Yenidən cəhd edin."
          : language === "tr"
          ? "Bağlantı hatası. Lütfen tekrar deneyin."
          : "Connection error. Please try again.",
        fallback: true
      });
    }
  };

  const handleTabSearch = async () => {
    let queryPrompt = "";
    if (activeTab === "flights") {
      if (!flightDest.trim() || !flightDate) return;
      queryPrompt = `Search flights from ${flightOrigin || "JFK"} to ${flightDest} on ${flightDate} for ${flightPassengers} passengers`;
    } else if (activeTab === "hotels") {
      if (!hotelDest.trim() || !hotelCheckIn || !hotelCheckOut) return;
      queryPrompt = `Search hotels in ${hotelDest} checking in on ${hotelCheckIn} and checking out on ${hotelCheckOut} for ${hotelGuests} guests`;
    } else if (activeTab === "cruises") {
      if (!cruiseDate) return;
      queryPrompt = `Search cruises to ${cruiseRegion} starting on ${cruiseDate}`;
    } else if (activeTab === "trains") {
      if (!trainOrigin.trim() || !trainDest.trim() || !trainDate) return;
      queryPrompt = `Search trains from ${trainOrigin} to ${trainDest} on ${trainDate} for ${trainPassengers} passengers`;
    } else if (activeTab === "buses") {
      if (!busOrigin.trim() || !busDest.trim() || !busDate) return;
      queryPrompt = `Search buses from ${busOrigin} to ${busDest} on ${busDate} for ${busPassengers} passengers`;
    } else if (activeTab === "tours") {
      if (!tourRegion.trim()) return;
      queryPrompt = `Search package tours to ${tourRegion} ${tourMonth ? "in " + tourMonth : ""}`;
    }

    if (!queryPrompt) return;
    setPrompt(queryPrompt);
    await handleGenerate(queryPrompt);
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

        <div className="relative z-10 w-full max-w-4xl mx-auto">
          {userLocation ? (
            <div className="fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wide mb-8 border border-emerald-100 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {t("heroGreeting", {
                city: userLocation.city,
                country: userLocation.country,
                airport: `${userLocation.airportCode} (${userLocation.airportName})`
              })}
            </div>
          ) : (
            <div className="fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold tracking-widest uppercase mb-8">
              <Sparkles size={12} /> {t("heroBadge")}
            </div>
          )}

          {/* Main headline */}
          <h1 className="fade-in-up text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] text-slate-900 mb-6 tracking-tight"
            style={{ animationDelay: ".1s" }}>
            {t("heroTitleStart")}{" "}
            <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">{t("heroTitleMiddle")}</span>{" "}
            {t("heroTitleEnd")}
          </h1>

          <p className="fade-in-up text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: ".2s" }}>
            {t("heroSubtitle")}
          </p>

          {/* CTAs */}
          <div className="fade-in-up flex flex-col sm:flex-row gap-3 justify-center mb-10" style={{ animationDelay: ".25s" }}>
            <button
              onClick={() => { const el = document.getElementById("quiz-section"); el?.scrollIntoView({ behavior: "smooth" }); }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 12px 32px rgba(2,132,199,.4)" }}>
              {t("startDna")} <ArrowRight size={18} />
            </button>
            <button
              onClick={() => { const el = document.getElementById("ai-chat-trigger"); (el as HTMLButtonElement)?.click(); }}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-700 border-2 border-slate-200 hover:border-sky-300 hover:bg-white/80 transition-all bg-white/60 backdrop-blur">
              <Brain size={18} className="text-sky-600" /> {t("startGuide")}
            </button>
          </div>

          {/* Stats */}
          <div className="fade-in-up grid grid-cols-3 gap-4 mb-10" style={{ animationDelay: ".3s" }}>
            {[
              { val: "99%", label: t("statsMatch") },
              { val: "50+", label: t("statsDest") },
              { val: "24/7", label: t("statsSupport") },
            ].map(s => (
              <div key={s.val} className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-sky-600 mb-1" style={{ animation: "countUp 0.6s ease both" }}>{s.val}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bento Search Tabs */}
          <div className="fade-in-up bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl ring-1 ring-slate-200/50 mb-8 border border-white" style={{ animationDelay: ".35s" }}>
            {/* Tabs Selector */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
              {[
                { id: "flights", label: t("flights"), icon: <Plane size={15} /> },
                { id: "hotels", label: t("hotelsTab"), icon: <Bed size={15} /> },
                { id: "cruises", label: t("cruises"), icon: <Ship size={15} /> },
                { id: "trains", label: t("trains"), icon: <Train size={15} /> },
                { id: "buses", label: t("buses"), icon: <Bus size={15} /> },
                { id: "tours", label: t("toursTab"), icon: <Compass size={15} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-sky-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Tab Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {activeTab === "flights" && (
                <>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("from")}</label>
                    <input
                      type="text"
                      value={flightOrigin}
                      onChange={e => setFlightOrigin(e.target.value.toUpperCase())}
                      placeholder="e.g. JFK or GYD"
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("to")}</label>
                    <input
                      type="text"
                      value={flightDest}
                      onChange={e => setFlightDest(e.target.value.toUpperCase())}
                      placeholder="e.g. DXB or LHR"
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("date")}</label>
                    <input
                      type="date"
                      value={flightDate}
                      onChange={e => setFlightDate(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("passengers")}</label>
                    <select
                      value={flightPassengers}
                      onChange={e => setFlightPassengers(Number(e.target.value))}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n > 1 ? t("travelers") : t("traveler")}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === "hotels" && (
                <>
                  <div className="flex flex-col text-left md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("to")}</label>
                    <input
                      type="text"
                      value={hotelDest}
                      onChange={e => setHotelDest(e.target.value)}
                      placeholder={language === "az" ? "Hara gedirsiniz? (məs. Paris, Dubay)" : language === "tr" ? "Nereye gidiyorsunuz? (örn. Paris, Dubai)" : "Where are you staying? (e.g. Paris, Dubai)"}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("checkIn")}</label>
                    <input
                      type="date"
                      value={hotelCheckIn}
                      onChange={e => setHotelCheckIn(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("checkOut")}</label>
                    <input
                      type="date"
                      value={hotelCheckOut}
                      onChange={e => setHotelCheckOut(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                </>
              )}

              {activeTab === "cruises" && (
                <>
                  <div className="flex flex-col text-left md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{language === "az" ? "Kruiz Regionu" : language === "tr" ? "Kruvaziyer Bölgesi" : "Cruise Region"}</label>
                    <select
                      value={cruiseRegion}
                      onChange={e => setCruiseRegion(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm bg-white"
                    >
                      {["Caribbean", "Mediterranean", "Alaska", "Europe", "Asia"].map(n => {
                        const nameMap: Record<string, string> = {
                          Caribbean: language === "az" ? "Karib dənizi" : language === "tr" ? "Karayipler" : "Caribbean",
                          Mediterranean: language === "az" ? "Aralıq dənizi" : language === "tr" ? "Akdeniz" : "Mediterranean",
                          Alaska: "Alaska",
                          Europe: language === "az" ? "Avropa" : language === "tr" ? "Avrupa" : "Europe",
                          Asia: language === "az" ? "Asiya" : language === "tr" ? "Asya" : "Asia",
                        };
                        return <option key={n} value={n}>{nameMap[n] || n}</option>;
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col text-left md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("date")}</label>
                    <input
                      type="date"
                      value={cruiseDate}
                      onChange={e => setCruiseDate(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                </>
              )}

              {activeTab === "trains" && (
                <>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("from")}</label>
                    <input
                      type="text"
                      value={trainOrigin}
                      onChange={e => setTrainOrigin(e.target.value)}
                      placeholder={language === "az" ? "məs. London və ya Nyu-York" : language === "tr" ? "örn. Londra veya New York" : "e.g. London or New York"}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("to")}</label>
                    <input
                      type="text"
                      value={trainDest}
                      onChange={e => setTrainDest(e.target.value)}
                      placeholder={language === "az" ? "məs. Paris və ya Vaşinqton" : language === "tr" ? "örn. Paris veya Washington D.C." : "e.g. Paris or Washington D.C."}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("date")}</label>
                    <input
                      type="date"
                      value={trainDate}
                      onChange={e => setTrainDate(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("passengers")}</label>
                    <select
                      value={trainPassengers}
                      onChange={e => setTrainPassengers(Number(e.target.value))}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n > 1 ? t("travelers") : t("traveler")}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === "buses" && (
                <>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("from")}</label>
                    <input
                      type="text"
                      value={busOrigin}
                      onChange={e => setBusOrigin(e.target.value)}
                      placeholder={language === "az" ? "Gediş şəhəri" : language === "tr" ? "Kalkış şehri" : "Departure City"}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("to")}</label>
                    <input
                      type="text"
                      value={busDest}
                      onChange={e => setBusDest(e.target.value)}
                      placeholder={language === "az" ? "Təyinat şəhəri" : language === "tr" ? "Varış şehri" : "Arrival City"}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("date")}</label>
                    <input
                      type="date"
                      value={busDate}
                      onChange={e => setBusDate(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("passengers")}</label>
                    <select
                      value={busPassengers}
                      onChange={e => setBusPassengers(Number(e.target.value))}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n > 1 ? t("travelers") : t("traveler")}</option>)}
                    </select>
                  </div>
                </>
              )}

              {activeTab === "tours" && (
                <>
                  <div className="flex flex-col text-left md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t("to")}</label>
                    <input
                      type="text"
                      value={tourRegion}
                      onChange={e => setTourRegion(e.target.value)}
                      placeholder={language === "az" ? "məs. Dubay, Avropa, Antalya" : language === "tr" ? "örn. Dubai, Avrupa, Antalya" : "e.g. Dubai, Europe, Antalya"}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm"
                    />
                  </div>
                  <div className="flex flex-col text-left md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">{language === "az" ? "Üstünlük verilən ay" : language === "tr" ? "Tercih edilen ay" : "Preferred Month"}</label>
                    <select
                      value={tourMonth}
                      onChange={e => setTourMonth(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm bg-white"
                    >
                      <option value="">{language === "az" ? "Hər hansı bir ay" : language === "tr" ? "Herhangi bir ay" : "Any Month"}</option>
                      {["June", "July", "August", "September", "October", "November"].map(m => {
                        const monthMap: Record<string, string> = {
                          June: language === "az" ? "İyun" : language === "tr" ? "Haziran" : "June",
                          July: language === "az" ? "İyul" : language === "tr" ? "Temmuz" : "July",
                          August: language === "az" ? "Avqust" : language === "tr" ? "Ağustos" : "August",
                          September: language === "az" ? "Sentyabr" : language === "tr" ? "Eylül" : "September",
                          October: language === "az" ? "Oktyabr" : language === "tr" ? "Ekim" : "October",
                          November: language === "az" ? "Noyabr" : language === "tr" ? "Kasım" : "November",
                        };
                        return <option key={m} value={m}>{monthMap[m] || m}</option>;
                      })}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Structured Search Trigger & Natural Language Toggle */}
            <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-5 gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-500">
                  {language === "az"
                    ? "Sürətli, premium marşrutlaşdırma birbaşa təyin olunur."
                    : language === "tr"
                    ? "Hızlı, premium rotalama doğrudan belirlenir."
                    : "Fast, premium routing directly resolved."}
                </span>
              </div>
              <button
                onClick={handleTabSearch}
                disabled={isLoading}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-sm text-white transition-all shadow-md bg-gradient-to-r from-sky-600 to-indigo-600 hover:shadow-lg disabled:bg-slate-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("searching")}
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    {t("searchNow")}
                  </>
                )}
              </button>
            </div>

            {/* Or Natural Language Prompt area */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3 text-left">{t("orPrompt")}</p>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleGenerate(); }}
                  placeholder={t("placeholderPrompt")}
                  className="w-full min-h-[80px] p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 text-sm leading-relaxed outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleGenerate()}
                  disabled={isLoading || !prompt.trim()}
                  className="absolute right-3 bottom-3 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white transition-all"
                  style={{
                    background: isLoading || !prompt.trim() ? "#cbd5e1" : "linear-gradient(135deg,#0284c7,#4f46e5)",
                    cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  <Sparkles size={12} />
                  {t("aiAskButton")}
                </button>
              </div>
            </div>
          </div>

          {/* Quiz section */}
          <div id="quiz-section" className="fade-in-up flex justify-center mb-6" style={{ animationDelay: ".45s" }}>
            <QuizWidget onComplete={() => {
              const arch   = localStorage.getItem("nf_archetype");
              const scores = localStorage.getItem("nf_dna_scores");
              if (arch && scores) {
                const labels: Record<string, Record<string, string>> = {
                  efficiency_seeker: { az: "Dinamik Səyahətçi", en: "Dynamic Traveler", tr: "Dinamik Gezgin" },
                  deep_relaxer:      { az: "Dərin Relaksator", en: "Deep Relaxer", tr: "Derin Dinlenici" },
                  silent_explorer:   { az: "Sakit Explorer", en: "Silent Explorer", tr: "Sessiz Kaşif" },
                  budget_optimizer:  { az: "Büdcə Ustası", en: "Budget Optimizer", tr: "Bütçe Uzmanı" },
                  luxury_curator:    { az: "Lüks Kurator", en: "Luxury Curator", tr: "Lüks Küratör" },
                };
                setQuizDone(true);
                setArchetypeName(labels[arch]?.[language] || arch);
              }
            }} />
          </div>

        </div>
      </section>

      {/* ── DNA PROFILE (quiz bitibsə) ─────────────────── */}
      {quizDone && (
        <section className="px-4 py-16 bg-[#0a0f1e]">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <p className="text-[11px] text-sky-400 font-bold uppercase tracking-widest mb-3">
                  {language === "az" ? "Sizin Profiliniz" : language === "tr" ? "Profiliniz" : "Your Profile"}
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                  {language === "az" ? (
                    <>Səyahət DNT-niz<br /><span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">analiz edildi</span></>
                  ) : language === "tr" ? (
                    <>Seyahat DNA'nız<br /><span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">analiz edildi</span></>
                  ) : (
                    <>Your Travel DNA<br /><span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Analyzed</span></>
                  )}
                </h2>
                <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-sm">
                  {language === "az"
                    ? "Turlar sizin psixometrik profilinizə görə sıralanır. Ən uyğun variantlar ən yuxarıda görünür."
                    : language === "tr"
                    ? "Turlar psikometrik profilinize göre sıralanır. En uygun seçenekler en üstte görünür."
                    : "Tours are ranked according to your psychometric profile. The most compatible matches appear at the top."}
                </p>
                <a href="/turlar"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 8px 24px rgba(2,132,199,.35)" }}>
                  {language === "az" ? "Turlarıma Bax" : language === "tr" ? "Turlarıma Bak" : "View My Tours"} <ArrowRight size={16} />
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
              <p className="text-[11px] text-sky-600 font-bold uppercase tracking-widest mb-3">
                {language === "az" ? "Holistik Marşrut" : language === "tr" ? "Bütünsel Seyahat Programı" : "Holistic Itinerary"}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">
                {language === "az" ? (
                  <>Saatbasaat planlanmış<br /><span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">tam proqram</span></>
                ) : language === "tr" ? (
                  <>Saat saat planlanmış<br /><span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">tam program</span></>
                ) : (
                  <>Hour-by-hour planned<br /><span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">complete program</span></>
                )}
              </h2>
              <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-sm">
                {language === "az"
                  ? "Yalnız bilet deyil — hər günün planı, yerli restoranlar, gizli məkanlar, büdcə izlənməsi. Hamısı bir yerdə."
                  : language === "tr"
                  ? "Sadece bilet değil — her günün planı, yerel restoranlar, gizli noktalar, bütçe takibi. Hepsi bir arada."
                  : "Not just a ticket — every day's plan, local restaurants, hidden spots, budget tracking. All in one place."}
              </p>
              <a href="/turlar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 8px 24px rgba(2,132,199,.35)" }}>
                {language === "az" ? "Nümunə Marşrut Gör" : language === "tr" ? "Örnek Programı Gör" : "See Sample Itinerary"} <ArrowRight size={16} />
              </a>
            </div>

            {/* Right: preview card */}
            <div className="flex-1 w-full max-w-md">
              <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shadow-lg">
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                  <p className="text-[10px] text-sky-600 font-bold uppercase tracking-widest mb-1">
                    {language === "az" ? "HOLİSTİK MARŞRUT — SAATBASAAT" : language === "tr" ? "BÜTÜNSEL SEYAHAT PROGRAMI — SAAT SAAT" : "HOLISTIC ITINERARY — HOUR-BY-HOUR"}
                  </p>
                  <h3 className="text-2xl font-black text-slate-900">
                    {language === "az" ? "London, 7 gün" : language === "tr" ? "Londra, 7 gün" : "London, 7 days"}
                  </h3>
                </div>
                <div className="px-6 py-4 space-y-0">
                  {[
                    {
                      day: "G1",
                      title: language === "az" ? "Varış & Notting Hill" : language === "tr" ? "Varış & Notting Hill" : "Arrival & Notting Hill",
                      sub: language === "az" ? "Portobello Market, gizli İtalyan restoranı" : language === "tr" ? "Portobello Pazarı, gizli İtalyan restoranı" : "Portobello Market, hidden Italian restaurant",
                      tags: [language === "az" ? "Sakit" : language === "tr" ? "Sakin" : "Quiet", language === "az" ? "Autentik" : language === "tr" ? "Otantik" : "Authentic"]
                    },
                    {
                      day: "G2",
                      title: language === "az" ? "British Museum & Bloomsbury" : language === "tr" ? "British Museum & Bloomsbury" : "British Museum & Bloomsbury",
                      sub: language === "az" ? "Açılışdan əvvəl qalereyaya xüsusi giriş" : language === "tr" ? "Açılış öncesi galeriye özel giriş" : "Special gallery access before opening",
                      tags: [language === "az" ? "Muzey" : language === "tr" ? "Müze ağırlıklı" : "Museum-heavy", language === "az" ? "Mədəniyyət" : language === "tr" ? "Kültür" : "Culture"]
                    },
                    {
                      day: "G3",
                      title: language === "az" ? "Thames & Tate Modern" : language === "tr" ? "Thames & Tate Modern" : "Thames & Tate Modern",
                      sub: language === "az" ? "Çay kənarı, Borough Market, qalereyalar" : language === "tr" ? "Nehir kenarı, Borough Market, galeriler" : "Riverside walk, Borough Market, galleries",
                      tags: [language === "az" ? "Sənət" : language === "tr" ? "Sanat" : "Art", language === "az" ? "Yerli" : language === "tr" ? "Yerel" : "Local"]
                    },
                    {
                      day: "+4",
                      title: language === "az" ? "4 gün tam planlaşdırılıb" : language === "tr" ? "4 gün tam planlanmış" : "4 days fully planned",
                      sub: language === "az" ? "Gizli nöqtələr, yerli icma, büdcə izlənməsi" : language === "tr" ? "Gizli noktalar, yerel rehberlik, bütçe takibi" : "Hidden gems, local guide, budget tracking",
                      tags: [language === "az" ? "AI seçimi" : language === "tr" ? "AI Seçimi" : "AI Choice"]
                    }
                  ].map((item, i, arr) => (
                    <div key={i} className="flex gap-4 group py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
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
                        {i < arr.length - 1 && (
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
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {language === "az" ? "BÜDCƏ ŞƏFFAFLIĞI" : language === "tr" ? "BÜTÇE ŞEFFAFLIĞI" : "BUDGET TRANSPARENCY"}
                  </span>
                  <span className="text-sky-400 text-xs font-bold">
                    {language === "az" ? "$2,500 büdcə üçün real çıxış →" : language === "tr" ? "$2,500 bütçe için gerçek plan →" : "Real output for $2,500 budget →"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ──────────────────────────────────── */}
      <section className="px-4 py-14 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">
            {language === "az" ? "Dünya Sizi Gözləyir" : language === "tr" ? "Dünya Sizi Bekliyor" : "The World Awaits You"}
          </p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-10">
            {language === "az" ? "Populyar Məkanlar" : language === "tr" ? "Popüler Destinasyonlar" : "Popular Destinations"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[160px] sm:auto-rows-[200px]">
            {[
              { name: language === "az" ? "Dubay" : "Dubai", country: language === "az" ? "BƏƏ" : language === "tr" ? "BAE" : "UAE", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", big: true },
              { name: language === "az" ? "Maldiv Adaları" : language === "tr" ? "Maldivler" : "Maldives", country: language === "az" ? "Hind Okeanı" : language === "tr" ? "Hint Okyanusu" : "Indian Ocean", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80" },
              { name: "Antalya", country: language === "az" ? "Türkiyə" : language === "tr" ? "Türkiye" : "Turkey", img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80" },
              { name: "Paris", country: language === "az" ? "Fransa" : language === "tr" ? "Fransa" : "France", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80" },
              { name: "Bali", country: language === "az" ? "İndoneziya" : language === "tr" ? "Endonezya" : "Indonesia", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
              { name: language === "az" ? "Barselona" : "Barcelona", country: language === "az" ? "İspaniya" : language === "tr" ? "İspanya" : "Spain", img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80" },
              { name: language === "az" ? "Tokio" : "Tokyo", country: language === "az" ? "Yaponiya" : language === "tr" ? "Japonya" : "Japan", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
              { name: language === "az" ? "Roma" : "Rome", country: language === "az" ? "İtaliya" : language === "tr" ? "İtalya" : "Italy", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80" },
            ].map((d, i) => (
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
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">
            {language === "az" ? "Sadə Prosess" : language === "tr" ? "Kolay Süreç" : "Simple Process"}
          </p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-14">
            {language === "az" ? "Necə İşləyir?" : language === "tr" ? "Nasıl Çalışır?" : "How It Works?"}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            {[
              { n: "01", icon: <Brain size={28} className="text-sky-600" />, title: language === "az" ? "DNT-ni Müəyyən Et" : language === "tr" ? "DNA'yı Keşfet" : "Discover DNA", desc: language === "az" ? "10 sual psixometrik quiz-lə səyahət profilin çıxarılır. OCEAN + Plog modeli əsasında." : language === "tr" ? "10 soruluk psikometrik quiz ile seyahat profiliniz çıkarılır. OCEAN + Plog modeline dayalı." : "10-question psychometric quiz constructs your travel profile based on OCEAN + Plog models." },
              { n: "02", icon: <Zap size={28} className="text-indigo-600" />, title: language === "az" ? "AI Analiz Edir" : language === "tr" ? "AI Analiz Eder" : "AI Analyzes", desc: language === "az" ? "Minlərlə uçuş, otel, fəaliyyət saniyələr içində süzgəcdən keçirilir. Yalnız sənə uyğunlar qalır." : language === "tr" ? "Binlerce uçuş, otel ve aktivite saniyeler içinde süzgeçten geçirilir. Yalnız size uyanlar kalır." : "Thousands of flights, hotels, and activities filtered in seconds. Only the best fits remain." },
              { n: "03", icon: <Plane size={28} className="text-sky-600" />, title: language === "az" ? "Tam Proqram Al" : language === "tr" ? "Tam Programı Al" : "Get Itinerary", desc: language === "az" ? "Gün-gün, saat-saat marşrut. Büdcə şəffaflığı. Rezervasiya bir kliklə." : language === "tr" ? "Gün gün, saat saat seyahat rotanız. Bütçe şeffaflığı. Tek tıkla rezervasyon." : "Day-by-day, hour-by-hour route. Clear budgeting. Booking in a single click." },
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
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">
            {language === "az" ? "Niyə Natoure?" : language === "tr" ? "Neden Natoure?" : "Why Natoure?"}
          </p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-12">
            {language === "az" ? "Tam Səyahət Təcrübəsi" : language === "tr" ? "Eksiksiz Seyahat Deneyimi" : "Complete Travel Experience"}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Calendar size={24} className="text-sky-600" />, tag: language === "az" ? "Səyahət Öncəsi" : language === "tr" ? "Seyahat Öncesi" : "Pre-Travel", title: language === "az" ? "Mükəmməl Plan" : language === "tr" ? "Mükemmel Planlama" : "Perfect Planning", desc: language === "az" ? "Viza, sığorta, otel, uçuş — hər şey bir yerdə." : language === "tr" ? "Vize, sigorta, otel, uçuş — her şey tek bir kontrol panelinde." : "Visa, insurance, hotel, flight — everything in one dashboard.", bg: "bg-sky-50", border: "border-sky-100" },
              { icon: <Shield size={24} className="text-indigo-600" />, tag: language === "az" ? "Səyahətdə" : language === "tr" ? "Seyahat Sırasında" : "During Travel",  title: language === "az" ? "24/7 Dəstək" : language === "tr" ? "24/7 AI Desteği" : "24/7 AI Assistance",  desc: language === "az" ? "Səyahət zamanı istənilən problemdə AI köməyiniz hazırdır." : language === "tr" ? "Seyahat sırasında yaşanabilecek her türlü sorunda AI asistanınız hazır." : "AI concierge is ready to assist you in real-time with any travel disruptions.", bg: "bg-indigo-50", border: "border-indigo-100" },
              { icon: <TrendingUp size={24} className="text-sky-500" />, tag: language === "az" ? "Ağıllı Qiymət" : language === "tr" ? "Akıllı Fiyatlandırma" : "Smart Pricing", title: language === "az" ? "Ən Yaxşı Qiymət" : language === "tr" ? "En İyi Fiyat" : "Best Fare Finder", desc: language === "az" ? "AI real-time qiymət analizi aparır, ən sərfəli tarifi tapır." : language === "tr" ? "AI gerçek zamanlı fiyat analizi yapar, en hesaplı tarifeyi bulur." : "AI runs real-time price monitoring, selecting only the optimal booking tariffs.", bg: "bg-sky-50", border: "border-sky-100" },
              { icon: <Sparkles size={24} className="text-violet-600" />, tag: language === "az" ? "Səyahət Sonrası" : language === "tr" ? "Seyahat Sonrası" : "Post-Travel", title: language === "az" ? "Növbəti Tövsiyə" : language === "tr" ? "Sıradaki Öneri" : "Next Recommendations", desc: language === "az" ? "Rəylər, fotolar və növbəti mükəmməl tur tövsiyəsi." : language === "tr" ? "Yorumlar, fotoğraflar ve bir sonraki mükemmel seyahatiniz için akıllı öneriler." : "Share reviews, capture memories, and get recommendations for your next perfect trip.", bg: "bg-violet-50", border: "border-violet-100" },
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


      {/* ── REVIEWS ─────────────────────────────────────── */}
      <section style={{ background: "#0b0b0b" }}>
        <ReviewsSection />
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-14 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl p-14 text-center text-white" style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 30px 80px rgba(2,132,199,.3)" }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              {language === "az" ? "Səyahətinizi Planlamağa Hazırsınız?" : language === "tr" ? "Seyahatinizi Planlamaya Hazır mısınız?" : "Ready to Plan Your Next Journey?"}
            </h2>
            <p className="text-white/80 text-base mb-10 leading-relaxed">
              {language === "az" ? "İlk AI ilə planlanmış turunu pulsuz sınayın. Heç bir ödəniş tələb olunmur." : language === "tr" ? "Yapay zeka tarafından planlanan ilk seyahatinizi ücretsiz deneyin." : "Try your first AI-curated itinerary for free. No credit card required."}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-7 py-3.5 rounded-2xl bg-white text-sky-700 font-bold text-base hover:-translate-y-0.5 transition-transform flex items-center gap-2">
                {language === "az" ? "İndi Başla" : language === "tr" ? "Şimdi Başla" : "Start Now"} <ArrowRight size={18} />
              </button>
              <a href="/haqqimizda" className="px-7 py-3.5 rounded-2xl font-semibold text-base text-white border border-white/40 bg-white/15 hover:bg-white/25 transition backdrop-blur">
                {language === "az" ? "Bizi Tanı" : language === "tr" ? "Bizi Tanıyın" : "Discover Us"}
              </a>
            </div>
          </div>
        </div>
      </section>

      <NewsletterSection />

      {/* Result Modal */}
      {searchResult && <ResultModal onClose={() => setSearchResult(null)} result={searchResult} />}
    </>
  );
}
