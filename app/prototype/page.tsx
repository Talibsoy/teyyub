"use client";

import { useState, useRef, useEffect } from "react";

/* ─── Types ─────────────────────────────────────────── */
type Screen = "landing" | "quiz" | "loading" | "dashboard";
type AKey = "luxury_curator" | "budget_optimizer" | "deep_relaxer" | "silent_explorer" | "efficiency_seeker";

interface Arch {
  key: AKey;
  label: string;
  emoji: string;
  color: string;        // tailwind gradient
  tagline: string;
  tips: string[];
}

interface Q {
  id: number;
  q: string;
  options: { label: string; value: string; img: string }[];
}

interface Hotel {
  id: number;
  name: string;
  dest: string;
  country: string;
  stars: number;
  price: number;
  img: string;
  tags: string[];
  scores: Record<AKey, number>; // 0-100 match
}

interface Msg { role: "user" | "bot"; text: string }

/* ─── Data ───────────────────────────────────────────── */
const ARCHETYPES: Record<AKey, Arch> = {
  luxury_curator: {
    key: "luxury_curator", label: "Lüks Zövq Sahibi", emoji: "💎",
    color: "from-amber-500 to-yellow-400",
    tagline: "Siz ən yaxşısını layiqsiniz — komfort və estetika hər şeydən önəmlidir.",
    tips: ["5* otellər filtrini açın", "All-inclusive paketlərə baxın", "Özel transfer əlavə edin"],
  },
  budget_optimizer: {
    key: "budget_optimizer", label: "Ağıllı Büdcə Ustası", emoji: "🎯",
    color: "from-emerald-500 to-teal-400",
    tagline: "Hər manatın dəyərini bilirsiz — ən sərfəli paketləri sizin üçün seçdik.",
    tips: ["Erkən rezervasiya endirimlərinə baxın", "Şərik otaq seçimini düşünün", "Off-season tarixi seçin"],
  },
  deep_relaxer: {
    key: "deep_relaxer", label: "Dərin Rahatlanma Axtaran", emoji: "🌿",
    color: "from-sky-500 to-cyan-400",
    tagline: "Qayğılardan uzaqlaşmaq üçün ən sakit məkanları sizin üçün seçdik.",
    tips: ["SPA & Wellness otellərə baxın", "Sahil bungalovlarını kəşf edin", "Minimal aktiviti paketlər"],
  },
  silent_explorer: {
    key: "silent_explorer", label: "Səssiz Kəşfçi", emoji: "🗺️",
    color: "from-violet-500 to-purple-400",
    tagline: "İzdihamdan uzaq, autentik yerləri sevən bir ruhsunuz.",
    tips: ["Gizli məkan turlarına baxın", "Kiçik butik otellər seçin", "Yerli rehberli turları kəşf edin"],
  },
  efficiency_seeker: {
    key: "efficiency_seeker", label: "Effektiv Planlayıcı", emoji: "⚡",
    color: "from-rose-500 to-pink-400",
    tagline: "Vaxtınızın hər saniyəsi dəyərlidir — hər şey öncədən planlanmış olsun.",
    tips: ["Uçuş+otel kombo paketlərə baxın", "Şəhər kartları ilə vaxt qazanın", "Sürətli checkin otellər"],
  },
};

const QUESTIONS: Q[] = [
  {
    id: 1, q: "Arzuladığınız mənzərə hansıdır?",
    options: [
      { label: "Mavi okean", value: "ocean", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
      { label: "Dağ zirvəsi", value: "mountain", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
      { label: "Şəhər ışıqları", value: "city", img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80" },
      { label: "Kənd sakitliyi", value: "countryside", img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80" },
    ],
  },
  {
    id: 2, q: "Gündəlik büdcəniz nə qədərdir?",
    options: [
      { label: "100–200 AZN", value: "budget", img: "https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=400&q=80" },
      { label: "200–400 AZN", value: "mid", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80" },
      { label: "400–700 AZN", value: "premium", img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80" },
      { label: "700+ AZN", value: "luxury", img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80" },
    ],
  },
  {
    id: 3, q: "Kimlərlə səyahət edirsiniz?",
    options: [
      { label: "Tənha", value: "solo", img: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=400&q=80" },
      { label: "Sevgili ilə", value: "couple", img: "https://images.unsplash.com/photo-1502503719153-330ec2bfea5c?w=400&q=80" },
      { label: "Ailə", value: "family", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80" },
      { label: "Dostlar qrupu", value: "group", img: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400&q=80" },
    ],
  },
  {
    id: 4, q: "Ən çox nə etməyi sevərdiniz?",
    options: [
      { label: "Plajda uzanmaq", value: "beach", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
      { label: "Mədəniyyət & tarix", value: "culture", img: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&q=80" },
      { label: "Macəra & idman", value: "adventure", img: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80" },
      { label: "Yeməkxana & ləzzət", value: "food", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80" },
    ],
  },
];

const HOTELS: Hotel[] = [
  {
    id: 1, name: "Rixos Premium Dubrovnik", dest: "Dubrovnik", country: "Xorvatiya",
    stars: 5, price: 890, tags: ["All-Inclusive", "Sahil", "5★"],
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    scores: { luxury_curator: 96, budget_optimizer: 30, deep_relaxer: 82, silent_explorer: 55, efficiency_seeker: 70 },
  },
  {
    id: 2, name: "Anantara Maldives", dest: "Malediv", country: "Malediv adaları",
    stars: 5, price: 1450, tags: ["Su Bungalov", "SPA", "5★"],
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    scores: { luxury_curator: 99, budget_optimizer: 10, deep_relaxer: 95, silent_explorer: 88, efficiency_seeker: 40 },
  },
  {
    id: 3, name: "ibis Styles Barcelona", dest: "Barselona", country: "İspaniya",
    stars: 3, price: 180, tags: ["Şəhər", "Mərkəz", "3★"],
    img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80",
    scores: { luxury_curator: 30, budget_optimizer: 90, deep_relaxer: 40, silent_explorer: 55, efficiency_seeker: 88 },
  },
  {
    id: 4, name: "Reethi Faru Resort", dest: "Raa Atoll", country: "Malediv adaları",
    stars: 5, price: 980, tags: ["Mərcan", "Dalğıc", "5★"],
    img: "https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=600&q=80",
    scores: { luxury_curator: 88, budget_optimizer: 25, deep_relaxer: 92, silent_explorer: 98, efficiency_seeker: 35 },
  },
  {
    id: 5, name: "Aloft Bangkok Sukhumvit 11", dest: "Banqkok", country: "Tailand",
    stars: 4, price: 220, tags: ["Şəhər", "Rooftop", "4★"],
    img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    scores: { luxury_curator: 55, budget_optimizer: 82, deep_relaxer: 45, silent_explorer: 60, efficiency_seeker: 95 },
  },
  {
    id: 6, name: "Capri Palace Jumeirah", dest: "Kapri", country: "İtaliya",
    stars: 5, price: 1200, tags: ["Ada", "Dəniz", "5★"],
    img: "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=600&q=80",
    scores: { luxury_curator: 93, budget_optimizer: 15, deep_relaxer: 88, silent_explorer: 92, efficiency_seeker: 50 },
  },
];

/* ─── Archetype logic ────────────────────────────────── */
function determineArchetype(answers: string[]): AKey {
  const counts: Record<AKey, number> = {
    luxury_curator: 0, budget_optimizer: 0, deep_relaxer: 0,
    silent_explorer: 0, efficiency_seeker: 0,
  };
  for (const a of answers) {
    if (["luxury", "premium"].includes(a)) counts.luxury_curator += 2;
    if (["budget", "mid"].includes(a)) counts.budget_optimizer += 2;
    if (["ocean", "beach", "countryside"].includes(a)) counts.deep_relaxer += 2;
    if (["mountain", "culture"].includes(a)) counts.silent_explorer += 2;
    if (["city", "food"].includes(a)) counts.efficiency_seeker += 2;
    if (a === "solo") counts.silent_explorer += 1;
    if (a === "couple") counts.deep_relaxer += 1;
    if (a === "family") counts.efficiency_seeker += 1;
    if (a === "group") counts.budget_optimizer += 1;
    if (a === "adventure") counts.silent_explorer += 1;
  }
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as AKey;
}

/* ─── Chat bot replies ───────────────────────────────── */
function chatReply(text: string, arch: AKey | null): string {
  const t = text.toLowerCase();
  if (t.includes("dubay") || t.includes("dubai")) {
    return "Dubai haqqında: Rixos Premium Dubai 5★, şəxsi sahil, all-inclusive, nəfər başına 650 AZN/gecə. Rezervasiya üçün WhatsApp-a yazmağınız kifayətdir.";
  }
  if (t.includes("maldiv") || t.includes("maldives")) {
    return "Malediv paketi üçün Anantara Resort üzərindən su üstündə bungalov təklif edirəm. 7 gecə, cütlük üçün 2.900 AZN-dən başlayır.";
  }
  if (t.includes("ucuz") || t.includes("büdcə") || t.includes("qiymət")) {
    return "Büdcəyə uyğun variantlarımız: Barselona ibis Styles (180 AZN/gecə), Bangkok Aloft (220 AZN/gecə). Hansı tarixlərə baxım?";
  }
  if (t.includes("uçuş") || t.includes("bilet")) {
    return "Bakı–İstanbul: 180 AZN (birbaşa, AZAL), Bakı–Dubai: 220 AZN (birbaşa). Dönüş biletini də axtarım?";
  }
  if (t.includes("viza") || t.includes("sənəd")) {
    return "Türkiyə, BAƏ, Malediv — vizasız. İtaliya, İspaniya üçün Şengen viza lazımdır (7-10 iş günü). Kömək edim?";
  }
  if (arch === "luxury_curator") {
    return "Lüks zövqünüzə uyğun tövsiyə: Kapri Jumeirah 5★ — ada mənzərəli suit, özel qayk turu daxil. Qiymət: 1.200 AZN/gecə.";
  }
  if (arch === "budget_optimizer") {
    return "Büdcə dostu seçim: Barselona 7 gecə + uçuş = 1.450 AZN. Erkən rezervasiyada 15% endirim tətbiq edilir.";
  }
  return "Mənə daha ətraflı məlumat verin — istiqamət, tarix, nəfər sayı — ən uyğun paketi sizin üçün seçim! ✈️";
}

/* ─── Sub-components ─────────────────────────────────── */
function GlowOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div className="blob absolute top-[-8rem] left-[-6rem] w-96 h-96 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="blob blob-delay absolute bottom-[10%] right-[-4rem] w-80 h-80 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="blob blob-delay2 absolute top-[40%] left-[40%] w-64 h-64 rounded-full bg-indigo-400/15 blur-3xl" />
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

/* ─── Pages ──────────────────────────────────────────── */
function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <span className="font-bold text-xl bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
          Natoure
        </span>
        <button
          onClick={onStart}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-sm font-semibold shadow hover:opacity-90 transition"
        >
          Başla
        </button>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-4 pt-20 pb-16">
        <GlowOrbs />
        <span className="inline-block mb-4 px-4 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold tracking-wide uppercase">
          AI ilə Səyahət Planlaması
        </span>
        <h1 className="fade-in-up text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl">
          Növbəti Səyahətinizi{" "}
          <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            AI Planlasın
          </span>
        </h1>
        <p className="fade-in-up mt-4 text-slate-500 max-w-md text-lg">
          4 sual — sonra sizin üçün fərdi otel siyahısı, qiymətlər və AI səyahət köməkçisi.
        </p>
        <button
          onClick={onStart}
          className="fade-in-up mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-lg shadow-xl hover:shadow-sky-300 hover:scale-105 transition-all duration-200"
        >
          Profil Yaradın — Pulsuz ✨
        </button>
        <p className="mt-3 text-xs text-slate-400">Qeydiyyat lazım deyil • 60 saniyə çəkir</p>
      </section>

      {/* Bento grid */}
      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <h2 className="text-center text-2xl font-bold text-slate-700 mb-8">Populyar Məkanlar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-[180px]">
          {[
            { name: "Dubai", img: "https://images.unsplash.com/photo-1582672751291-7a18be9e2fe3?w=600&q=80", big: true },
            { name: "Malediv", img: "https://images.unsplash.com/photo-1499396010447-c75e58d61c2b?w=600&q=80", big: false },
            { name: "Barselona", img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80", big: false },
            { name: "Antalya", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", big: false },
            { name: "Tokio", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80", big: false },
            { name: "Kapri", img: "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=600&q=80", big: false },
          ].map((d, i) => (
            <div
              key={d.name}
              className={`relative rounded-2xl overflow-hidden cursor-pointer group ${i === 0 ? "row-span-2" : ""}`}
              onClick={onStart}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <span className="absolute bottom-3 left-3 text-white font-bold text-sm">{d.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-20 max-w-4xl mx-auto">
        <h2 className="text-center text-2xl font-bold text-slate-700 mb-10">Necə İşləyir?</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { n: "01", icon: "🧠", t: "Profil Sualları", d: "4 qısa sual ilə səyahət tipinizi müəyyən edirik." },
            { n: "02", icon: "⚡", t: "AI Analiz", d: "Süni intellekt ən uyğun otel və paketləri seçir." },
            { n: "03", icon: "✈️", t: "Rezervasiya", d: "Bir klikdə WhatsApp üzərindən rezervasiya edin." },
          ].map(s => (
            <div key={s.n} className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="text-xs text-sky-600 font-bold mb-1">{s.n}</div>
              <div className="font-bold text-slate-700 mb-2">{s.t}</div>
              <div className="text-sm text-slate-500">{s.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuizPage({
  step,
  answers,
  onAnswer,
}: {
  step: number;
  answers: string[];
  onAnswer: (v: string) => void;
}) {
  const q = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center px-4 pt-12 pb-20">
      {/* Progress */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Sual {step + 1} / {QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-8 max-w-lg">
        {q.q}
      </h2>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        {q.options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onAnswer(opt.value)}
            className="group relative rounded-2xl overflow-hidden h-36 border-2 border-transparent hover:border-sky-400 transition-all duration-200 shadow-sm hover:shadow-sky-200 hover:scale-[1.02]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={opt.img} alt={opt.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10" />
            <span className="absolute bottom-3 left-0 right-0 text-center text-white font-semibold text-sm px-2">
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LoadingPage() {
  const steps = ["Profiliniz analiz edilir...", "Uyğun otellər axtarılır...", "Fərdi siyahı hazırlanır..."];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setIdx(1), 1200);
    const t2 = setTimeout(() => setIdx(2), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-8 px-4">
      {/* Spinner */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-sky-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 spin-slow" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-indigo-400 spin-slow" style={{ animationDirection: "reverse" }} />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">✈️</span>
      </div>

      {/* Steps */}
      <div className="flex flex-col items-center gap-3">
        {steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-3 transition-all duration-500 ${i <= idx ? "opacity-100" : "opacity-20"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < idx ? "bg-sky-500 text-white" : i === idx ? "bg-indigo-500 text-white ping2" : "bg-slate-200 text-slate-400"}`}>
              {i < idx ? "✓" : i + 1}
            </span>
            <span className={`text-sm font-medium ${i <= idx ? "text-slate-700" : "text-slate-400"}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ archKey, hotels }: { archKey: AKey; hotels: Hotel[] }) {
  const arch = ARCHETYPES[archKey];
  const [chatOpen, setChatOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: `Salam! Mən sizin AI səyahət köməkçinizəm. ${arch.label} profili üçün ən yaxşı seçimlər hazırdır. Nə soruşmaq istərdiniz?` },
  ]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"hotels" | "tips">("hotels");
  const chatEnd = useRef<HTMLDivElement>(null);

  const sortedHotels = [...hotels].sort((a, b) => b.scores[archKey] - a.scores[archKey]);

  function sendMsg() {
    const t = input.trim();
    if (!t) return;
    const reply = chatReply(t, archKey);
    setMsgs(prev => [...prev, { role: "user", text: t }, { role: "bot", text: reply }]);
    setInput("");
  }

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top bar */}
      <div className={`bg-gradient-to-r ${arch.color} px-6 py-4 text-white`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-4xl">{arch.emoji}</span>
          <div className="flex-1">
            <div className="font-bold text-xl">{arch.label}</div>
            <div className="text-sm opacity-90">{arch.tagline}</div>
          </div>
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-sm font-semibold transition"
          >
            <span>💬</span> AI Köməkçi
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex px-4 gap-6">
          {[
            { id: "hotels" as const, label: "🏨 Otellər" },
            { id: "tips" as const, label: "💡 Şəxsi Tövsiyələr" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-semibold border-b-2 transition ${activeTab === tab.id ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {activeTab === "hotels" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedHotels.map(h => {
              const score = h.scores[archKey];
              return (
                <div key={h.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.img} alt={h.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-sky-700">
                      {score}% uyğun
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-sm leading-snug">{h.name}</h3>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{h.dest}, {h.country}</div>
                    <Stars n={h.stars} />
                    <div className="flex flex-wrap gap-1 mt-2 mb-3">
                      {h.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{h.price} AZN <span className="text-xs text-slate-400 font-normal">/ gecə</span></span>
                      <a
                        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "994517769632"}?text=Salam, ${encodeURIComponent(h.name)} haqqında məlumat almaq istəyirəm`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-semibold hover:opacity-90 transition"
                      >
                        Rezervasiya
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "tips" && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {arch.emoji} {arch.label} üçün Tövsiyələr
            </h2>
            <div className="flex flex-col gap-4">
              {arch.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${arch.color} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                    {i + 1}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>

            {/* Re-quiz CTA */}
            <div className="mt-8 p-5 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl border border-sky-100 text-center">
              <p className="text-sm text-slate-600 mb-3">Profili yenidən müəyyənləşdirmək istəyirsiniz?</p>
              <a href="/prototype" className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition">
                Testi Yenidən Başlat
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Chat overlay */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-8">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative z-10 w-full max-w-sm flex flex-col bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden h-[520px]">
            {/* Header */}
            <div className={`bg-gradient-to-r ${arch.color} px-4 py-3 flex items-center gap-3`}>
              <span className="text-2xl">{arch.emoji}</span>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">AI Köməkçi</div>
                <div className="text-white/80 text-xs">Natoure · Online</div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white text-xl leading-none">×</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEnd} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMsg()}
                placeholder="Sual yazın..."
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-400 bg-white"
              />
              <button
                onClick={sendMsg}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${arch.color} text-white text-sm font-semibold hover:opacity-90 transition`}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function PrototypePage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [archKey, setArchKey] = useState<AKey | null>(null);

  function handleAnswer(v: string) {
    const newAnswers = [...answers, v];
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      // All answered → loading
      setScreen("loading");
      const key = determineArchetype(newAnswers);
      setArchKey(key);
      setTimeout(() => setScreen("dashboard"), 3800);
    }
  }

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
      `}</style>

      {screen === "landing" && <LandingPage onStart={() => setScreen("quiz")} />}
      {screen === "quiz" && <QuizPage step={step} answers={answers} onAnswer={handleAnswer} />}
      {screen === "loading" && <LoadingPage />}
      {screen === "dashboard" && archKey && <Dashboard archKey={archKey} hotels={HOTELS} />}
    </>
  );
}
