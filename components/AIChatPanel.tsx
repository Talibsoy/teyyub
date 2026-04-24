"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import Image from "next/image";

interface TourPackage {
  tour_id: string;
  tour_name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  end_date: string | null;
  hotel: string | null;
  seats_left: number;
}

interface Message {
  role: "user" | "ai";
  text: string;
  handoff?: boolean;
  tourPackage?: TourPackage | null;
}

const WELCOME: Message = {
  role: "ai",
  text: "Salam! Mən Nigar xanımam, Natoure turizm məsləhətçisi. Səyahət planınızı qurmaq üçün yazın:\n\n• Haradan hara getmək istəyirsiniz?\n• Neçə nəfər və nə vaxt?\n• Büdcəniz nə qədərdir?\n\nVə ya sadəcə sərbəst yazın, mən anlayacam!",
};

const QUICK = [
  "Bakıdan Antalyaya tur var?",
  "Ailə ilə Dubaya 5 gün",
  "1500 AZN büdcəyə uyğun tur",
];

function getSessionId(): string {
  let id = localStorage.getItem("nf_chat_session");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("nf_chat_session", id); }
  return id;
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("az-AZ", { day: "numeric", month: "short", year: "numeric" });
}

function TourPackageCard({
  pkg,
  onConfirm,
  onAlternative,
}: {
  pkg: TourPackage;
  onConfirm: (pkg: TourPackage) => void;
  onAlternative: () => void;
}) {
  const nights = pkg.start_date && pkg.end_date
    ? Math.round((new Date(pkg.end_date).getTime() - new Date(pkg.start_date).getTime()) / 86400000)
    : null;

  const waText = encodeURIComponent(
    `Salam! "${pkg.tour_name}" turu ilə maraqlanıram.\nTarix: ${pkg.start_date || "açıq"}\nQiymət: ${pkg.price_azn} AZN\nRezervasiya etmək istəyirəm.`
  );

  return (
    <div style={{
      marginLeft: 30, marginTop: 4,
      background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
      border: "1.5px solid #0284c7",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)", padding: "10px 14px" }}>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 1 }}>
          Tur Paketi
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 800, color: "white" }}>{pkg.tour_name}</p>
      </div>

      {/* Details */}
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
        <Row icon="📍" text={pkg.destination} />
        {pkg.start_date && (
          <Row icon="📅" text={`${formatDate(pkg.start_date)}${pkg.end_date ? " – " + formatDate(pkg.end_date) : ""}${nights ? ` (${nights} gecə)` : ""}`} />
        )}
        {pkg.hotel && <Row icon="🏨" text={pkg.hotel} />}
        <Row icon="💰" text={`${pkg.price_azn.toLocaleString()} AZN / nəfər`} bold />
        {pkg.seats_left > 0 && pkg.seats_left <= 5 && (
          <Row icon="⚠️" text={`Son ${pkg.seats_left} yer qalıb!`} red />
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "8px 14px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
        <button
          onClick={() => onConfirm(pkg)}
          style={{
            width: "100%", padding: "10px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#0284c7,#4f46e5)",
            color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          Rezervasiya Et
        </button>
        <a
          href={`https://wa.me/994517769632?text=${waText}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "9px", borderRadius: 10,
            background: "#25D366", color: "white",
            fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp-da davam et
        </a>
        <button
          onClick={onAlternative}
          style={{
            width: "100%", padding: "8px", borderRadius: 10,
            background: "transparent", border: "1px solid #cbd5e1",
            color: "#64748b", fontSize: 12, cursor: "pointer", fontWeight: 600,
          }}
        >
          Başqa variant istəyirəm
        </button>
      </div>
    </div>
  );
}

function Row({ icon, text, bold, red }: { icon: string; text: string; bold?: boolean; red?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
      <span style={{
        fontSize: 12,
        color: red ? "#dc2626" : "#334155",
        fontWeight: bold || red ? 700 : 400,
        lineHeight: 1.4,
      }}>{text}</span>
    </div>
  );
}

export default function AIChatPanel() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Message[]>([WELCOME]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Admin mesajlarını 4 saniyədə bir yoxla
  useEffect(() => {
    const sid = getSessionId();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/poll?sessionId=${sid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.message) {
          setMsgs(prev => [...prev, { role: "ai", text: data.message }]);
          if (!open) setUnread(u => u + 1);
        }
      } catch {
        // Polling xətası — növbəti intervalda yenidən cəhd ediləcək
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [open]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55000);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: getSessionId(), platform: "web" }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (data.adminActive) { setLoading(false); return; }
      const reply = data.reply || data.message || "Bir an... Yenidən cəhd edin.";
      setMsgs(m => [...m, {
        role: "ai",
        text: reply,
        handoff: !!data.handoff,
        tourPackage: data.tourPackage || null,
      }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMsgs(m => [...m, { role: "ai", text: "Bağlantı xətası. Yenidən cəhd edin." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm(pkg: TourPackage) {
    window.location.href = `/rezervasiya?tour=${pkg.tour_id}`;
  }

  function handleAlternative() {
    send("Başqa variant istəyirəm");
  }

  return (
    <>
      {/* Üzən düymə */}
      <button
        id="ai-chat-trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="AI Bələdçi"
        style={{
          position: "fixed", bottom: 24, left: 24, zIndex: 49,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg,#0284c7,#4f46e5)",
          border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 30px rgba(2,132,199,0.45)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open
          ? <X size={22} color="white" />
          : <Image src="/logo.png" alt="Natoure" width={40} height={40}
              style={{ borderRadius: "50%", objectFit: "cover" }} />
        }
        {!open && unread > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "#ef4444", color: "#fff",
            fontSize: 11, fontWeight: 700, borderRadius: "50%",
            width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {unread}
          </span>
        )}
        {!open && unread === 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 10, height: 10, borderRadius: "50%",
            background: "#22c55e", border: "2px solid white",
          }} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, left: 24, zIndex: 49,
          width: "min(380px, calc(100vw - 32px))",
          background: "white", borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          maxHeight: "75vh", overflow: "hidden",
          border: "1px solid #e2e8f0",
          animation: "slideUpChat 0.3s cubic-bezier(0.34,1.4,0.64,1)",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#0284c7,#4f46e5)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Image src="/logo.png" alt="Natoure" width={36} height={36}
                style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.35)" }} />
              <span style={{
                position: "absolute", bottom: 1, right: 1,
                width: 9, height: 9, borderRadius: "50%",
                background: "#22c55e", border: "2px solid #0284c7",
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>Nigar xanım</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0 }}>Onlayn · Natoure məsləhətçisi</p>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4 }}>
              ×
            </button>
          </div>

          {/* Mesajlar */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-end", gap: 6,
                }}>
                  {m.role === "ai" && (
                    <Image src="/logo.png" alt="N" width={24} height={24}
                      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{
                    maxWidth: "80%",
                    background: m.role === "user" ? "linear-gradient(135deg,#0284c7,#4f46e5)" : "#f1f5f9",
                    color: m.role === "user" ? "white" : "#1e293b",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "10px 13px",
                    fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>
                    {m.text}
                  </div>
                </div>

                {/* Tur paketi kartı */}
                {m.tourPackage && (
                  <TourPackageCard
                    pkg={m.tourPackage}
                    onConfirm={handleConfirm}
                    onAlternative={handleAlternative}
                  />
                )}

                {/* Operator handoff kartı */}
                {m.handoff && (
                  <div style={{
                    marginLeft: 30,
                    background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)",
                    border: "1px solid #bae6fd",
                    borderRadius: 12, padding: "12px 14px",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#0369a1", fontWeight: 600 }}>
                      Bizimlə birbaşa əlaqə saxlayın:
                    </p>
                    <a href="tel:+994517769632" style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", borderRadius: 8,
                      background: "linear-gradient(135deg,#0284c7,#4f46e5)",
                      color: "white", textDecoration: "none",
                      fontSize: 13, fontWeight: 700,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                      +994 51 776 96 32 — Zəng edin
                    </a>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                <Image src="/logo.png" alt="N" width={24} height={24}
                  style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <div style={{ background: "#f1f5f9", borderRadius: "18px 18px 18px 4px", padding: "10px 14px" }}>
                  <span style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 7, height: 7, borderRadius: "50%", background: "#cbd5e1",
                        display: "inline-block",
                        animation: "dotBounce 1.2s ease infinite",
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Sürətli cavablar (yalnız ilk mesajda) */}
          {msgs.length === 1 && (
            <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12,
                  padding: "8px 12px", fontSize: 12, color: "#475569",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f0f9ff"; e.currentTarget.style.borderColor = "#0284c7"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Mesajınızı yazın..."
              disabled={loading}
              style={{
                flex: 1, border: "1px solid #e2e8f0", borderRadius: 12,
                padding: "9px 13px", fontSize: 13, outline: "none",
                background: loading ? "#f8fafc" : "#fff", color: "#1e293b",
              }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 12, border: "none",
                background: input.trim() && !loading ? "linear-gradient(135deg,#0284c7,#4f46e5)" : "#e2e8f0",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.2s",
              }}>
              <Send size={16} color={input.trim() && !loading ? "white" : "#94a3b8"} />
            </button>
          </div>

          <style>{`
            @keyframes slideUpChat {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes dotBounce {
              0%, 60%, 100% { transform: translateY(0); }
              30% { transform: translateY(-6px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
