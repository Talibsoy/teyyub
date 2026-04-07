"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Msg {
  from: "user" | "ai";
  text: string;
  time?: number;
  handoff?: boolean;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("natoure_chat_sid");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("natoure_chat_sid", id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const [welcomed, setWelcomed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      if (!welcomed) {
        setMessages([{
          from: "ai",
          text: "Salam! Mən Nigar xanımam, Natoure-nin turizm məsləhətçisi. Sizə necə kömək edə bilərəm?",
          time: Date.now(),
        }]);
        setWelcomed(true);
      }
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { from: "user", text, time: Date.now() }]);
    setInput("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55000);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), message: text }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      const reply = data.reply || "Bağlantı xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin.";
      setMessages(prev => [...prev, { from: "ai", text: reply, time: Date.now(), handoff: !!data.handoff }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { from: "ai", text: "Bağlantı xətası. Zəhmət olmasa bir az sonra yenidən cəhd edin.", time: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Üzən düymə */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Canlı dəstək"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 60, height: 60, borderRadius: "50%",
          background: "linear-gradient(135deg, #1e40af 0%, #0284c7 100%)",
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(30,64,175,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Image src="/logo.png" alt="Natoure" width={34} height={34}
          style={{ borderRadius: "50%", objectFit: "cover" }} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700,
            borderRadius: "50%", width: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {unread}
          </span>
        )}
      </button>

      {/* Chat pəncərəsi */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 24, zIndex: 9998,
          width: 340, maxWidth: "calc(100vw - 32px)",
          height: 480, maxHeight: "calc(100vh - 120px)",
          background: "#fff", borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", border: "1px solid #e2e8f0",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1e40af 0%, #0284c7 100%)",
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <div style={{ position: "relative" }}>
              <Image src="/logo.png" alt="Natoure" width={36} height={36}
                style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)" }} />
              <span style={{
                position: "absolute", bottom: 1, right: 1,
                width: 9, height: 9, borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #1e40af",
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Nigar xanım</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>Onlayn • Natoure məsləhətçisi</div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>
              ×
            </button>
          </div>

          {/* Mesajlar */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{
                  display: "flex",
                  flexDirection: m.from === "user" ? "row-reverse" : "row",
                  alignItems: "flex-end", gap: 6,
                }}>
                  {m.from !== "user" && (
                    <Image src="/logo.png" alt="N" width={24} height={24}
                      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "9px 13px",
                    borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.from === "user"
                      ? "linear-gradient(135deg, #1e40af, #0284c7)"
                      : "#f1f5f9",
                    color: m.from === "user" ? "#fff" : "#0f172a",
                    fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
                  }}>
                    {m.text}
                  </div>
                </div>
                {m.handoff && (
                  <div style={{
                    marginLeft: 30,
                    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                    border: "1px solid #bae6fd",
                    borderRadius: 12, padding: "12px 14px",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#0369a1", fontWeight: 600 }}>
                      Bizimlə birbaşa əlaqə saxlayın:
                    </p>
                    <a href="https://wa.me/994XXXXXXXXX" target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderRadius: 8,
                        background: "#22c55e", color: "white",
                        textDecoration: "none", fontSize: 13, fontWeight: 600,
                      }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                      </svg>
                      WhatsApp ilə yazın
                    </a>
                    <a href="tel:+994XXXXXXXXX"
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderRadius: 8,
                        background: "#1e40af", color: "white",
                        textDecoration: "none", fontSize: 13, fontWeight: 600,
                      }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                      Zəng edin
                    </a>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                <Image src="/logo.png" alt="N" width={24} height={24}
                  style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <div style={{ background: "#f1f5f9", borderRadius: "16px 16px 16px 4px", padding: "10px 14px" }}>
                  <span style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: "50%", background: "#94a3b8",
                        display: "inline-block",
                        animation: `bounce 1.2s ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8, flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Mesajınızı yazın..."
              disabled={loading}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10,
                border: "1px solid #e2e8f0", fontSize: 13,
                outline: "none", color: "#0f172a",
                background: loading ? "#f8fafc" : "#fff",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !loading ? "linear-gradient(135deg, #1e40af, #0284c7)" : "#e2e8f0",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() && !loading ? "#fff" : "#94a3b8"} strokeWidth={2.5}>
                <path d="m22 2-7 20-4-9-9-4 20-7z"/>
                <path d="M22 2 11 13"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
