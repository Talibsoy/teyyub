"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import Image from "next/image";

interface Message {
  role: "user" | "ai";
  text: string;
  handoff?: boolean;
}

const WELCOME: Message = {
  role: "ai",
  text: "Salam! 👋 Mən Nigar xanımam, Natoure turizm məsləhətçisi. Səyahət planınızı qurmaq üçün yazın:\n\n• Haradan hara getmək istəyirsiniz?\n• Neçə nəfər və nə vaxt?\n• Büdcəniz nə qədərdir?\n\nVə ya sadəcə sərbəst yazın, mən anlayacam! ✨",
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
        const data = await res.json();
        if (data.message) {
          setMsgs(prev => [...prev, { role: "ai", text: data.message }]);
          if (!open) setUnread(u => u + 1);
        }
      } catch {}
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
      if (data.adminActive) {
        setLoading(false);
        return;
      }
      const reply = data.reply || data.message || "Bir an... Yenidən cəhd edin.";
      setMsgs(m => [...m, { role: "ai", text: reply, handoff: !!data.handoff }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMsgs(m => [...m, { role: "ai", text: "Bağlantı xətası. Yenidən cəhd edin." }]);
    } finally {
      setLoading(false);
    }
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
          width: "min(360px, calc(100vw - 32px))",
          background: "white", borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          maxHeight: "70vh", overflow: "hidden",
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
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                    maxWidth: "78%",
                    background: m.role === "user" ? "linear-gradient(135deg,#0284c7,#4f46e5)" : "#f1f5f9",
                    color: m.role === "user" ? "white" : "#1e293b",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "10px 13px",
                    fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>
                    {m.text}
                  </div>
                </div>

                {/* Handoff kartı */}
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
