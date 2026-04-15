"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Brain, Plane, Star, X, Loader2,
  MapPin, Shield, TrendingUp, Headphones, ChevronRight,
  ArrowRight, Zap,
} from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const TAGS = [
  "Romantik cütlük səyahəti",
  "Ailə ilə Dubaya uçuş",
  "Büdcəyə uyğun Antalya",
  "Baliyə ekzotik tur",
  "Parisə mədəniyyət səyahəti",
  "Tokio macərası",
];

const DESTINATIONS = [
  { name: "Dubai", country: "BƏƏ", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", large: true },
  { name: "Paris", country: "Fransa", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80" },
  { name: "Bali", country: "İndoneziya", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
  { name: "Antalya", country: "Türkiyə", img: "https://images.unsplash.com/photo-1571366343168-631c5bcca7a4?w=600&q=80", wide: true },
  { name: "Tokyo", country: "Yaponiya", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
];

const LOADING_STEPS = ["Təhlil edilir...", "Məkanlar axtarılır...", "Paket hazırlanır...", "Tamamlanır..."];

// ─── BLOBS ────────────────────────────────────────────────────────────────────
function AnimatedBlobs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(2,132,199,0.18) 0%, transparent 70%)", animation: "blob 8s ease-in-out infinite", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", top: "20%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)", animation: "blob 10s ease-in-out infinite 2s", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: "5%", left: "30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(2,132,199,0.12) 0%, transparent 70%)", animation: "blob 12s ease-in-out infinite 4s", filter: "blur(40px)" }} />
    </div>
  );
}

// ─── RESULT MODAL ─────────────────────────────────────────────────────────────
function ResultModal({ onClose, aiReply }: { onClose: () => void; aiReply: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeIn 0.3s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 28, maxWidth: 560, width: "100%", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.3)", animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} color="white" />
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Nigar xanımın Tövsiyəsi</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "24px 28px 28px", maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ background: "#f8fafc", borderRadius: 14, padding: "16px 18px", marginBottom: 20, borderLeft: "3px solid #0284c7" }}>
            <p style={{ margin: 0, color: "#0f172a", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {aiReply}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="/turlar" style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#0284c7,#4f46e5)", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
              Turları İncələ <ArrowRight size={18} />
            </a>
            <button onClick={onClose} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>
              Bağla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    sessionIdRef.current = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingStep(0);

    // Loading animasiyası
    const stepTimers = LOADING_STEPS.map((_, i) => setTimeout(() => setLoadingStep(i), i * 900));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message: prompt }),
      });
      const data = await res.json();
      stepTimers.forEach(clearTimeout);
      setAiReply(data.reply || "Cavab alınmadı. Zəhmət olmasa yenidən cəhd edin.");
      setShowModal(true);
    } catch {
      stepTimers.forEach(clearTimeout);
      setAiReply("Bağlantı xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin.");
      setShowModal(true);
    } finally {
      setIsLoading(false);
      setLoadingStep(-1);
    }
  };

  return (
    <>
      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
        <AnimatedBlobs />
        <div style={{ maxWidth: 780, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>

          <div className="fade-in-up" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 50, background: "rgba(2,132,199,0.1)", marginBottom: 24, border: "1px solid rgba(2,132,199,0.2)" }}>
            <Zap size={14} style={{ color: "#0284c7" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0284c7" }}>AI ilə Gücləndirilib</span>
          </div>

          <h1 className="fade-in-up" style={{ fontSize: "clamp(36px, 6vw, 66px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16, color: "#0f172a", animationDelay: "0.1s" }}>
            Dünyanı Kəşf Etməyin{" "}
            <span style={{ background: "linear-gradient(135deg, #0284c7, #4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Ən Ağıllı Yolu
            </span>
          </h1>

          <p className="fade-in-up" style={{ fontSize: 18, color: "#475569", marginBottom: 40, lineHeight: 1.6, animationDelay: "0.2s" }}>
            Sadəcə arzunuzu yazın — AI qalan hər şeyi planlaşdırır.
          </p>

          {/* Prompt Box */}
          <div className="fade-in-up" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", borderRadius: 24, padding: 6, boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(2,132,199,0.15)", animationDelay: "0.3s" }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Məsələn: Gələn ay yoldaşımla romantik və isti bir yerə getmək istəyirik, büdcəmiz 2000 AZN-dir..."
              style={{ width: "100%", minHeight: 120, padding: "20px 24px", border: "none", outline: "none", resize: "none", fontSize: 16, color: "#1e293b", background: "transparent", fontFamily: "inherit", lineHeight: 1.6, borderRadius: 20 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 8px 8px" }}>
              <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 16, border: "none", cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer", background: isLoading || !prompt.trim() ? "#cbd5e1" : "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", fontWeight: 700, fontSize: 16, transition: "all 0.2s", boxShadow: isLoading || !prompt.trim() ? "none" : "0 8px 25px rgba(2,132,199,0.4)" }}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isLoading ? LOADING_STEPS[loadingStep] || "..." : "Generasiya Et"}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="fade-in-up" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 20, animationDelay: "0.4s" }}>
            {TAGS.map(tag => (
              <button key={tag} onClick={() => setPrompt(tag)}
                style={{ padding: "8px 16px", borderRadius: 50, border: "1px solid rgba(2,132,199,0.2)", background: "rgba(255,255,255,0.8)", color: "#334155", fontSize: 14, fontWeight: 500, cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(2,132,199,0.1)"; e.currentTarget.style.borderColor = "#0284c7"; e.currentTarget.style.color = "#0284c7"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(2,132,199,0.2)"; e.currentTarget.style.color = "#334155"; }}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "100px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: "#1e40af", fontWeight: 600, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Sadə Prosess</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a" }}>Necə İşləyir?</h2>
          </div>
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: <Sparkles size={28} />, title: "İstəyini Bildir", desc: "Arzuladığın səyahəti sadə sözlərlə yazın. Tarix, büdcə, zövq — hər şeyi deyə bilərsiniz." },
              { icon: <Brain size={28} />, title: "AI Analiz Edir", desc: "Süni intellektimiz minlərlə variantı saniyələr içində analiz edir, sizə uyğun paketləri tapır." },
              { icon: <Plane size={28} />, title: "Təsdiqlə və Get", desc: "Paketi bəyənin, bir kliklə təsdiq edin. Qalanı biz edirik." },
            ].map((step, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "stretch", flex: "1 1 260px" }}>
                <div style={{ flex: 1, background: "white", borderRadius: 20, padding: 36, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)", textAlign: "center", position: "relative" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,rgba(2,132,199,0.1),rgba(79,70,229,0.1))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#0284c7" }}>{step.icon}</div>
                  <div style={{ position: "absolute", top: 20, left: 20, width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#0284c7,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>{i + 1}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>{step.title}</h3>
                  <p style={{ color: "#475569", lineHeight: 1.7, fontSize: 15 }}>{step.desc}</p>
                </div>
                {i < arr.length - 1 && <div className="hidden md:flex" style={{ alignItems: "center", padding: "0 8px", color: "#cbd5e1" }}><ChevronRight size={28} /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: "#1e40af", fontWeight: 600, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Niyə Natoure?</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a" }}>Tam Səyahət Təcrübəsi</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
            {[
              { icon: <MapPin size={24} />, tag: "Pre-Trip", title: "Mükəmməl Plan", desc: "Viza, sığorta, otel, uçuş — hər şey bir yerdə.", color: "#0284c7" },
              { icon: <Headphones size={24} />, tag: "On-Trip", title: "24/7 Dəstək", desc: "Səyahət zamanı istənilən problemdə AI köməyiniz hazırdır.", color: "#4f46e5" },
              { icon: <TrendingUp size={24} />, tag: "Smart Pricing", title: "Ən Yaxşı Qiymət", desc: "AI real-time qiymət analizi aparır, ən sərfəli tarifi tapır.", color: "#0ea5e9" },
              { icon: <Shield size={24} />, tag: "Post-Trip", title: "Xatirə & Növbəti", desc: "Rəylər, fotolar və növbəti mükəmməl tur tövsiyəsi.", color: "#6366f1" },
            ].map(f => (
              <div key={f.tag}
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderRadius: 20, padding: 32, border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)", transition: "transform 0.2s,box-shadow 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.06)"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color }}>{f.icon}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: f.color, letterSpacing: 1, textTransform: "uppercase" }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: "#475569", lineHeight: 1.7, fontSize: 15 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO GRID ── */}
      <section style={{ padding: "100px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ color: "#1e40af", fontWeight: 600, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Dünya Sizi Gözləyir</p>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#0f172a" }}>Populyar Məkanlar</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridTemplateRows: "repeat(2,220px)", gap: 16 }}>
            {DESTINATIONS.map((d, i) => (
              <div key={d.name} style={{ gridColumn: d.large ? "span 2" : d.wide ? "span 2" : "span 1", gridRow: d.large ? "span 2" : "span 1", borderRadius: 20, overflow: "hidden", position: "relative", cursor: "pointer" }}>
                <img src={d.img} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.07)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.1) 50%,transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: 20, left: 20 }}>
                  <p style={{ color: "white", fontWeight: 800, fontSize: d.large ? 28 : 20, margin: 0 }}>{d.name}</p>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0 }}>{d.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", borderRadius: 32, padding: "64px 48px", boxShadow: "0 30px 80px rgba(2,132,199,0.3)" }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: "white", marginBottom: 16 }}>Səyahətinizi Planlamağa Hazırsınız?</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, lineHeight: 1.6, marginBottom: 36 }}>İlk AI ilə planlanmış turunu pulsuz sınayın. Heç bir ödəniş tələb olunmur.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: "white", color: "#0284c7", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "transform 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                İndi Başla <ArrowRight size={18} />
              </button>
              <a href="/haqqimizda"
                style={{ padding: "14px 32px", borderRadius: 14, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "white", fontWeight: 600, fontSize: 16, textDecoration: "none", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 8 }}>
                Bizi Tanı
              </a>
            </div>
          </div>
        </div>
      </section>

      {showModal && <ResultModal onClose={() => setShowModal(false)} aiReply={aiReply} />}
    </>
  );
}
