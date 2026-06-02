"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles, X, Check, AlertTriangle, Plane, Hotel, Car, Info,
  Calendar, MapPin, Users, CreditCard, ArrowRight, Lock, Map, RefreshCw
} from "lucide-react";
import { applyNatoureMarkup } from "@/lib/markup";

/* ─── Interfaces ───────────────────────────────────── */
interface FlightOffer {
  id: string;
  airline: string;
  logoText: string;
  departure: string;
  arrival: string;
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

export default function PrototypePage() {
  // Screens: 'chat' | 'itinerary' | 'wizard' | 'orchestration' | 'upgrade' | 'final'
  const [screen, setScreen] = useState<"chat" | "itinerary" | "wizard" | "orchestration" | "upgrade" | "final">("chat");
  const [prompt, setPrompt] = useState("New Yorkdan San Franciscoya getmək istəyirik, 16 iyulda, iki nəfərik. Büdcəmiz 2500 dollardı. 4* otel, reytinqi 7+ olsun. 1 həftə qalacağıq. San Fransiskoda rent a car da istəyirik.");
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
  
  // Selections
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarOffer | null>(null);
  const [alternativeHotel, setAlternativeHotel] = useState<HotelOffer | null>(null);

  // Search trigger states
  const [searchingFlights, setSearchingFlights] = useState(false);
  const [flightsList, setFlightsList] = useState<FlightOffer[]>([]);
  const [searchingHotels, setSearchingHotels] = useState(false);
  const [hotelsList, setHotelsList] = useState<HotelOffer[]>([]);
  const [searchingCars, setSearchingCars] = useState(false);
  const [carsList, setCarsList] = useState<CarOffer[]>([]);

  // Passport inputs
  const [passenger1, setPassenger1] = useState({ firstName: "", lastName: "", passport: "", dob: "", expiry: "" });
  const [passenger2, setPassenger2] = useState({ firstName: "", lastName: "", passport: "", dob: "", expiry: "" });

  // Orchestrator simulation states
  const [orchStep, setOrchStep] = useState(0); // 0: Payment verified, 1: Flight PNR booked, 2: Hotel booking failed
  const [orchProgress, setOrchProgress] = useState(0);

  // Chat concierge
  const [chatOpen, setChatOpen] = useState(false);
  const [conciergeMsgs, setConciergeMsgs] = useState<Msg[]>([
    { role: "bot", text: "Salam! Natoure Lüks Konsyerj xidmətinə xoş gəlmisiniz. Səyahət planınız haqqında suallarınızı cavablandırmağa hazıram.", timestamp: new Date() }
  ]);
  const [conciergeInput, setConciergeInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const totalNights = parsedParams.duration_days;
  const markupFlightPrice = selectedFlight ? applyNatoureMarkup(selectedFlight.rawPrice) * parsedParams.travelers_count : 0;
  const markupHotelPrice = selectedHotel ? applyNatoureMarkup(selectedHotel.rawPricePerNight) * totalNights : 0;
  const markupCarPrice = selectedCar ? applyNatoureMarkup(selectedCar.rawPricePerDay) * totalNights : 0;
  const totalInvoicePrice = markupFlightPrice + markupHotelPrice + markupCarPrice;

  // Handles AI prompt submit
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    const userMsg: Msg = { role: "user", text: prompt, timestamp: new Date() };
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
  const searchFlights = () => {
    setSearchingFlights(true);
    setTimeout(() => {
      setFlightsList(MOCK_FLIGHTS);
      setSearchingFlights(false);
    }, 1200);
  };

  const searchHotels = () => {
    setSearchingHotels(true);
    setTimeout(() => {
      setHotelsList(MOCK_HOTELS);
      setSearchingHotels(false);
    }, 1200);
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

  // Concierge bot conversation
  const sendConciergeMsg = () => {
    if (!conciergeInput.trim()) return;
    const userMsg: Msg = { role: "user", text: conciergeInput, timestamp: new Date() };
    setConciergeMsgs(prev => [...prev, userMsg]);
    setConciergeInput("");

    setTimeout(() => {
      let reply = "Planlaşdırma ilə bağlı hər hansı sualınız olduqda kömək etməyə şadam. Biz bütün PNR və voucher məlumatlarını hazır saxlayırıq.";
      const text = conciergeInput.toLowerCase();
      if (text.includes("hotel") || text.includes("otel")) {
        reply = "Seçdiyiniz otel dəyişikliyi 100% pulsuzdur. Natoure zəmanəti ilə St. Regis 5* kateqoriya artımı həyata keçirilmişdir. Heç bir əlavə öhdəlik daşımırsınız.";
      } else if (text.includes("bilet") || text.includes("uçuş")) {
        reply = "Uçuş biletləriniz Delta Air Lines ilə rəsmi şəkildə bağlandı. PNR kodunuz aktivdir.";
      } else if (text.includes("rent") || text.includes("maşın")) {
        reply = "SFO hava limanında SUV (Jeep) icarəniz səyahət sənədlərinizə əlavə edilib.";
      }
      
      setConciergeMsgs(prev => [...prev, { role: "bot", text: reply, timestamp: new Date() }]);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conciergeMsgs, chatOpen]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 font-sans antialiased relative pb-12">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-r from-sky-600 to-indigo-600">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent notranslate" translate="no">
            Natoure
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
          <span>Turlar</span>
          <span>Otellər</span>
          <span>Haqqımızda</span>
          <span className="text-[#0284c7] font-semibold">İnteraktiv Prototip v2</span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        
        {/* Screen 1: AI Prompt Input */}
        {screen === "chat" && (
          <div className="max-w-2xl mx-auto mt-12 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-[#0284c7]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">AI Səyahət Müşaviri</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">
              Səyahət istəyinizi sərbəst şəkildə qeyd edin
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              AI planlayıcı marşrutu quracaq və axtarış parametrlərini avtomatik müəyyən edəcək.
            </p>

            <textarea
              className="w-full h-32 p-4 text-sm bg-[#f8fafc] border border-slate-200 rounded-2xl focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 resize-none"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Məsələn: Gələn ay yoldaşımla İtaliyaya 5 günlük lüks səyahət..."
            />

            <button
              onClick={handlePromptSubmit}
              disabled={isTyping}
              className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-sky-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isTyping ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Plan Analiz Edilir...
                </>
              ) : (
                <>
                  AI ilə Planı Qur <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Screen 2: Itinerary & Wizard Split View */}
        {(screen === "itinerary" || screen === "wizard") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
            
            {/* Left: AI Generated Itinerary */}
            <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm self-start">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-[#0284c7]" />
                <h3 className="font-bold text-slate-800 text-sm">AI Səyahət Planı: {parsedParams.destination}</h3>
              </div>

              {/* Parsed JSON panel */}
              <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Çıxarılan Axtarış Parametrləri (JSON)</h4>
                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div>📍 Haradan: <span className="font-semibold text-slate-800">{parsedParams.origin}</span></div>
                  <div>🏁 Haraya: <span className="font-semibold text-slate-800">{parsedParams.destination}</span></div>
                  <div>📅 Tarix: <span className="font-semibold text-slate-800">{parsedParams.departure_date}</span></div>
                  <div>🕒 Müddət: <span className="font-semibold text-slate-800">{parsedParams.duration_days} Gün</span></div>
                  <div>👥 Nəfər: <span className="font-semibold text-slate-800">{parsedParams.travelers_count} nəfər</span></div>
                  <div>💰 Maks. Büdcə: <span className="font-semibold text-sky-700">${parsedParams.budget}</span></div>
                  <div>⭐ Otel: <span className="font-semibold text-slate-800">{parsedParams.hotel_stars}★ (Reytinq {parsedParams.hotel_rating}+)</span></div>
                  <div>🚗 Rent-a-car: <span className="font-semibold text-emerald-600">Tələb olunur</span></div>
                </div>
              </div>

              {/* Day-by-Day view */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gündəlik Səyahət Marşrutu</h4>
                
                {[
                  { day: "Gün 1", t: "SFO Uçuşu & Yerləşmə", d: "Union Square ətrafındakı otelə check-in. Axşam Fisherman's Wharf sahilində şam yeməyi." },
                  { day: "Gün 2", t: "Golden Gate Bridge turu", d: "Səhər zərif velosiped turu ilə Golden Gate körpüsünü keçib Sausalito butik kəndinə gediş." },
                  { day: "Gün 3", t: "Alcatraz Adası Kəşfi", d: "Tarixi Alcatraz həbsxanasına ekskursiya. Dönüşdə Pier 39 dəniz şirləri ilə tanışlıq." },
                  { day: "Gün 4", t: "Napa Valley Şərab Turu", d: "Rent-a-car ilə möhtəşəm Napa vadisinə səyahət, üzüm bağları və premium qastronomiya." },
                  { day: "Gün 5", t: "Mədəniyyət & Alış-veriş", d: "Union Square butikləri, zərif Chinatown məhəlləsində mədəni gəzinti." },
                  { day: "Gün 6", t: "Golden Gate Parkı", d: "De Young muzeyi və Yapon Çay Bağında dincəlmə. Sakit lüks atmosferində gün batımı." },
                  { day: "Gün 7", t: "Check-out & Geri Dönüş", d: "Oteldən ayrılma, icarə maşınının təhvil verilməsi və NYC-yə axşam uçuşu." },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 border-l-2 border-slate-100 pl-4 relative">
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-sky-500 left-[-6px] top-1" />
                    <div>
                      <div className="text-xs font-bold text-[#0284c7]">{item.day} — {item.t}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.day === "Gün 1" || item.day === "Gün 7" ? item.d : `${item.d}`}</div>
                    </div>
                  </div>
                ))}
              </div>

              {screen === "itinerary" && (
                <button
                  onClick={() => setScreen("wizard")}
                  className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:scale-[1.01] transition-all"
                >
                  Planı Təsdiqlə və Axtarışa Başla
                </button>
              )}
            </div>

            {/* Right: Interactive Booking Wizard */}
            <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm self-start">
              
              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                {[
                  { step: "flight", label: "1. Uçuşlar" },
                  { step: "hotel", label: "2. Otel" },
                  { step: "car", label: "3. Avtomobil" },
                  { step: "checkout", label: "4. Checkout" }
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

              {/* Step 1: Flights Search & Results */}
              {wizardStep === "flight" && (
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-4">Aviabilet seçimi</h3>
                  
                  {/* Flight Search Widget Card */}
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <div>Uçuş: <span className="font-bold text-slate-700">{parsedParams.origin} ➔ {parsedParams.destination}</span></div>
                      <div>Tarix: <span className="font-bold text-slate-700">{parsedParams.departure_date}</span></div>
                      <div>Sərnişin: <span className="font-bold text-slate-700">{parsedParams.travelers_count} Nəfər</span></div>
                    </div>
                    <button
                      onClick={searchFlights}
                      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                    >
                      Biletləri Axtar
                    </button>
                  </div>

                  {searchingFlights && (
                    <div className="py-8 text-center flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-[#0284c7]" size={28} />
                      <span className="text-xs text-slate-500 font-medium">Duffel API üzərindən real bilet qiymətləri çəkilir...</span>
                    </div>
                  )}

                  {!searchingFlights && flightsList.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-[#0284c7] font-semibold mb-2">💡 Bütün qiymətlərə 10% Natoure servis haqqı əlavə edilmişdir:</p>
                      {flightsList.map(fl => {
                        const finalPrice = applyNatoureMarkup(fl.rawPrice) * parsedParams.travelers_count;
                        return (
                          <div
                            key={fl.id}
                            className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${
                              selectedFlight?.id === fl.id ? "border-[#0284c7] bg-sky-50/20" : "border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-700">
                                {fl.logoText}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm">{fl.airline}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{fl.departure} • {fl.duration} • {fl.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-extrabold text-slate-950">${finalPrice}</div>
                              <span className="text-[10px] text-slate-400 font-normal">Cəmi ({parsedParams.travelers_count} nəfər)</span>
                              <button
                                onClick={() => setSelectedFlight(fl)}
                                className={`block mt-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
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
                          Otellər Mərhələsinə Keç
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Hotels Search & Results */}
              {wizardStep === "hotel" && (
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-4">Otellərin siyahısı</h3>

                  {/* Hotel Search Widget Card */}
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <div>Məkan: <span className="font-bold text-slate-700">{parsedParams.destination}</span></div>
                      <div>Qonaqlama: <span className="font-bold text-slate-700">{parsedParams.duration_days} Gecə ({parsedParams.travelers_count} nəfər)</span></div>
                      <div>Filtr: <span className="font-bold text-sky-700">{parsedParams.hotel_stars}★, Reytinq {parsedParams.hotel_rating}+</span></div>
                    </div>
                    <button
                      onClick={searchHotels}
                      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                    >
                      Otelləri Axtar
                    </button>
                  </div>

                  {searchingHotels && (
                    <div className="py-8 text-center flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-[#0284c7]" size={28} />
                      <span className="text-xs text-slate-500 font-medium">RateHawk API üzərindən doluluq və otaq qiymətləri yoxlanılır...</span>
                    </div>
                  )}

                  {!searchingHotels && hotelsList.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-xs text-[#0284c7] font-semibold mb-1">💡 Bütün qiymətlərə 10% Natoure servis haqqı əlavə edilmişdir:</p>
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
                            <div className="relative w-full sm:w-1/3 h-32 sm:h-auto">
                              <img src={ht.image} alt={ht.name} className="w-full h-full object-cover" />
                              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-[#0284c7]">
                                ⭐ {ht.rating} Reytinq
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] text-amber-500 font-bold">{"★".repeat(ht.stars)}</span>
                                <h4 className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{ht.name}</h4>
                                <p className="text-xs text-slate-400 mt-1">{ht.location}</p>
                              </div>
                              <div className="flex items-end justify-between mt-4 border-t border-slate-50 pt-2">
                                <div>
                                  <span className="text-xs font-extrabold text-slate-900">${nightPrice}</span>
                                  <span className="text-[10px] text-slate-400 font-normal"> / gecə</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-slate-400 font-semibold">Cəmi ({totalNights} gecə): ${totalHotelCost}</div>
                                  <button
                                    onClick={() => setSelectedHotel(ht)}
                                    className={`mt-1.5 px-4 py-1 text-xs font-bold rounded-lg transition ${
                                      selectedHotel?.id === ht.id ? "bg-[#0284c7] text-white" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200"
                                    }`}
                                  >
                                    {selectedHotel?.id === ht.id ? "Seçildi" : "Seç"}
                                  </button>
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

              {/* Step 3: Car Rental Search & Results */}
              {wizardStep === "car" && (
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-4">Avtomobil icarəsi (Rent-a-car)</h3>

                  {/* Car Search Widget Card */}
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <div>Məkan: <span className="font-bold text-slate-700">{parsedParams.destination} Hava Limanı (SFO)</span></div>
                      <div>Tarixlər: <span className="font-bold text-slate-700">{parsedParams.departure_date}-dən ({totalNights} gün)</span></div>
                    </div>
                    <button
                      onClick={searchCars}
                      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
                    >
                      Avtomobilləri Axtar
                    </button>
                  </div>

                  {searchingCars && (
                    <div className="py-8 text-center flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-[#0284c7]" size={28} />
                      <span className="text-xs text-slate-500 font-medium">Maşın tədarükçüləri üzrə qiymətlər çəkilir...</span>
                    </div>
                  )}

                  {!searchingCars && carsList.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-xs text-[#0284c7] font-semibold mb-1">💡 Bütün qiymətlərə 10% Natoure servis haqqı əlavə edilmişdir:</p>
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
                            <div className="relative w-full sm:w-1/3 h-28 sm:h-auto bg-[#f8fafc]">
                              <img src={cr.image} alt={cr.name} className="w-full h-full object-contain p-2" />
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-semibold">{cr.category}</span>
                                <h4 className="font-bold text-slate-800 text-sm mt-1">{cr.name}</h4>
                              </div>
                              <div className="flex items-end justify-between mt-4 pt-2">
                                <div>
                                  <span className="text-xs font-extrabold text-slate-900">${dayPrice}</span>
                                  <span className="text-[10px] text-slate-400 font-normal"> / gün</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-slate-400 font-semibold">Cəmi ({totalNights} gün): ${totalCarCost}</div>
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
                          Checkout Mərhələsinə Keç
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Checkout & Passport Form */}
              {wizardStep === "checkout" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Passenger Form */}
                  <div className="md:col-span-7 space-y-5">
                    <h3 className="font-extrabold text-base text-slate-900 border-b pb-2">Sərnişin və Pasport Məlumatları</h3>
                    
                    {/* Passenger 1 */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">Sərnişin 1 (Əsas Sürücü)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" placeholder="Ad (First Name)"
                          className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                          value={passenger1.firstName}
                          onChange={e => setPassenger1({...passenger1, firstName: e.target.value})}
                        />
                        <input
                          type="text" placeholder="Soyad (Last Name)"
                          className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                          value={passenger1.lastName}
                          onChange={e => setPassenger1({...passenger1, lastName: e.target.value})}
                        />
                      </div>
                      <input
                        type="text" placeholder="Pasport Nömrəsi"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                        value={passenger1.passport}
                        onChange={e => setPassenger1({...passenger1, passport: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" placeholder="Doğum Tarixi (DD.MM.YYYY)"
                          className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                          value={passenger1.dob}
                          onChange={e => setPassenger1({...passenger1, dob: e.target.value})}
                        />
                        <input
                          type="text" placeholder="Pasport Bitmə Tarixi"
                          className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                          value={passenger1.expiry}
                          onChange={e => setPassenger1({...passenger1, expiry: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Passenger 2 */}
                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sərnişin 2</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text" placeholder="Ad (First Name)"
                          className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                          value={passenger2.firstName}
                          onChange={e => setPassenger2({...passenger2, firstName: e.target.value})}
                        />
                        <input
                          type="text" placeholder="Soyad (Last Name)"
                          className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                          value={passenger2.lastName}
                          onChange={e => setPassenger2({...passenger2, lastName: e.target.value})}
                        />
                      </div>
                      <input
                        type="text" placeholder="Pasport Nömrəsi"
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]"
                        value={passenger2.passport}
                        onChange={e => setPassenger2({...passenger2, passport: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Payment Invoice & Summary */}
                  <div className="md:col-span-5 space-y-4">
                    <h3 className="font-extrabold text-base text-slate-900 border-b pb-2">Sifariş xülasəsi</h3>
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 space-y-3 text-xs">
                      
                      <div className="flex justify-between items-center text-slate-500">
                        <span>✈️ Aviabilet (2 nəfər):</span>
                        <span className="font-semibold text-slate-800">${markupFlightPrice}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-500">
                        <span>🏨 Otel ({totalNights} gecə):</span>
                        <span className="font-semibold text-slate-800">${markupHotelPrice}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-500">
                        <span>🚗 İcarə maşın ({totalNights} gün):</span>
                        <span className="font-semibold text-slate-800">${markupCarPrice}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-500 border-b border-dashed pb-2">
                        <span>⚙️ Natoure Servis haqqı:</span>
                        <span className="text-emerald-600 font-bold">Daxildir ($0.00)</span>
                      </div>

                      <div className="flex justify-between items-center pt-1 font-bold text-sm">
                        <span className="text-slate-800">Yekun Ödəniş:</span>
                        <span className="text-[#0284c7] font-extrabold">${totalInvoicePrice}</span>
                      </div>
                    </div>

                    {/* Stripe mock inputs */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kredit Kartı Məlumatları</h4>
                      <div className="relative">
                        <input
                          type="text" placeholder="Card Number" defaultValue="4242 4242 4242 4242"
                          className="w-full border border-slate-200 rounded-xl p-2.5 pl-9 text-xs bg-[#f8fafc]"
                        />
                        <CreditCard size={14} className="absolute left-3 top-3.5 text-slate-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="MM/YY" defaultValue="12/29" className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                        <input type="text" placeholder="CVC" defaultValue="123" className="border border-slate-200 rounded-xl p-2.5 text-xs bg-[#f8fafc]" />
                      </div>
                    </div>

                    <button
                      onClick={runOrchestrator}
                      className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-sky-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} /> Ödəniş et və Səyahəti Bron et
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Screen 3: Auto-Booking Orchestration Simulator */}
        {screen === "orchestration" && (
          <div className="max-w-xl mx-auto mt-16 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 text-center mb-6">Rezervasiya prosesi avtomatlaşdırılır...</h2>
            
            {/* Custom progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${orchProgress}%` }}
              />
            </div>

            {/* Step list logs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</div>
                <span className="text-xs text-slate-700 font-semibold">Ödəniş təsdiqləndi. Balans capture olundu: ${totalInvoicePrice}.00</span>
              </div>

              <div className="flex items-center gap-3">
                {orchStep >= 1 ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</div>
                ) : (
                  <RefreshCw className="animate-spin text-sky-500" size={16} />
                )}
                <span className="text-xs text-slate-700 font-semibold">
                  1. Aviabiletlər bron edilir (Duffel API)... {orchStep >= 1 ? "Uğurlu! (PNR: PNR-X52B)" : "Gözlənilir"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {orchStep >= 2 ? (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">!</div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center text-xs">2</div>
                )}
                <span className={`text-xs font-semibold ${orchStep >= 2 ? "text-amber-600" : "text-slate-400"}`}>
                  2. Otel otağı bron edilir (RateHawk API)... {orchStep >= 2 ? "Failed! Otaq anlıq olaraq tükəndi." : "Gözlənilir"}
                </span>
              </div>

              {orchStep >= 2 && (
                <div className="flex items-center gap-3 transition-opacity">
                  <RefreshCw className="animate-spin text-indigo-500" size={16} />
                  <span className="text-xs text-indigo-600 font-bold">
                    3. Ağıllı Kompensasiya (Fallback) mexanizmi başladılır...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Screen 4: VIP Curator Dashboard (Upgrade Alert & Option Selection) */}
        {screen === "upgrade" && (
          <div className="max-w-3xl mx-auto mt-8 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            {/* Header style */}
            <div className="bg-[#FAF9F6] border-b border-slate-100 p-6 sm:p-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-3">
                💎 Zərif Yenilənmə (Complimentary Upgrade)
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
                Oteldə Otaq Kateqoriyası Artımı Həyata Keçirilir
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5">
                Hörmətli müştərimiz, seçdiyiniz oteldəki Stanford Court otağı son saniyədə satıldığı üçün, Natoure kuratorları və arxa plan sistemi sizin üçün eyni rayonda daha lüks 5* otellərdə pulsuz kateqoriyalı otaq artımı (upgrade) hazırlayıb. Heç bir əlavə öhdəlik daşımırsınız:
              </p>
            </div>

            {/* List of premium upgrades */}
            <div className="p-6 sm:p-8 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Təklif Olunan Alternativlər:</h3>
              
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
                      ⭐ {up.rating} Reytinq
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-500 font-bold">{"★".repeat(up.stars)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Upgrade</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{up.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{up.location}</p>
                    </div>

                    <div className="flex items-end justify-between mt-4 border-t border-slate-50 pt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 line-through">${applyNatoureMarkup(up.rawPricePerNight)}</span>
                        <span className="text-xs font-extrabold text-slate-900 ml-1.5">${applyNatoureMarkup(selectedHotel?.rawPricePerNight || 0)}</span>
                        <span className="text-[10px] text-slate-400 font-normal"> / gecə</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-emerald-600 font-bold">Qiymət fərqi: $0.00</div>
                        <button
                          onClick={() => setAlternativeHotel(up)}
                          className={`mt-1.5 px-4 py-1 text-xs font-bold rounded-lg transition ${
                            alternativeHotel?.id === up.id ? "bg-[#0284c7] text-white" : "bg-[#f1f5f9] text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {alternativeHotel?.id === up.id ? "Seçildi" : "Bu Oteli Seç"}
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

        {/* Screen 5: Final Completed Screen */}
        {screen === "final" && (
          <div className="max-w-xl mx-auto mt-8 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="text-emerald-600" size={24} />
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Rezervasiya uğurla tamamlandı!</h2>
            <p className="text-xs text-slate-400 mb-6">Sifariş Kodu: #NT-948102-SFO</p>

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
                  <div className="text-[10px] text-slate-500">RateHawk Təsdiq Kodu: <span className="font-semibold text-slate-700">RH-829104A</span> <span className="text-emerald-600 font-bold ml-1">(5* Upgrade)</span></div>
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
              Bütün biletlər və voucher sənədləriniz PDF formatında sizin qeydiyyat e-poçt ünvanınıza göndərildi.
            </p>

            <button
              onClick={() => {
                setScreen("chat");
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

      </main>

      {/* Floating AI Concierge Chat Box */}
      <div className="fixed bottom-6 right-6 z-50">
        
        {/* Toggle button */}
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xl hover:scale-105 transition flex items-center justify-center"
          >
            💬
          </button>
        ) : (
          <div className="w-80 h-[450px] bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold">Natoure Lüks Konsyerj</h4>
                  <p className="text-[10px] text-white/80">Online AI köməkçi</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conciergeMsgs.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-[#f8fafc] border border-slate-100 text-slate-700 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={conciergeInput}
                onChange={e => setConciergeInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendConciergeMsg()}
                placeholder="Konsyerjə yazın..."
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 bg-[#f8fafc]"
              />
              <button
                onClick={sendConciergeMsg}
                className="px-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                Göndər
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
