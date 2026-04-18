"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
}

const WELCOME: Message = {
  role: "ai",
  text: "Salam! 👋 Mən NatoureFly AI Bələdçisiyəm. Səyahət planınızı qurmaq üçün mənə aşağıdakıları yazın:\n\n• Haradan hara getmək istəyirsiniz?\n• Neçə nəfər və nə vaxt?\n• Büdcəniz nə qədərdir?\n\nVə ya sadəcə sərbəst yazın, mən anlayacam! ✨",
};

const QUICK = [
  "Bakıdan İstanbula 3 gecə, 1500 AZN",
  "Ailə ilə Dubaya 5 gün",
  "Romantik Parisdə həftəsonu",
];

function getSessionId(): string {
  let id = localStorage.getItem("nf_chat_session");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("nf_chat_session", id); }
  return id;
}

export default function AIChatPanel() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Message[]>([WELCOME]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId, platform: "web" }),
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: "ai", text: data.reply || data.message || "Bir an... Yenidən cəhd edin." }]);
    } catch {
      setMsgs(m => [...m, { role: "ai", text: "Bağlantı xətası. Yenidən cəhd edin." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="AI Bələdçi"
        style={{
          position: "fixed", bottom: 24, left: 24, zIndex: 49,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg,#0284c7,#4f46e5)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 30px rgba(2,132,199,0.45)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open
          ? <X size={22} color="white" />
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>}
        {!open && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 12, height: 12, borderRadius: "50%",
            background: "#22c55e", border: "2px solid white",
          }} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, left: 24, zIndex: 49,
          width: "min(360px, calc(100vw - 32px))",
          background: "white", borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          maxHeight: "70vh", overflow: "hidden",
          animation: "slideUpChat 0.3s cubic-bezier(0.34,1.4,0.64,1)",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg,#0284c7,#4f46e5)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>NatoureFly AI Bələdçi</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0 }}>Səyahət planınızı birlikdə quraq</p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(34,197,94,0.2)", borderRadius: 20, padding: "3px 10px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, color: "#86efac", fontWeight: 600 }}>Aktiv</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "ai" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 2,
                    background: "linear-gradient(135deg,#0284c7,#4f46e5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    </svg>
                  </div>
                )}
                <div style={{
                  maxWidth: "78%",
                  background: m.role === "user" ? "linear-gradient(135deg,#0284c7,#4f46e5)" : "#f1f5f9",
                  color: m.role === "user" ? "white" : "#1e293b",
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "10px 13px",
                  fontSize: 13, lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg,#0284c7,#4f46e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Loader2 size={12} color="white" className="animate-spin" />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%", background: "#cbd5e1",
                      animation: "dotBounce 1.2s ease infinite",
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies (only on first message) */}
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
              placeholder="Məsələn: Bakıdan Parisə 3 nəfər, 7 gecə, büdcə..."
              style={{
                flex: 1, border: "1px solid #e2e8f0", borderRadius: 12,
                padding: "9px 13px", fontSize: 13, outline: "none",
                background: "#f8fafc", color: "#1e293b",
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
