"use client";

import React, { useState, useEffect } from "react";
import { Zap, Clock, Star, Wallet, Map, Palmtree, Wine, Users, ChevronRight, RotateCcw, ArrowRight, CheckCircle2, Calendar, UserCircle, Utensils, Heart, Compass } from "lucide-react";
import { QUIZ_QUESTIONS, ARCHETYPE_LABELS, Archetype } from "@/lib/quiz-processor";

function getSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("nf_session_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("nf_session_token", token);
  }
  return token;
}

interface SelectedAnswer {
  question_id: string;
  answer_id: string;
  score_impact: Record<string, number>;
}

type Step = "intro" | "quiz" | "loading" | "result";

// Option icons (Lucide, no emoji)
const OPTION_ICONS: Record<string, React.ReactNode> = {
  // Q1 — Enerji
  Q1_A: <Palmtree size={22} />,
  Q1_B: <Map size={22} />,
  // Q2 — Prioritet
  Q2_A: <Clock size={22} />,
  Q2_B: <Star size={22} />,
  Q2_C: <Wallet size={22} />,
  // Q3 — Yerləşmə
  Q3_A: <Star size={22} />,
  Q3_B: <Palmtree size={22} />,
  // Q4 — Axşam
  Q4_A: <Wine size={22} />,
  Q4_B: <Users size={22} />,
  // Q5 — Büdcə
  Q5_A: <Wallet size={22} />,
  Q5_B: <Wallet size={22} />,
  Q5_C: <Star size={22} />,
  Q5_D: <Zap size={22} />,
  // Q6 — Planlama (Conscientiousness)
  Q6_A: <Calendar size={22} />,
  Q6_B: <Map size={22} />,
  Q6_C: <Zap size={22} />,
  // Q7 — Sosial (Extraversion)
  Q7_A: <Users size={22} />,
  Q7_B: <UserCircle size={22} />,
  // Q8 — Yenilik (Openness)
  Q8_A: <Utensils size={22} />,
  Q8_B: <Star size={22} />,
  // Q9 — Yoldaş (Group)
  Q9_A: <UserCircle size={22} />,
  Q9_B: <Heart size={22} />,
  Q9_C: <Users size={22} />,
  Q9_D: <Zap size={22} />,
  // Q10 — Highlight
  Q10_A: <Map size={22} />,
  Q10_B: <Compass size={22} />,
  Q10_C: <Palmtree size={22} />,
};

const ARCHETYPE_ICONS: Record<Archetype, React.ReactNode> = {
  efficiency_seeker: <Zap size={32} />,
  deep_relaxer: <Palmtree size={32} />,
  silent_explorer: <Map size={32} />,
  budget_optimizer: <Wallet size={32} />,
  luxury_curator: <Star size={32} />,
  undetermined: <ChevronRight size={32} />,
};

export default function QuizWidget() {
  const [step, setStep] = useState<Step>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<SelectedAnswer[]>([]);
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nf_archetype");
    if (saved) {
      setArchetype(saved as Archetype);
      setAlreadyDone(true);
    }
    setTimeout(() => setVisible(true), 400);
  }, []);

  const question = QUIZ_QUESTIONS[currentQ];

  function handleAnswer(option: { id: string; score_impact: Record<string, number | undefined> }) {
    const cleanImpact: Record<string, number> = {};
    for (const [k, v] of Object.entries(option.score_impact)) {
      if (v !== undefined) cleanImpact[k] = v as number;
    }
    const newSelected = [
      ...selected.filter((s) => s.question_id !== question.question_id),
      { question_id: question.question_id, answer_id: option.id, score_impact: cleanImpact },
    ];
    setSelected(newSelected);
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 180);
    } else {
      submitQuiz(newSelected);
    }
  }

  async function submitQuiz(answers: SelectedAnswer[]) {
    setStep("loading");
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: getSessionToken(), answers }),
      });
      const data = await res.json();
      if (data.archetype) {
        localStorage.setItem("nf_archetype", data.archetype);
        setArchetype(data.archetype);
      }
    } catch { /* fallback: use client-side result */ }
    setTimeout(() => setStep("result"), 1000);
  }

  function resetQuiz() {
    localStorage.removeItem("nf_archetype");
    setArchetype(null);
    setAlreadyDone(false);
    setSelected([]);
    setCurrentQ(0);
    setStep("intro");
  }

  // ── Already done — compact badge ───────────────────────────────────────────
  if (alreadyDone && archetype && step === "intro") {
    const label = ARCHETYPE_LABELS[archetype];
    return (
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        display: "inline-flex", alignItems: "center", gap: 12,
        background: "white", backdropFilter: "blur(16px)",
        border: "1px solid #e2e8f0",
        borderRadius: 50, padding: "10px 20px 10px 14px",
        cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }} onClick={resetQuiz}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #0284c7, #4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white",
        }}>
          {ARCHETYPE_ICONS[archetype]}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Səyahət tipin</div>
          <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 700 }}>{label.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4, color: "#94a3b8", fontSize: 12 }}>
          <RotateCcw size={12} /> Dəyiş
        </div>
      </div>
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        display: "inline-flex", alignItems: "center", gap: 14,
        background: "white",
        border: "1.5px solid #e0f2fe",
        borderRadius: 50, padding: "10px 10px 10px 18px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 4px 20px rgba(2,132,199,0.12)",
      }}>
        {/* pulse glow */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 50,
          background: "linear-gradient(90deg, rgba(2,132,199,0.06), rgba(79,70,229,0.06))",
          animation: "quizPulse 2.5s ease-in-out infinite",
        }} />
        <Zap size={16} style={{ color: "#0284c7", flexShrink: 0, position: "relative" }} />
        <span style={{ fontSize: 14, color: "#0f172a", fontWeight: 600, position: "relative" }}>
          Sənə uyğun turları tapaq — 30 saniyə
        </span>
        <button
          onClick={() => setStep("quiz")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            color: "white", border: "none", borderRadius: 40,
            padding: "10px 20px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", flexShrink: 0, position: "relative",
            boxShadow: "0 4px 20px rgba(2,132,199,0.4)",
          }}
        >
          Başla <ChevronRight size={14} />
        </button>
        <style>{`
          @keyframes quizPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ── Quiz modal overlay ─────────────────────────────────────────────────────
  if (step === "quiz") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(2,8,23,0.75)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, animation: "fadeInBg 0.3s ease",
      }}
        onClick={(e) => { if (e.target === e.currentTarget) setStep("intro"); }}>
        <div style={{
          background: "white", borderRadius: 28, width: "100%", maxWidth: 480,
          overflow: "hidden", animation: "slideUpModal 0.35s cubic-bezier(0.34,1.4,0.64,1)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
        }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0284c7, #4f46e5)", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                Sual {currentQ + 1} / {QUIZ_QUESTIONS.length}
              </span>
              <button onClick={() => setStep("intro")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>×</button>
            </div>
            {/* Progress */}
            <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 4 }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${((currentQ + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                background: "white",
                transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
          </div>

          {/* Question */}
          <div style={{ padding: "28px 24px 24px" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 24px", textAlign: "center" }}>
              {question.prompt_text}
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: question.options.length === 3 ? "1fr 1fr 1fr" : "1fr 1fr",
              gap: 12,
            }}>
              {question.options.map((opt) => {
                const isSelected = selected.find(
                  (s) => s.question_id === question.question_id && s.answer_id === opt.id
                );
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt)}
                    style={{
                      background: isSelected ? "linear-gradient(135deg, #0284c7, #4f46e5)" : "#f8fafc",
                      border: isSelected ? "2px solid transparent" : "2px solid #e2e8f0",
                      borderRadius: 16, padding: "20px 12px",
                      cursor: "pointer", textAlign: "center",
                      transition: "all 0.15s ease",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#0284c7"; e.currentTarget.style.background = "rgba(2,132,199,0.06)"; } }}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; } }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isSelected ? "rgba(255,255,255,0.2)" : "rgba(2,132,199,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSelected ? "white" : "#0284c7",
                    }}>
                      {OPTION_ICONS[opt.id]}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 700, lineHeight: 1.3,
                      color: isSelected ? "white" : "#0f172a",
                    }}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUpModal {
            from { opacity: 0; transform: translateY(40px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(2,8,23,0.75)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          background: "white", borderRadius: 28, padding: "48px 40px",
          textAlign: "center", minWidth: 280,
          animation: "slideUpModal 0.3s ease",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", color: "white",
            animation: "spinSlow 1.5s linear infinite",
          }}>
            <Zap size={28} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Profil yaradılır...</p>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Cavabların analiz edilir</p>
        </div>
        <style>{`
          @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (step === "result" && archetype) {
    const label = ARCHETYPE_LABELS[archetype];
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(2,8,23,0.75)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
        onClick={(e) => { if (e.target === e.currentTarget) setStep("intro"); }}>
        <div style={{
          background: "white", borderRadius: 28, width: "100%", maxWidth: 420,
          overflow: "hidden", animation: "slideUpModal 0.4s cubic-bezier(0.34,1.4,0.64,1)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
        }}>
          {/* Gradient top */}
          <div style={{
            background: "linear-gradient(135deg, #0284c7, #4f46e5)",
            padding: "36px 32px 28px", textAlign: "center",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: "white",
            }}>
              {ARCHETYPE_ICONS[archetype]}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
              Səyahət Tipin
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 900, color: "white", margin: 0 }}>
              {label.name}
            </h3>
          </div>

          <div style={{ padding: "24px 28px 28px" }}>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: "0 0 20px", textAlign: "center" }}>
              {label.desc}
            </p>

            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(2,132,199,0.06)", borderRadius: 12,
              padding: "12px 16px", marginBottom: 20,
            }}>
              <CheckCircle2 size={16} style={{ color: "#0284c7", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>
                Tur nəticələrin sənin profilinə görə sıralanacaq
              </span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <a href="/turlar" style={{
                flex: 1, background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                color: "white", textDecoration: "none", borderRadius: 14,
                padding: "14px", fontSize: 14, fontWeight: 700, textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: "0 8px 24px rgba(2,132,199,0.35)",
              }}>
                Turlarıma Bax <ArrowRight size={16} />
              </a>
              <button onClick={resetQuiz} style={{
                background: "#f1f5f9", border: "none", borderRadius: 14,
                padding: "14px 18px", fontSize: 13, color: "#64748b",
                cursor: "pointer", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <RotateCcw size={14} /> Yenidən
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
