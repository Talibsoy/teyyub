"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Globe, Brain, Plane, Star, X, Loader2,
  MapPin, Shield, TrendingUp, Headphones, ChevronRight,
  ArrowRight, Zap
} from "lucide-react";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Tag { label: string; emoji: string }
interface Destination { name: string; country: string; img: string; span?: string }
interface ModalData { destination: string; hotel: string; img: string; price: string; rating: number; review: string }

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TAGS: Tag[] = [
  { label: "Romantik cütlük səyahəti", emoji: "💑" },
  { label: "Ailə ilə Dubaya uçuş", emoji: "✈️" },
  { label: "Büdcəyə uyğun Antalya", emoji: "🏖️" },
  { label: "Baliyə ekzotik tur", emoji: "🌴" },
  { label: "Parisə mədəniyyət səyahəti", emoji: "🗼" },
  { label: "Tokio macərası", emoji: "🗾" },
];

const PARTNERS = ["SkyData", "GlobalHotels", "AirConnect", "WorldFare", "TravelHub", "SafeJourney"];

const DESTINATIONS: Destination[] = [
  { name: "Dubai", country: "BƏƏ", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", span: "col-span-2 row-span-2" },
  { name: "Paris", country: "Fransa", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80" },
  { name: "Bali", country: "İndoneziya", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
  { name: "Antalya", country: "Türkiyə", img: "https://images.unsplash.com/photo-1571366343168-631c5bcca7a4?w=600&q=80", span: "col-span-2" },
  { name: "Tokyo", country: "Yaponiya", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
];

const LOADING_STEPS = ["Təhlil edilir...", "Məkanlar axtarılır...", "Paket hazırlanır...", "Tamamlanır..."];

const MODAL_RESULT: ModalData = {
  destination: "Antalya, Türkiyə",
  hotel: "Rixos Premium Belek",
  img: "https://images.unsplash.com/photo-1571366343168-631c5bcca7a4?w=900&q=85",
  price: "3.250 AZN",
  rating: 5,
  review: "Sizin istəyinizə əsasən Rixos Premium Belek ideal seçimdir — ultraall-inclusive, şəxsi çimərlik və romantik atmosfer. Gidiş-dönüş uçuş daxildir.",
};

// ─── BLOB COMPONENT ───────────────────────────────────────────────────────────
function AnimatedBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div style={{
        position: "absolute", top: "-10%", left: "-10%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(2,132,199,0.18) 0%, transparent 70%)",
        animation: "blob 8s ease-in-out infinite",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", top: "20%", right: "-5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)",
        animation: "blob 10s ease-in-out infinite 2s",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", bottom: "5%", left: "30%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(2,132,199,0.12) 0%, transparent 70%)",
        animation: "blob 12s ease-in-out infinite 4s",
        filter: "blur(40px)",
      }} />
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      transition: "all 0.3s",
      background: scrolled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
      backdropFilter: "blur(20px)",
      borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
      boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.05)" : "none",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Globe size={20} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #0284c7, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Natoure
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex" style={{ gap: 32 }}>
          {["Necə İşləyir", "Üstünlüklər", "Kəşf Et"].map(l => (
            <a key={l} href={`#${l}`} style={{ color: "#475569", fontWeight: 500, fontSize: 15, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0284c7")}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button style={{
          padding: "10px 22px", borderRadius: 12, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #0284c7, #4f46e5)",
          color: "white", fontWeight: 600, fontSize: 15,
          boxShadow: "0 4px 15px rgba(2,132,199,0.3)", transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(2,132,199,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(2,132,199,0.3)"; }}>
          Planla
        </button>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection({ onResult }: { onResult: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingStep(0);
    LOADING_STEPS.forEach((_, i) => {
      setTimeout(() => setLoadingStep(i), i * 900);
    });
    setTimeout(() => {
      setIsLoading(false);
      setLoadingStep(-1);
      onResult();
    }, 3800);
  };

  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 60px" }}>
      <AnimatedBlobs />
      <div style={{ maxWidth: 780, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Badge */}
        <div className="fade-in-up" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 50, background: "rgba(2,132,199,0.1)", marginBottom: 24, border: "1px solid rgba(2,132,199,0.2)" }}>
          <Zap size={14} style={{ color: "#0284c7" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0284c7" }}>AI ilə Gücləndirilib</span>
        </div>

        {/* Title */}
        <h1 className="fade-in-up" style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16, color: "#0f172a", animationDelay: "0.1s" }}>
          Dünyanı Kəşf Etməyin{" "}
          <span style={{ background: "linear-gradient(135deg, #0284c7, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Ən Ağıllı Yolu
          </span>
        </h1>

        <p className="fade-in-up" style={{ fontSize: 18, color: "#64748b", marginBottom: 40, lineHeight: 1.6, animationDelay: "0.2s" }}>
          Sadəcə arzunuzu yazın — AI qalan hər şeyi planlaşdırır.
        </p>

        {/* Prompt Box */}
        <div className="fade-in-up" style={{
          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)",
          borderRadius: 24, padding: 6, boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(2,132,199,0.15)",
          animationDelay: "0.3s",
        }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Məsələn: Gələn ay yoldaşımla romantik və isti bir yerə getmək istəyirik, büdcəmiz 2000 AZN-dir..."
            style={{
              width: "100%", minHeight: 120, padding: "20px 24px",
              border: "none", outline: "none", resize: "none",
              fontSize: 16, color: "#1e293b", background: "transparent",
              fontFamily: "inherit", lineHeight: 1.6,
              borderRadius: 20,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 8px 8px" }}>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 16, border: "none", cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
                background: isLoading || !prompt.trim() ? "#cbd5e1" : "linear-gradient(135deg, #0284c7, #4f46e5)",
                color: "white", fontWeight: 700, fontSize: 16,
                transition: "all 0.2s", boxShadow: isLoading || !prompt.trim() ? "none" : "0 8px 25px rgba(2,132,199,0.4)",
              }}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isLoading ? LOADING_STEPS[loadingStep] || "..." : "Generasiya Et"}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="fade-in-up" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 20, animationDelay: "0.4s" }}>
          {TAGS.map(tag => (
            <button key={tag.label} onClick={() => setPrompt(tag.label)}
              style={{
                padding: "8px 16px", borderRadius: 50, border: "1px solid rgba(2,132,199,0.2)",
                background: "rgba(255,255,255,0.8)", color: "#334155", fontSize: 14, fontWeight: 500,
                cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(2,132,199,0.1)"; e.currentTarget.style.borderColor = "#0284c7"; e.currentTarget.style.color = "#0284c7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(2,132,199,0.2)"; e.currentTarget.style.color = "#334155"; }}>
              {tag.emoji} {tag.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PARTNERS ─────────────────────────────────────────────────────────────────
function PartnersSection() {
  return (
    <section style={{ padding: "40px 24px", background: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
          Etibarlı Tərəfdaşlarımız
        </p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px 40px" }}>
          {PARTNERS.map(p => (
            <span key={p} style={{
              fontSize: 18, fontWeight: 700, color: "#cbd5e1", letterSpacing: -0.5,
              cursor: "default", transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0284c7")}
              onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { icon: <Sparkles size={28} />, title: "İstəyini Bildir", desc: "Arzuladığın səyahəti sadə sözlərlə yazın. Tarix, büdcə, rəfiqənin zövqü — hər şeyi deyə bilərsiniz." },
    { icon: <Brain size={28} />, title: "AI Analiz Edir", desc: "Süni intellektimiz minlərlə variantı saniyələr içində analiz edir, sizə ən uyğun paketləri tapır." },
    { icon: <Plane size={28} />, title: "Təsdiqlə və Get", desc: "Təklif olunan paketi bəyənin, bir kliklə təsdiq edin. Qalanı biz edirik." },
  ];

  return (
    <section id="Necə İşləyir" style={{ padding: "100px 24px", background: "#f8fafc" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ color: "#0284c7", fontWeight: 600, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Sadə Prosess</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#0f172a" }}>Necə İşləyir?</h2>
        </div>

        <div style={{ display: "flex", gap: 0, position: "relative", flexWrap: "wrap", justifyContent: "center" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "stretch", flex: "1 1 280px" }}>
              <div style={{
                flex: 1, background: "white", borderRadius: 20, padding: 36,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)",
                textAlign: "center", position: "relative",
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(2,132,199,0.1), rgba(79,70,229,0.1))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px", color: "#0284c7",
                }}>
                  {step.icon}
                </div>
                <div style={{
                  position: "absolute", top: 20, left: 20,
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: 13,
                }}>
                  {i + 1}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>{step.title}</h3>
                <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: 15 }}>{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex" style={{ alignItems: "center", padding: "0 8px", color: "#cbd5e1" }}>
                  <ChevronRight size={28} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: <MapPin size={24} />, tag: "Pre-Trip", title: "Mükəmməl Plan", desc: "Viza, sığorta, otel, uçuş — hər şey bir yerdə. Çaşdırıcı seçimləri unudun.", color: "#0284c7" },
    { icon: <Headphones size={24} />, tag: "On-Trip", title: "24/7 Dəstək", desc: "Səyahət zamanı istənilən problemdə AI köməyiniz hazırdır. Dil maneəsi yoxdur.", color: "#4f46e5" },
    { icon: <TrendingUp size={24} />, tag: "Smart Pricing", title: "Ən Yaxşı Qiymət", desc: "AI real-time qiymət analizi aparır, sizi həmişə ən sərfəli tarifə yönləndirir.", color: "#0ea5e9" },
    { icon: <Shield size={24} />, tag: "Post-Trip", title: "Xatirə & Növbəti", desc: "Səyahətiniz bitdikdən sonra rəylər, fotolar və növbəti mükəmməl tur tövsiyəsi.", color: "#6366f1" },
  ];

  return (
    <section id="Üstünlüklər" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ color: "#0284c7", fontWeight: 600, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Niyə Natoure?</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#0f172a" }}>Tam Səyahət Təcrübəsi</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {features.map(f => (
            <div key={f.tag}
              style={{
                background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
                borderRadius: 20, padding: 32, border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.06)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: f.color, letterSpacing: 1, textTransform: "uppercase" }}>{f.tag}</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: 15 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── BENTO GRID ───────────────────────────────────────────────────────────────
function BentoGridSection() {
  return (
    <section id="Kəşf Et" style={{ padding: "100px 24px", background: "#f8fafc" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ color: "#0284c7", fontWeight: 600, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Dünya Sizi Gözləyir</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#0f172a" }}>Populyar Məkanlar</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 220px)", gap: 16 }}>
          {DESTINATIONS.map((d, i) => (
            <div key={d.name}
              style={{
                gridColumn: i === 0 ? "span 2" : "span 1",
                gridRow: i === 0 ? "span 2" : "span 1",
                borderRadius: 20, overflow: "hidden", position: "relative", cursor: "pointer",
              }}>
              <img src={d.img} alt={d.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.07)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
              }} />
              <div style={{ position: "absolute", bottom: 20, left: 20 }}>
                <p style={{ color: "white", fontWeight: 800, fontSize: i === 0 ? 28 : 20, margin: 0 }}>{d.name}</p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>{d.country}</p>
              </div>
              <div style={{
                position: "absolute", top: 14, right: 14,
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
                borderRadius: 8, padding: "4px 10px",
              }}>
                <MapPin size={12} color="white" style={{ display: "inline", marginRight: 4 }} />
                <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>Kəşf Et</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          background: "linear-gradient(135deg, #0284c7, #4f46e5)",
          borderRadius: 32, padding: "64px 48px",
          boxShadow: "0 30px 80px rgba(2,132,199,0.3)",
        }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "white", marginBottom: 16 }}>
            Səyahətinizi Planlamağa Hazırsınız?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, lineHeight: 1.6, marginBottom: 36 }}>
            İlk AI ilə planlanmış turunu pulsuz sınayın. Heç bir ödəniş, heç bir öhdəlik.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{
              padding: "14px 32px", borderRadius: 14, border: "none",
              background: "white", color: "#0284c7", fontWeight: 700, fontSize: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              transition: "transform 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              İndi Başla <ArrowRight size={18} />
            </button>
            <button style={{
              padding: "14px 32px", borderRadius: 14, cursor: "pointer",
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)",
              color: "white", fontWeight: 600, fontSize: 16, backdropFilter: "blur(10px)",
              transition: "background 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
              Bizi Tanı
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function FooterSection() {
  const cols = [
    { title: "Platforma", links: ["Necə İşləyir", "Qiymətlər", "API", "Tərəfdaşlar"] },
    { title: "Dəstək", links: ["Yardım Mərkəzi", "Əlaqə", "Canlı Dəstək", "FAQ"] },
    { title: "Şirkət", links: ["Haqqımızda", "Karyera", "Blog", "Gizlilik"] },
  ];
  return (
    <footer style={{ background: "#0f172a", color: "white", padding: "64px 24px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#0284c7,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Globe size={18} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 18 }}>Natoure</span>
            </div>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: 15, maxWidth: 260 }}>
              AI ilə gücləndirilen növbəti nəsil turizm platforması.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {[Globe, Star, Zap].map((Icon, i) => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "rgba(2,132,199,0.3)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)")}>
                  <Icon size={16} color="#94a3b8" />
                </div>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>{col.title}</h4>
              {col.links.map(l => (
                <p key={l} style={{ color: "#64748b", fontSize: 14, marginBottom: 10, cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: "#475569", fontSize: 14 }}>© 2026 Natoure. Bütün hüquqlar qorunur.</p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Gizlilik Siyasəti", "İstifadə Şərtləri"].map(l => (
              <span key={l} style={{ color: "#475569", fontSize: 14, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#94a3b8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── RESULT MODAL ─────────────────────────────────────────────────────────────
function ResultModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      animation: "fadeIn 0.3s ease",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "white", borderRadius: 28, maxWidth: 520, width: "100%",
        overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
        animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Photo */}
        <div style={{ position: "relative", height: 240 }}>
          <img src={MODAL_RESULT.img} alt={MODAL_RESULT.destination} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            width: 36, height: 36, borderRadius: 50, border: "none",
            background: "rgba(0,0,0,0.4)", color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}>
            <X size={18} />
          </button>
          <div style={{ position: "absolute", bottom: 16, left: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "linear-gradient(135deg,#0284c7,#4f46e5)", borderRadius: 50, marginBottom: 6 }}>
              <Sparkles size={12} color="white" />
              <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>AI Tövsiyəsi</span>
            </div>
            <p style={{ color: "white", fontWeight: 800, fontSize: 22, margin: 0 }}>{MODAL_RESULT.destination}</p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 20, color: "#0f172a", margin: "0 0 4px" }}>{MODAL_RESULT.hotel}</h3>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: MODAL_RESULT.rating }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Başlayan qiymət</p>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 24, background: "linear-gradient(135deg,#0284c7,#4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {MODAL_RESULT.price}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>/ nəfər</p>
            </div>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 20, borderLeft: "3px solid #0284c7" }}>
            <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.7 }}>
              <strong style={{ color: "#0284c7" }}>AI Rəyi:</strong> {MODAL_RESULT.review}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button style={{
              flex: 1, padding: "14px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg,#0284c7,#4f46e5)", color: "white",
              fontWeight: 700, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              Paketi İncələ <ArrowRight size={18} />
            </button>
            <button onClick={onClose} style={{
              padding: "14px 20px", borderRadius: 14, border: "1px solid #e2e8f0",
              background: "white", color: "#64748b", fontWeight: 600, cursor: "pointer",
            }}>
              Bağla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={outfit.className} style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.7s ease forwards;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: #94a3b8; }
      `}</style>

      <Navbar />
      <HeroSection onResult={() => setShowModal(true)} />
      <PartnersSection />
      <HowItWorksSection />
      <FeaturesSection />
      <BentoGridSection />
      <CTASection />
      <FooterSection />

      {showModal && <ResultModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
