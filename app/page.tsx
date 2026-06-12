"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles, Check, Plane,
  Calendar, ArrowRight, Lock, RefreshCw,
  Brain, Zap, Shield, TrendingUp,
} from "lucide-react";
import { applyNatoureMarkup } from "@/lib/markup";
import { SERVICES, serviceHref, serviceIsExternal } from "@/lib/services";
import { useLanguage } from "@/components/LanguageContext";
import NewsletterSection from "@/components/NewsletterSection";
import ReviewsSection from "@/components/ReviewsSection";
import { getSupabase } from "@/lib/supabase";

/* ─── Interfaces ───────────────────────────────────── */
interface FlightOffer {
  id: string;
  airline: string;
  logoText?: string;
  departure: string;
  arrival?: string;
  duration: string;
  type: string;
  rawPrice: number;
}

interface HotelOffer {
  id: string;
  name: string;
  stars: number;
  rating: number;
  rawPricePerNight: number;
  image: string;
  location: string;
  roomType?: string;
  meal?: string;
  bookHash?: string;
  photos?: string[];
  facilities?: string[];
}

interface CarOffer {
  id: string;
  name: string;
  category: string;
  rawPricePerDay: number;
  image: string;
}

interface Msg {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

/* ─── Mock Data ─────────────────────────────────────── */
const MOCK_FLIGHTS: FlightOffer[] = [
  { id: "fl_1", airline: "Delta Air Lines", logoText: "DL", departure: "16:00 NYC", arrival: "19:15 SFO", duration: "6h 15m", type: "Birbaşa (Direct)", rawPrice: 340 },
  { id: "fl_2", airline: "United Airlines", logoText: "UA", departure: "08:30 NYC", arrival: "14:10 SFO", duration: "8h 40m", type: "1 Dayanacaq (1 Stop)", rawPrice: 380 },
  { id: "fl_3", airline: "JetBlue Airways", logoText: "B6", departure: "19:30 NYC", arrival: "22:50 SFO", duration: "6h 20m", type: "Birbaşa (Direct)", rawPrice: 310 },
];

const MOCK_HOTELS: HotelOffer[] = [
  { id: "ht_1", name: "Stanford Court San Francisco", stars: 4, rating: 8.2, rawPricePerNight: 130, location: "Nob Hill, San Francisco", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80" },
  { id: "ht_2", name: "Hotel Riu Plaza Fisherman's Wharf", stars: 4, rating: 8.6, rawPricePerNight: 150, location: "Fisherman's Wharf, San Francisco", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80" },
  { id: "ht_3", name: "Argonaut Hotel San Francisco", stars: 4, rating: 8.9, rawPricePerNight: 180, location: "Maritime National Park, San Francisco", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80" },
];

const MOCK_CARS: CarOffer[] = [
  { id: "cr_1", name: "Toyota Corolla və ya oxşar", category: "Ekonom (Economy)", rawPricePerDay: 45, image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80" },
  { id: "cr_2", name: "Jeep Grand Cherokee və ya oxşar", category: "SUV (Premium)", rawPricePerDay: 80, image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80" },
  { id: "cr_3", name: "Ford Mustang Convertible", category: "Kabriolet (Lüks)", rawPricePerDay: 110, image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80" },
];

const UPGRADE_ALTERNATIVES: HotelOffer[] = [
  { id: "up_1", name: "St. Regis San Francisco", stars: 5, rating: 9.4, rawPricePerNight: 350, location: "SoMa, San Francisco", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80" },
  { id: "up_2", name: "Four Seasons Hotel San Francisco", stars: 5, rating: 9.2, rawPricePerNight: 330, location: "Union Square, San Francisco", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80" },
];

export default function HomePage() {
  const { t, language } = useLanguage();

  const ui = {
    aiLabel:     language === "tr" ? "AI Seyahat Danışmanı"   : language === "en" ? "AI Travel Advisor"         : "AI Səyahət Müşaviri",
    aiTitle:     language === "tr" ? "Seyahat planınızı girin" : language === "en" ? "Enter your travel plan"    : "Səyahət planınızı daxil edin",
    aiDesc:      language === "tr"
      ? "Yapay zeka isteğinizi gerçek zamanlı filtrelere bölerek adım adım arama paneli açacak."
      : language === "en"
      ? "AI will break your request into real-time filters and open a step-by-step search panel."
      : "Süni intellekt istəyinizi real-time filtrlərə böləcək və zərif addım-addım axtarış paneli açacaq.",
    aiPlaceholder: language === "tr"
      ? "New York'tan San Francisco'ya 16 Temmuz'da gitmek istiyoruz, 2 kişi. Bütçemiz 2500 dolar. 4 yıldızlı otel, puan 7+. 1 hafta kalacağız. Araç kiralama da istiyoruz."
      : language === "en"
      ? "We want to fly from New York to San Francisco on July 16th, 2 people. Budget $2500. 4-star hotel, rating 7+. Staying 1 week. We also want a rental car in San Francisco."
      : "New Yorkdan San Franciscoya getmək istəyirik, 16 iyulda, iki nəfərik. Büdcəmiz 2500 dollardı. 4* otel, reytinqi 7+ olsun. 1 həftə qalacağıq. San Fransiskoda rent a car da istəyirik.",
    aiButton:    language === "tr" ? "Plan Oluştur & Aramaya Başla" : language === "en" ? "Build Plan & Start Search"  : "Planı Hazırla & Axtarışa Başla",
    aiAnalyzing: language === "tr" ? "Plan Analiz Ediliyor..."      : language === "en" ? "Analyzing Plan..."           : "Plan Analiz Edilir...",
    aiPlanLabel: language === "tr" ? "AI Seyahat Planı"             : language === "en" ? "AI Travel Plan"              : "AI Səyahət Planı",
  };

  // Screens: 'landing' | 'itinerary' | 'wizard' | 'orchestration' | 'upgrade' | 'final'
  const [screen, setScreen] = useState<"landing" | "itinerary" | "wizard" | "orchestration" | "upgrade" | "final">("landing");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Salam! Natoure smart bələdçinizəm. Səyahət xəyalınızı qeyd edin, planı hazırlayım.", timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [parsedParams, setParsedParams] = useState({
    origin: "NYC",
    destination: "SFO",
    departure_date: "16 İyul 2026",
    duration_days: 7,
    travelers_count: 2,
    budget: 2500,
    hotel_stars: 4,
    hotel_rating: 7
  });

  // Wizard steps: 'flight' | 'hotel' | 'car' | 'checkout'
  const [wizardStep, setWizardStep] = useState<"flight" | "hotel" | "car" | "checkout">("flight");

  // Round-trip / One-way
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");

  // Selections
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarOffer | null>(null);
  const [alternativeHotel, setAlternativeHotel] = useState<HotelOffer | null>(null);
  const [hotelDrawer, setHotelDrawer] = useState<HotelOffer | null>(null);

  // Search trigger states
  const [searchingFlights, setSearchingFlights] = useState(false);
  const [flightsList, setFlightsList] = useState<FlightOffer[]>([]);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [searchingHotels, setSearchingHotels] = useState(false);
  const [hotelsList, setHotelsList] = useState<HotelOffer[]>([]);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [searchingCars, setSearchingCars] = useState(false);
  const [carsList, setCarsList] = useState<CarOffer[]>([]);

  // Passport inputs
  const [passenger1, setPassenger1] = useState({ firstName: "", lastName: "", passport: "", dob: "", expiry: "" });
  const [passenger2, setPassenger2] = useState({ firstName: "", lastName: "", passport: "", dob: "", expiry: "" });

  // Orchestrator simulation states
  const [orchStep, setOrchStep] = useState(0); // 0: Payment verified, 1: Flight PNR booked, 2: Hotel booking failed
  const [orchProgress, setOrchProgress] = useState(0);


  const totalNights = parsedParams.duration_days;
  const markupFlightPrice = selectedFlight ? applyNatoureMarkup(selectedFlight.rawPrice) * parsedParams.travelers_count : 0;
  const markupHotelPrice = selectedHotel ? applyNatoureMarkup(selectedHotel.rawPricePerNight) * totalNights : 0;
  const markupCarPrice = selectedCar ? applyNatoureMarkup(selectedCar.rawPricePerDay) * totalNights : 0;
  const totalInvoicePrice = markupFlightPrice + markupHotelPrice + markupCarPrice;

  // Handles AI prompt submit
  const handlePromptSubmit = () => {
    // Boş qalsa, göstərilən nümunə (placeholder) mətnini istifadə et
    const effectivePrompt = prompt.trim() || ui.aiPlaceholder;
    const userMsg: Msg = { role: "user", text: effectivePrompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Msg = {
        role: "bot",
        text: "Səyahət tələbləriniz analiz edildi. New York (NYC) ➔ San Francisco (SFO) marşrutu üzrə 16 iyul tarixli 7 günlük planınız hazırdır! Sol tərəfdən marşrut detallarına baxıb, sağ tərəfdən axtarışa başlaya bilərsiniz.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setScreen("itinerary");
    }, 1800);
  };

  // Search functions
  const searchFlights = async () => {
    setSearchingFlights(true);
    setFlightError(null);
    setFlightsList([]);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const dateStr = parsedParams.departure_date.includes("İyul")
        ? `2026-07-${parsedParams.departure_date.split(" ")[0].padStart(2, "0")}`
        : parsedParams.departure_date;

      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          origin: parsedParams.origin,
          destination: parsedParams.destination,
          date: dateStr,
          passengers: parsedParams.travelers_count,
          ...(tripType === "roundtrip" ? { return_date: dateStr } : {}),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const offers: FlightOffer[] = (data.offers || []).map((o: any) => ({
          id: o.offer_id,
          airline: o.airline,
          departure: o.depart_time || o.departure,
          duration: o.duration,
          type: o.stops === 0 ? "Birbaşa" : `${o.stops} dayanacaq`,
          rawPrice: o.price_raw || o.price_usd,
        }));
        setFlightsList(offers.length > 0 ? offers : MOCK_FLIGHTS);
      } else {
        // Auth yoxdur və ya xəta — MOCK ilə davam et
        setFlightsList(MOCK_FLIGHTS);
      }
    } catch {
      setFlightsList(MOCK_FLIGHTS);
    } finally {
      setSearchingFlights(false);
    }
  };

  const searchHotels = async () => {
    setSearchingHotels(true);
    setHotelError(null);
    setHotelsList([]);
    try {
      const checkin = "2026-07-16";
      const checkoutDate = new Date("2026-07-16");
      checkoutDate.setDate(checkoutDate.getDate() + parsedParams.duration_days);
      const checkout = checkoutDate.toISOString().split("T")[0];

      const res = await fetch("/api/hotels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: parsedParams.destination,
          checkin,
          checkout,
          adults: parsedParams.travelers_count,
          stars: parsedParams.hotel_stars,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const hotels: HotelOffer[] = (data.hotels || []).map((h: any) => ({
          id: h.id || h.hotel_id,
          name: h.name || h.hotel_name,
          location: h.address || h.destination,
          image: h.image_url || (h.photos?.[0]) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
          stars: h.stars,
          rating: h.rating,
          rawPricePerNight: h.price_original || h.price_marked_up || h.price_usd,
          roomType: h.room_type,
          meal: h.meal,
          bookHash: h.book_hash,
          photos: h.photos || [],
          facilities: h.included_services || [],
        }));
        setHotelsList(hotels.length > 0 ? hotels : MOCK_HOTELS);
      } else {
        setHotelsList(MOCK_HOTELS);
      }
    } catch {
      setHotelsList(MOCK_HOTELS);
    } finally {
      setSearchingHotels(false);
    }
  };

  const searchCars = () => {
    setSearchingCars(true);
    setTimeout(() => {
      setCarsList(MOCK_CARS);
      setSearchingCars(false);
    }, 1200);
  };

  // Saga orchestrator simulator trigger
  const runOrchestrator = () => {
    setScreen("orchestration");
    setOrchStep(0);
    setOrchProgress(15);

    // Payment validation complete
    setTimeout(() => {
      setOrchStep(1);
      setOrchProgress(50);
      
      // Flight booking PNR complete
      setTimeout(() => {
        setOrchStep(2);
        setOrchProgress(85);

        // Hotel room sold out trigger → Fallback alert UI
        setTimeout(() => {
          setScreen("upgrade");
        }, 1500);
      }, 2000);
    }, 1500);
  };

  // Confirms the luxury upgraded hotel option
  const confirmUpgrade = () => {
    if (!alternativeHotel) return;
    setScreen("final");
  };

  // Populyar məkanlar — viewport-a girəndə bir dəfəlik scroll-reveal
  const destGridRef = useRef<HTMLDivElement>(null);
  const [destVisible, setDestVisible] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDestVisible(true);
      return;
    }
    const el = destGridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setDestVisible(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-20px) scale(1.05); }
          66% { transform: translate(-15px,15px) scale(0.97); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }
        .blob { animation: blob 7s ease-in-out infinite; }
        .blob-delay { animation-delay: 2s; }
        .blob-delay2 { animation-delay: 4s; }
        .fade-in-up { animation: fadeInUp 0.6s ease both; }
        .spin-slow { animation: spinSlow 2s linear infinite; }
        @keyframes kenburns {
          0%   { transform: scale(1)    translate(0,0); }
          50%  { transform: scale(1.08) translate(-1.5%,-1%); }
          100% { transform: scale(1)    translate(0,0); }
        }
        .kenburns { animation: kenburns 20s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .kenburns { animation: none !important; }
          [data-dest-card] { transition: none !important; }
          .blob { animation: none !important; }
        }
      `}</style>

      {/* ── HERO & AI INTERACTIVE SECTION ──────────────── */}
      <section id="planner" className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 py-14 text-center overflow-hidden bg-[#f8fafc] scroll-mt-24">
        
        {/* Glow background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="blob absolute top-[-8rem] left-[-6rem] w-[500px] h-[500px] rounded-full bg-sky-400/20 blur-3xl" />
          <div className="blob blob-delay absolute bottom-[5%] right-[-4rem] w-96 h-96 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="blob blob-delay2 absolute top-[40%] left-[35%] w-72 h-72 rounded-full bg-indigo-400/15 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* Badge */}
          <div className="fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold tracking-widest uppercase mb-6">
            <Sparkles size={12} /> {t("heroBadge")}
          </div>

          {/* Heading */}
          <h1 className="fade-in-up text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] text-slate-900 mb-6 tracking-tight">
            {language === "az" ? "Səyahətiniz" : language === "tr" ? "Seyahatiniz" : "Your Travel"}{" "}
            <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
              {language === "az" ? "3 Mükəmməl Nəticəyə" : language === "tr" ? "En İyi 3" : "Reduced to 3"}
            </span>{" "}
            {language === "az" ? "Endirildi." : language === "tr" ? "Sonuca İndirgeniyor." : "Perfect Results."}
          </h1>

          <p className="fade-in-up text-base sm:text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            {t("heroSubtitle")}
          </p>

          {/* Chat / Wizard Main Workspace */}
          <div className="fade-in-up w-full text-left" style={{ animationDelay: ".15s" }}>
            
            {/* Screen 1: Prompt Input Hero card */}
            {screen === "landing" && (
              <div className="max-w-2xl mx-auto bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-[#0284c7]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">{ui.aiLabel}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 leading-tight">
                  {ui.aiTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-6">
                  {ui.aiDesc}
                </p>

                <textarea
                  className="w-full h-28 p-4 text-xs sm:text-sm bg-[#f8fafc] border border-slate-200 rounded-2xl focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 resize-none font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={ui.aiPlaceholder}
                />

                <button
                  onClick={handlePromptSubmit}
                  disabled={isTyping}
                  className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:opacity-95 hover:scale-[1.005] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isTyping ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      {ui.aiAnalyzing}
                    </>
                  ) : (
                    <>
                      {ui.aiButton} <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Screens 2-6: Interactive Split View and Wizard Flow */}
            {(screen === "itinerary" || screen === "wizard") && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                
                {/* Left Side: AI Itinerary & Params */}
                <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm self-start">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-[#0284c7]" />
                    <h3 className="font-bold text-slate-800 text-sm">{ui.aiPlanLabel}: {parsedParams.destination}</h3>
                  </div>

                  <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Axtarış Parametrləri (AI Parser)</h4>
                    <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                      <div>📍 Haradan: <span className="font-semibold text-slate-800">{parsedParams.origin}</span></div>
                      <div>🏁 Haraya: <span className="font-semibold text-slate-800">{parsedParams.destination}</span></div>
                      <div>📅 Tarix: <span className="font-semibold text-slate-800">{parsedParams.departure_date}</span></div>
                      <div>🕒 Müddət: <span className="font-semibold text-slate-800">{parsedParams.duration_days} Gün</span></div>
                      <div>👥 Nəfər: <span className="font-semibold text-slate-800">{parsedParams.travelers_count} nəfər</span></div>
                      <div>💰 Maks. Büdcə: <span className="font-semibold text-sky-700">${parsedParams.budget}</span></div>
                      <div>⭐ Otel: <span className="font-semibold text-slate-800">{parsedParams.hotel_stars}★ (Reytinq {parsedParams.hotel_rating}+)</span></div>
                      <div>🚗 Rent-a-car: <span className="font-semibold text-emerald-600">Bəli</span></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Səyahət Marşrutu</h4>
                    
                    {[
                      { day: "Gün 1", t: "SFO Uçuşu & Otel Check-in", d: "Stanford Court otelində qeydiyyat. Fisherman's Wharf sahilində şam yeməyi." },
                      { day: "Gün 2", t: "Golden Gate Bridge Turu", d: "Zərif velosiped gəzintisi ilə Golden Gate körpüsünü keçərək Sausalito kəndinə səfər." },
                      { day: "Gün 3", t: "Alcatraz & Pier 39", d: "Tarixi Alcatraz adası həbsxanasına qayıqla gediş və Pier 39 dəniz şirləri kəşfi." },
                      { day: "Gün 4", t: "Napa Valley Şərab Gəzintisi", d: "İcarə maşınla Napa vadisinin möhtəşəm bağlarında qastronomiya və dincəlmə." },
                      { day: "Gün 5", t: "Union Square Alış-verişi", d: "Union Square-in premium butikləri və Chinatown-da ləzzət turları." },
                      { day: "Gün 6", t: "Golden Gate Parkı", d: "Muzeylər, Yapon Çay Bağında sakit gəzinti və estetik gün batımı." },
                      { day: "Gün 7", t: "Check-out & Geri Dönüş", d: "Oteldən çıxış, maşının təhvili və NYC-yə uçuş." }
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-3 border-l-2 border-slate-100 pl-4 relative">
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-sky-500 left-[-6px] top-1" />
                        <div>
                          <div className="text-xs font-bold text-[#0284c7]">{item.day} — {item.t}</div>
                          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {screen === "itinerary" && (
                    <button
                      onClick={() => setScreen("wizard")}
                      className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:scale-[1.01] transition-all"
                    >
                      Planı Təsdiqlə və Bilet Axtarışına Başla
                    </button>
                  )}
                </div>

                {/* Right Side: Search Step Panels */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm self-start">
                  
                  {/* Steps Progress */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    {[
                      { step: "flight", label: "1. Aviabiletlər" },
                      { step: "hotel", label: "2. Otellər" },
                      { step: "car", label: "3. Avtomobil" },
                      { step: "checkout", label: "4. Ödəniş & Pasport" }
                    ].map(s => (
                      <div
                        key={s.step}
                        className={`text-xs font-bold transition-colors ${
                          wizardStep === s.step ? "text-[#0284c7]" : "text-slate-300"
                        }`}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>

                  {/* Flight Selector */}
                  {wizardStep === "flight" && (
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 mb-4">Uçuş biletini seçin</h3>

                      {/* One-way / Round-trip toggle */}
                      <div className="flex gap-2 mb-4">
                        {(["oneway", "roundtrip"] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => { setTripType(type); setFlightsList([]); }}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              tripType === type
                                ? "bg-slate-900 text-white border-slate-900"
                                : "border-slate-200 text-slate-500 hover:border-slate-400"
                            }`}
                          >
                            {type === "oneway"
                              ? (language === "en" ? "One-way" : language === "tr" ? "Tek yön" : "Bir tərəfli")
                              : (language === "en" ? "Round-trip" : language === "tr" ? "Gidiş-dönüş" : "Gediş-dönüş")}
                          </button>
                        ))}
                      </div>

                      <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                        <div className="text-xs text-slate-500 space-y-0.5">
                          <div>Marşrut: <span className="font-bold text-slate-700">{parsedParams.origin} ➔ {parsedParams.destination}</span></div>
                          <div>Tarix: <span className="font-bold text-slate-700">{parsedParams.departure_date}</span></div>
                          {tripType === "roundtrip" && (
                            <div className="text-[#0284c7] font-semibold">↩ Gediş-dönüş bilet axtarılacaq</div>
                          )}
                          <div>Sərnişin: <span className="font-bold text-slate-700">{parsedParams.travelers_count} nəfər</span></div>
                        </div>
                        <button
                          onClick={searchFlights}
                          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                        >
                          {language === "en" ? "Search Flights" : language === "tr" ? "Uçuş Ara" : "Biletləri Axtar"}
                        </button>
                      </div>

                      {searchingFlights && (
                        <div className="py-8 text-center flex flex-col items-center gap-3">
                          <RefreshCw className="animate-spin text-[#0284c7]" size={28} />
                          <span className="text-xs text-slate-500 font-medium">Duffel API-dan bilet təklifləri və qiymətlər yoxlanılır...</span>
                        </div>
                      )}

                      {!searchingFlights && flightsList.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs text-[#0284c7] font-semibold mb-2">💡 10% Natoure servis haqqı daxil edilmiş təmiz qiymətlər:</p>
                          {flightsList.map(fl => {
                            const finalPrice = applyNatoureMarkup(fl.rawPrice) * parsedParams.travelers_count;
                            return (
                              <div
                                key={fl.id}
                                className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${
                                  selectedFlight?.id === fl.id ? "border-[#0284c7] bg-sky-50/20" : "border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{fl.airline}</h4>
                                  <p className="text-xs text-slate-400 mt-0.5">{fl.departure} • {fl.duration} • {fl.type}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-extrabold text-slate-950">${finalPrice}</div>
                                  <span className="text-[10px] text-slate-400 block">Cəmi ({parsedParams.travelers_count} nəfər)</span>
                                  <button
                                    onClick={() => setSelectedFlight(fl)}
                                    className={`mt-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                                      selectedFlight?.id === fl.id ? "bg-[#0284c7] text-white" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200"
                                    }`}
                                  >
                                    {selectedFlight?.id === fl.id ? "Seçildi" : "Seç"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {selectedFlight && (
                            <button
                              onClick={() => setWizardStep("hotel")}
                              className="mt-6 w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                            >
                              Otellərə Keç
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hotel Selector */}
                  {wizardStep === "hotel" && (
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 mb-4">Oteli seçin</h3>
                      <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                        <div className="text-xs text-slate-500">
                          <div>Məkan: <span className="font-bold text-slate-700">{parsedParams.destination}</span></div>
                          <div>Qonaqlama: <span className="font-bold text-slate-700">{parsedParams.duration_days} Gecə ({parsedParams.travelers_count} Nəfər)</span></div>
                          <div>Ulduz: <span className="font-bold text-sky-700">{parsedParams.hotel_stars}★, Reytinq {parsedParams.hotel_rating}+</span></div>
                        </div>
                        <button
                          onClick={searchHotels}
                          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                        >
                          Otelləri Göstər
                        </button>
                      </div>

                      {searchingHotels && (
                        <div className="py-8 text-center flex flex-col items-center gap-3">
                          <RefreshCw className="animate-spin text-[#0284c7]" size={28} />
                          <span className="text-xs text-slate-500 font-medium">RateHawk API otaq boşluğunu yoxlayır...</span>
                        </div>
                      )}

                      {!searchingHotels && hotelsList.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-xs text-[#0284c7] font-semibold mb-1">💡 10% Natoure servis haqqı daxil edilmiş təmiz qiymətlər:</p>
                          {hotelsList.map(ht => {
                            const nightPrice = applyNatoureMarkup(ht.rawPricePerNight);
                            const totalHotelCost = nightPrice * totalNights;
                            return (
                              <div
                                key={ht.id}
                                className={`border rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all ${
                                  selectedHotel?.id === ht.id ? "border-[#0284c7] bg-sky-50/10" : "border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <div className="relative w-full sm:w-1/3 h-28 bg-slate-100">
                                  <img src={ht.image} alt={ht.name} className="w-full h-full object-cover" />
                                  <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded text-[10px] font-bold text-[#0284c7]">
                                    ★ {ht.rating}
                                  </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{ht.name}</h4>
                                    <p className="text-xs text-slate-400 mt-1">{ht.location}</p>
                                  </div>
                                  <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-50">
                                    <div>
                                      <span className="text-xs font-extrabold text-slate-900">${nightPrice}</span>
                                      <span className="text-[10px] text-slate-400 font-normal"> / gecə</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setHotelDrawer(ht)}
                                        className="px-3 py-1 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                      >
                                        {language === "en" ? "Rooms" : language === "tr" ? "Odalar" : "Otaqlar"}
                                      </button>
                                      <div className="text-right">
                                        <div className="text-[10px] text-slate-400 font-semibold">Cəmi: ${totalHotelCost}</div>
                                        <button
                                          onClick={() => setSelectedHotel(ht)}
                                          className={`mt-1 px-4 py-1 text-xs font-bold rounded-lg transition ${
                                            selectedHotel?.id === ht.id ? "bg-[#0284c7] text-white" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200"
                                          }`}
                                        >
                                          {selectedHotel?.id === ht.id ? "Seçildi" : "Seç"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {selectedHotel && (
                            <button
                              onClick={() => setWizardStep("car")}
                              className="mt-6 w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                            >
                              Avtomobil İcarəsinə Keç
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Car Selector */}
                  {wizardStep === "car" && (
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 mb-4">Avtomobil seçin</h3>
                      <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                        <div className="text-xs text-slate-500">
                          <div>Məkan: <span className="font-bold text-slate-700">{parsedParams.destination} Hava Limanı</span></div>
                          <div>Müddət: <span className="font-bold text-slate-700">{totalNights} Gün</span></div>
                        </div>
                        <button
                          onClick={searchCars}
                          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                        >
                          Avtomobilləri Göstər
                        </button>
                      </div>

                      {searchingCars && (
                        <div className="py-8 text-center flex flex-col items-center gap-3">
                          <RefreshCw className="animate-spin text-[#0284c7]" size={28} />
                          <span className="text-xs text-slate-500 font-medium">Avtomobil təklifləri hesablanır...</span>
                        </div>
                      )}

                      {!searchingCars && carsList.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-xs text-[#0284c7] font-semibold mb-1">💡 10% Natoure servis haqqı daxil edilmiş təmiz qiymətlər:</p>
                          {carsList.map(cr => {
                            const dayPrice = applyNatoureMarkup(cr.rawPricePerDay);
                            const totalCarCost = dayPrice * totalNights;
                            return (
                              <div
                                key={cr.id}
                                className={`border rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all ${
                                  selectedCar?.id === cr.id ? "border-[#0284c7] bg-sky-50/10" : "border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <div className="relative w-full sm:w-1/3 h-28 bg-[#f8fafc] flex items-center justify-center p-2">
                                  <img src={cr.image} alt={cr.name} className="h-full object-contain" />
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                  <div>
                                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">{cr.category}</span>
                                    <h4 className="font-bold text-slate-800 text-sm mt-1">{cr.name}</h4>
                                  </div>
                                  <div className="flex items-end justify-between mt-3 pt-2">
                                    <div>
                                      <span className="text-xs font-extrabold text-slate-900">${dayPrice}</span>
                                      <span className="text-[10px] text-slate-400 font-normal"> / gün</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[10px] text-slate-400 font-semibold">Cəmi: ${totalCarCost}</div>
                                      <button
                                        onClick={() => setSelectedCar(cr)}
                                        className={`mt-1.5 px-4 py-1 text-xs font-bold rounded-lg transition ${
                                          selectedCar?.id === cr.id ? "bg-[#0284c7] text-white" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200"
                                        }`}
                                      >
                                        {selectedCar?.id === cr.id ? "Seçildi" : "Seç"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {selectedCar && (
                            <button
                              onClick={() => setWizardStep("checkout")}
                              className="mt-6 w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                            >
                              Sifarişi Tamamla
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkout & Passport Forms */}
                  {wizardStep === "checkout" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-7 space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 border-b pb-1.5">Pasport Məlumatları</h4>
                        
                        {/* Passenger 1 */}
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase">Sərnişin 1 (Sürücü)</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Ad" value={passenger1.firstName} onChange={e => setPassenger1({...passenger1, firstName: e.target.value})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                            <input type="text" placeholder="Soyad" value={passenger1.lastName} onChange={e => setPassenger1({...passenger1, lastName: e.target.value})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                          </div>
                          <input type="text" placeholder="Pasport Nömrəsi" value={passenger1.passport} onChange={e => setPassenger1({...passenger1, passport: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Doğum Tarixi" value={passenger1.dob} onChange={e => setPassenger1({...passenger1, dob: e.target.value})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                            <input type="text" placeholder="Bitmə Tarixi" value={passenger1.expiry} onChange={e => setPassenger1({...passenger1, expiry: e.target.value})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                          </div>
                        </div>

                        {/* Passenger 2 */}
                        <div className="space-y-2.5 pt-3 border-t">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Sərnişin 2</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Ad" value={passenger2.firstName} onChange={e => setPassenger2({...passenger2, firstName: e.target.value})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                            <input type="text" placeholder="Soyad" value={passenger2.lastName} onChange={e => setPassenger2({...passenger2, lastName: e.target.value})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                          </div>
                          <input type="text" placeholder="Pasport Nömrəsi" value={passenger2.passport} onChange={e => setPassenger2({...passenger2, passport: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                        </div>
                      </div>

                      {/* Summary Invoice Panel */}
                      <div className="md:col-span-5 space-y-4 bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 self-start">
                        <h4 className="font-bold text-xs text-slate-800 border-b border-slate-200/60 pb-2 uppercase tracking-wider">Ödəniş Hesabı</h4>
                        <div className="space-y-2.5 text-xs text-slate-500">
                          <div className="flex justify-between">
                            <span>✈️ Bilet (2 nəfər):</span>
                            <span className="font-semibold text-slate-800">${markupFlightPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🏨 Otel ({totalNights} gecə):</span>
                            <span className="font-semibold text-slate-800">${markupHotelPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>🚗 İcarə maşın ({totalNights} gün):</span>
                            <span className="font-semibold text-slate-800">${markupCarPrice}</span>
                          </div>
                          <div className="flex justify-between border-t border-dashed pt-2 font-bold text-slate-800">
                            <span>Cəmi Ödəniş:</span>
                            <span className="text-[#0284c7] text-sm">${totalInvoicePrice}</span>
                          </div>
                        </div>

                        {/* Card Form Mock */}
                        <div className="space-y-2 pt-2 border-t">
                          <input type="text" placeholder="Card Number" defaultValue="4242 4242 4242 4242" className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-white" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="MM/YY" defaultValue="12/29" className="border border-slate-200 rounded-xl p-2.5 text-xs bg-white" />
                            <input type="text" placeholder="CVC" defaultValue="123" className="border border-slate-200 rounded-xl p-2.5 text-xs bg-white" />
                          </div>
                        </div>

                        <button
                          onClick={runOrchestrator}
                          className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-sky-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Lock size={12} /> Səyahəti Ödə və Bron et
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Screen 3: Auto-booking processing screen */}
            {screen === "orchestration" && (
              <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900 text-center mb-6">Rezervasiya prosesi paralel icra olunur...</h2>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all" style={{ width: `${orchProgress}%` }} />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">✓</div>
                    <span>Ödəniş təsdiqləndi. Balans capture olundu: ${totalInvoicePrice}.00</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                    {orchStep >= 1 ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">✓</div>
                    ) : (
                      <RefreshCw className="animate-spin text-sky-500" size={16} />
                    )}
                    <span>1. Aviabiletlər rəsmiləşdirilir (Duffel API)... {orchStep >= 1 ? "Uğurlu (PNR: PNR-X52B)" : "Gözlənilir"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
                    {orchStep >= 2 ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">!</div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">2</div>
                    )}
                    <span className={orchStep >= 2 ? "text-amber-600" : "text-slate-400"}>
                      2. Otel otağı bron edilir (RateHawk API)... {orchStep >= 2 ? "Failed! Otaq anlıq doldu." : "Gözlənilir"}
                    </span>
                  </div>
                  {orchStep >= 2 && (
                    <div className="flex items-center gap-3 text-xs text-indigo-600 font-bold">
                      <RefreshCw className="animate-spin" size={16} />
                      <span>3. Kompensasiya (Fallback Upgrade) mexanizmi işə düşür...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Screen 4: Fallback / Upgrade options card */}
            {screen === "upgrade" && (
              <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-[#FAF9F6] border-b border-slate-100 p-6 sm:p-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-3">
                    💎 Zərif Yenilənmə (Complimentary Upgrade)
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
                    Otel Kateqoriyasının Pulsuz Artırılması
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5">
                    Hörmətli müştəri, seçdiyiniz oteldəki otaq son saniyədə satıldığı üçün, Natoure kuratorları sizin üçün yaxınlıqdakı 5★ lüks otellərdə pulsuz kateqoriyalı otaq artımı (upgrade) hazırlayıb. Heç bir əlavə öhdəlik daşımırsınız ($0.00):
                  </p>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seçə Biləcəyiniz Alternativlər:</h3>
                  {UPGRADE_ALTERNATIVES.map(up => (
                    <div
                      key={up.id}
                      className={`border rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all ${
                        alternativeHotel?.id === up.id ? "border-[#0284c7] bg-sky-50/10 shadow-sm" : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="relative w-full sm:w-1/3 h-32 sm:h-auto">
                        <img src={up.image} alt={up.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700">
                          ★ {up.rating}
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-amber-500 font-bold">{"★".repeat(up.stars)}</span>
                          <h4 className="font-bold text-slate-800 text-sm mt-0.5">{up.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">{up.location}</p>
                        </div>

                        <div className="flex items-end justify-between mt-4 border-t border-slate-50 pt-3">
                          <div>
                            <span className="text-[10px] text-slate-400 line-through">${applyNatoureMarkup(up.rawPricePerNight)}</span>
                            <span className="text-xs font-extrabold text-slate-900 ml-1.5">${applyNatoureMarkup(selectedHotel?.rawPricePerNight || 0)}</span>
                            <span className="text-[10px] text-slate-400 font-normal"> / gecə</span>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-emerald-600 font-bold">Kateqoriya fərqi: $0.00</div>
                            <button
                              onClick={() => setAlternativeHotel(up)}
                              className={`mt-1.5 px-4 py-1 text-xs font-bold rounded-lg transition ${
                                alternativeHotel?.id === up.id ? "bg-[#0284c7] text-white" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {alternativeHotel?.id === up.id ? "Seçildi" : "Oteli Seç"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {alternativeHotel && (
                    <button
                      onClick={confirmUpgrade}
                      className="mt-6 w-full py-3.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                    >
                      Alternativi Təsdiqlə və Bronu Bitir
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Screen 5: Receipt */}
            {screen === "final" && (
              <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="text-emerald-600" size={24} />
                </div>
                
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Rezervasiya uğurla tamamlandı!</h2>
                <p className="text-[10px] text-slate-400 mb-6">Sifariş Kodu: #NT-948102-SFO</p>

                <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-5 text-left space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Aviabiletlər (Delta Air Lines)</div>
                      <div className="text-[10px] text-slate-500">PNR Kodu: <span className="font-semibold text-slate-700">PNR-X52B</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Otel: {alternativeHotel?.name}</div>
                      <div className="text-[10px] text-slate-500">Təsdiq Kodu: <span className="font-semibold text-slate-700">RH-829104A</span> <span className="text-emerald-600 font-bold ml-1">(5* Upgrade)</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Avtomobil icarəsi (SUV Jeep Grand Cherokee)</div>
                      <div className="text-[10px] text-slate-500">Vauçer Kodu: <span className="font-semibold text-slate-700">CAR-92041B</span></div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Bütün səyahət sənədləriniz və voucher sənədləriniz qeydiyyat e-poçt ünvanınıza göndərildi.
                </p>

                <button
                  onClick={() => {
                    setScreen("landing");
                    setSelectedFlight(null);
                    setSelectedHotel(null);
                    setSelectedCar(null);
                    setAlternativeHotel(null);
                    setWizardStep("flight");
                  }}
                  className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                >
                  Yeni Səyahət Planla
                </button>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ── SECTIONS FOR SEO & BRAND CONFIDENCE ─────────── */}
      
      {/* Popular Destinations Bento Grid */}
      <section className="relative overflow-hidden px-4 py-14 bg-[#f8fafc]">
        {/* Yumşaq üzən işıq fonları */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob absolute -top-20 -left-16 w-96 h-96 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="blob blob-delay2 absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">
            {language === "az" ? "Dünya Sizi Gözləyir" : language === "tr" ? "Dünya Sizi Bekliyor" : "The World Awaits You"}
          </p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-10">
            {language === "az" ? "Populyar Məkanlar" : language === "tr" ? "Popüler Destinasyonlar" : "Popular Destinations"}
          </h2>
          <div ref={destGridRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 auto-rows-[150px] sm:auto-rows-[190px] [grid-auto-flow:dense]">
            {[
              { name: language === "az" ? "Dubay" : "Dubai", country: language === "az" ? "BƏƏ" : language === "tr" ? "BAE" : "UAE", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80&auto=format", big: true },
              { name: language === "az" ? "Nyu-York" : "New York", country: language === "az" ? "ABŞ" : language === "tr" ? "ABD" : "USA", img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=900&q=80&auto=format", big: true },
              { name: language === "az" ? "Los-Anceles" : "Los Angeles", country: language === "az" ? "ABŞ" : language === "tr" ? "ABD" : "USA", img: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=600&q=80&auto=format" },
              { name: language === "az" ? "Mayami" : "Miami", country: language === "az" ? "ABŞ" : language === "tr" ? "ABD" : "USA", img: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=600&q=80&auto=format" },
              { name: language === "az" ? "Las-Veqas" : "Las Vegas", country: language === "az" ? "ABŞ" : language === "tr" ? "ABD" : "USA", img: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&q=80&auto=format" },
              { name: language === "az" ? "San-Fransisko" : "San Francisco", country: language === "az" ? "ABŞ" : language === "tr" ? "ABD" : "USA", img: "https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=600&q=80&auto=format" },
              { name: language === "az" ? "Maldiv Adaları" : language === "tr" ? "Maldivler" : "Maldives", country: language === "az" ? "Hind Okeanı" : language === "tr" ? "Hint Okyanusu" : "Indian Ocean", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80&auto=format" },
              { name: "Antalya", country: language === "az" ? "Türkiyə" : language === "tr" ? "Türkiye" : "Turkey", img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80&auto=format" },
              { name: "Paris", country: language === "az" ? "Fransa" : language === "tr" ? "Fransa" : "France", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80&auto=format" },
              { name: "Bali", country: language === "az" ? "İndoneziya" : language === "tr" ? "Endonezya" : "Indonesia", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80&auto=format" },
              { name: language === "az" ? "Barselona" : "Barcelona", country: language === "az" ? "İspaniya" : language === "tr" ? "İspanya" : "Spain", img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80&auto=format" },
              { name: language === "az" ? "Tokio" : "Tokyo", country: language === "az" ? "Yaponiya" : language === "tr" ? "Japonya" : "Japan", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80&auto=format" },
              { name: language === "az" ? "Roma" : "Rome", country: language === "az" ? "İtaliya" : language === "tr" ? "İtalya" : "Italy", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80&auto=format" },
            ].map((d, i) => (
              <a key={d.name} href={`/turlar?dest=${encodeURIComponent(d.name)}`}
                data-dest-card
                className={`relative rounded-2xl overflow-hidden group block transition-all duration-500 ease-out
                  ${destVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-7"}
                  hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sky-900/20 ring-1 ring-white/0 hover:ring-white/25
                  ${d.big ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""}`}
                style={{ transitionDelay: destVisible ? `${Math.min(i, 8) * 70}ms` : "0ms" }}>
                <div className="absolute inset-0 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                  <img src={d.img} alt={d.name} loading="lazy" decoding="async"
                    className="kenburns w-full h-full object-cover" style={{ animationDuration: `${18 + (i % 4) * 2}s` }} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-sky-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-bold text-base leading-tight drop-shadow">{d.name}</p>
                  <p className="text-white/75 text-xs">{d.country}</p>
                  <span className="flex items-center gap-1 text-white text-xs font-semibold mt-1 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {language === "az" ? "Kəşf et" : language === "tr" ? "Keşfet" : "Explore"} <ArrowRight size={12} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
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
              { n: "01", icon: <Brain size={28} className="text-sky-600" />, title: language === "az" ? "AI Parametrlər" : language === "tr" ? "AI Parametreleri" : "AI Parameters", desc: language === "az" ? "Mətni yazan kimi AI parametrləri və xüsusi marşrut planını hazırlayır." : language === "tr" ? "Metni yazdığınız anda AI seyahat parametrelerini ve özel rotayı hazırlar." : "Write your prompt, and AI instantly parses search parameters and plans the itinerary." },
              { n: "02", icon: <Zap size={28} className="text-indigo-600" />, title: language === "az" ? "Dinamik Seçim" : language === "tr" ? "Dinamik Seçim" : "Dynamic Choices", desc: language === "az" ? "Dəqiq API-lardan gələn aviabilet, otel və avtomobilləri addım-addım seçirsiniz." : language === "tr" ? "Doğru API'lerden gelen uçak, otel ve araçları adım adım seçersiniz." : "Select your flights, hotels, and vehicle classes step-by-step from live B2B APIs." },
              { n: "03", icon: <Plane size={28} className="text-sky-600" />, title: language === "az" ? "Vahid Ödəniş" : language === "tr" ? "Tek Ödeme" : "Unified Checkout", desc: language === "az" ? "Pasportları yazıb tək ödəniş edirsiniz. Auto-booking saniyələr daxilində tamamlanır." : language === "tr" ? "Pasaportları doldurup tek seferde ödersiniz. Auto-booking saniyeler içinde tamamlanır." : "Fill passport data, pay once. Auto-booking scripts execute the order in seconds." },
            ].map((s) => (
              <div key={s.n} className="relative bg-white rounded-2xl p-7 border border-slate-100 shadow-sm text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">{s.icon}</div>
                <div className="text-xs text-sky-600 font-bold uppercase tracking-widest mb-2">{s.n}</div>
                <h3 className="font-bold text-slate-800 text-lg mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="px-4 py-14 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[12px] text-sky-700 font-bold uppercase tracking-widest mb-2">
            {language === "az" ? "Xidmətlərimiz" : language === "tr" ? "Hizmetlerimiz" : "Our Services"}
          </p>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 mb-3">
            {language === "az" ? "Bütün Səyahət Xidmətləri" : language === "tr" ? "Tüm Seyahat Hizmetleri" : "All Travel Services"}
          </h2>
          <p className="text-center text-slate-500 text-sm mb-12 max-w-xl mx-auto leading-relaxed">
            {language === "az"
              ? "İstədiyiniz xidməti seçin — onlayn rezerv edin və ya birbaşa WhatsApp-da bizimlə əlaqə saxlayın."
              : language === "tr"
              ? "İstediğiniz hizmeti seçin — çevrimiçi rezervasyon yapın veya doğrudan WhatsApp'tan bize ulaşın."
              : "Pick the service you need — book online or reach us directly on WhatsApp."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SERVICES.filter(s => s.featured).map(s => {
              const external = serviceIsExternal(s);
              const Icon = s.icon;
              const cta = external
                ? (language === "az" ? "WhatsApp-da soruş" : language === "tr" ? "WhatsApp'tan sor" : "Ask on WhatsApp")
                : (language === "az" ? "Bax" : language === "tr" ? "İncele" : "Explore");
              const cls = "group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-left no-underline flex flex-col";
              const inner = (
                <>
                  <div className={`w-12 h-12 rounded-xl ${s.bgClass} flex items-center justify-center mb-3 transition-transform group-hover:scale-105`}>
                    <Icon className={s.iconClass} size={24} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">{s.label[language]}</h3>
                  <span className="mt-auto text-[11px] font-bold text-sky-600 inline-flex items-center gap-1">
                    {cta} <ArrowRight size={12} />
                  </span>
                </>
              );
              return external ? (
                <a key={s.key} href={serviceHref(s, language)} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
              ) : (
                <Link key={s.key} href={serviceHref(s, language)} className={cls}>{inner}</Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-14 bg-white">
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

      {/* Customer Reviews Section */}
      <section style={{ background: "#0b0b0b" }}>
        <ReviewsSection />
      </section>

      {/* Call to Action Section */}
      <section className="px-4 py-14 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl p-14 text-center text-white" style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", boxShadow: "0 30px 80px rgba(2,132,199,.3)" }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              {language === "az" ? "Səyahətinizi Planlamağa Hazırsınız?" : language === "tr" ? "Seyahatinizi Planlamaya Hazır mısınız?" : "Ready to Plan Your Next Journey?"}
            </h2>
            <p className="text-white/80 text-base mb-10 leading-relaxed">
              {language === "az" ? "İlk AI ilə planlanmış turunu pulsuz sınayın. Heç bir ödəniş tələb olunmur." : language === "tr" ? "Yapay zeka tarafından planlanan ilk seyahatinizi ücretsiz deneyin." : "Try your first AI-curated itinerary for free. No credit card required."}
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-7 py-3.5 rounded-2xl bg-white text-sky-700 font-bold text-base hover:-translate-y-0.5 transition-transform flex items-center gap-2 mx-auto"
            >
              {language === "az" ? "İndi Başla" : language === "tr" ? "Şimdi Başla" : "Start Now"} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <NewsletterSection />

      {/* Hotel Detail Drawer */}
      {hotelDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setHotelDrawer(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs text-slate-400 font-medium">{hotelDrawer.stars}★ — {hotelDrawer.location}</p>
                <h2 className="text-sm font-bold text-slate-900 mt-0.5">{hotelDrawer.name}</h2>
              </div>
              <button onClick={() => setHotelDrawer(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {/* Photo */}
            <div className="w-full h-48 bg-slate-100 overflow-hidden shrink-0">
              <img src={hotelDrawer.image} alt={hotelDrawer.name} className="w-full h-full object-cover" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 px-5 py-4 border-b">
              <div className="bg-[#0284c7] text-white text-sm font-bold px-2.5 py-1 rounded-lg">{hotelDrawer.rating}</div>
              <div>
                <p className="text-xs font-bold text-slate-700">
                  {(hotelDrawer.rating || 0) >= 9 ? "Əla" : (hotelDrawer.rating || 0) >= 8 ? "Çox yaxşı" : "Yaxşı"}
                </p>
                <p className="text-[10px] text-slate-400">Qiymətləndirmə</p>
              </div>
            </div>

            {/* Facilities */}
            {hotelDrawer.facilities && hotelDrawer.facilities.length > 0 && (
              <div className="px-5 py-4 border-b">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Xidmətlər</p>
                <div className="flex flex-wrap gap-1.5">
                  {hotelDrawer.facilities.slice(0, 8).map((f: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-slate-600">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Room options */}
            <div className="px-5 py-4 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Otaq Seçimi</p>
              <div className="space-y-3">
                {[
                  {
                    name: hotelDrawer.roomType || "Standart Otaq",
                    meal: hotelDrawer.meal === "breakfast_included" ? "Səhər yeməyi daxildir" : "Yemək daxil deyil",
                    mealColor: hotelDrawer.meal === "breakfast_included" ? "text-emerald-600" : "text-slate-400",
                    cancel: "Ödənişsiz ləğv",
                    price: applyNatoureMarkup(hotelDrawer.rawPricePerNight),
                  },
                  {
                    name: "Deluxe Otaq",
                    meal: "Səhər yeməyi daxildir",
                    mealColor: "text-emerald-600",
                    cancel: "Ödənişsiz ləğv",
                    price: applyNatoureMarkup(hotelDrawer.rawPricePerNight * 1.2),
                  },
                  {
                    name: "Suite",
                    meal: "Tam pansion daxildir",
                    mealColor: "text-emerald-600",
                    cancel: "Ödənişli ləğv",
                    price: applyNatoureMarkup(hotelDrawer.rawPricePerNight * 1.6),
                  },
                ].map((room, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{room.name}</p>
                        <p className={`text-[10px] mt-0.5 ${room.mealColor}`}>🍳 {room.meal}</p>
                        <p className="text-[10px] text-emerald-500 mt-0.5">✓ {room.cancel}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-slate-900">${room.price}</p>
                        <p className="text-[9px] text-slate-400">/ gecə</p>
                        <button
                          onClick={() => {
                            setSelectedHotel({ ...hotelDrawer, roomType: room.name, meal: room.meal, rawPricePerNight: hotelDrawer.rawPricePerNight * (i === 0 ? 1 : i === 1 ? 1.2 : 1.6) });
                            setHotelDrawer(null);
                          }}
                          className="mt-1.5 px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-700 transition"
                        >
                          Seç
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
