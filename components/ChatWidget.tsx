"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

interface Msg {
  from: "user" | "admin";
  text: string;
  time: number;
}

const SERVER_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || "http://localhost:4000";

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
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("");
  const [nameAsked, setNameAsked] = useState(false);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      query: {
        sessionId: getSessionId(),
        userName: localStorage.getItem("natoure_chat_name") || "Ziyarətçi",
      },
      autoConnect: false,
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("admin_message", (msg: Msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!open) setUnread((u) => u + 1);
    });

    socket.on("message_received", (msg: Msg) => {
      setMessages((prev) => {
        // optimistic əvəzini real ilə dəyiş
        const updated = [...prev];
        const idx = updated.findLastIndex((m) => m.from === "user" && m.time === msg.time);
        if (idx === -1) updated.push(msg);
        return updated;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      socketRef.current?.connect();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      if (!nameAsked && !localStorage.getItem("natoure_chat_name")) {
        setNameAsked(true);
      }
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = input.trim();
    if (!text || !socketRef.current) return;
    const msg: Msg = { from: "user", text, time: Date.now() };
    setMessages((prev) => [...prev, msg]);
    socketRef.current.emit("user_message", text);
    setInput("");
  }

  function submitName() {
    const name = userName.trim() || "Ziyarətçi";
    localStorage.setItem("natoure_chat_name", name);
    setNameAsked(false);
    const socket = socketRef.current;
    if (!socket) return;
    socket.disconnect();
    const q = socket.io.opts.query as Record<string, string>;
    q.userName = name;
    socket.connect();
    setMessages([{ from: "admin", text: `Salam, ${name}! Natoure-yə xoş gəldiniz. Sizə necə kömək edə bilərik?`, time: Date.now() }]);
  }

  return (
    <>
      {/* Üzən düymə */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Canlı dəstək"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1e40af 0%, #0284c7 100%)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(30,64,175,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Image src="/logo.png" alt="Natoure" width={34} height={34} style={{ borderRadius: "50%", objectFit: "cover" }} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "#ef4444", color: "#fff",
            fontSize: 11, fontWeight: 700, borderRadius: "50%",
            width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {unread}
          </span>
        )}
      </button>

      {/* Chat pəncərəsi */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 96,
          right: 24,
          zIndex: 9998,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
          height: 480,
          maxHeight: "calc(100vh - 120px)",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1e40af 0%, #0284c7 100%)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{ position: "relative" }}>
              <Image src="/logo.png" alt="Natoure" width={36} height={36}
                style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)" }} />
              <span style={{
                position: "absolute", bottom: 1, right: 1,
                width: 9, height: 9, borderRadius: "50%",
                background: connected ? "#22c55e" : "#94a3b8",
                border: "2px solid #1e40af",
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Natoure Dəstək</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
                {connected ? "Onlayn" : "Qoşulur..."}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}
            >
              ×
            </button>
          </div>

          {/* Ad xahişi */}
          {nameAsked ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
              <Image src="/logo.png" alt="Natoure" width={56} height={56} style={{ borderRadius: "50%" }} />
              <p style={{ color: "#0f172a", fontWeight: 600, fontSize: 15, textAlign: "center", margin: 0 }}>
                Natoure-yə xoş gəldiniz!
              </p>
              <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", margin: 0 }}>
                Adınızı bildirin ki, sizə uyğun kömək edə bilək.
              </p>
              <input
                value={userName}
                onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitName()}
                placeholder="Adınız..."
                autoFocus
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1px solid #e2e8f0", fontSize: 14,
                  outline: "none", color: "#0f172a",
                }}
              />
              <button
                onClick={submitName}
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 10,
                  background: "linear-gradient(135deg, #1e40af, #0284c7)",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: "pointer",
                }}
              >
                Söhbəti Başlat
              </button>
            </div>
          ) : (
            <>
              {/* Mesajlar */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginTop: 40 }}>
                    Salam! Sizə necə kömək edə bilərik?
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: m.from === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 6 }}>
                    {m.from === "admin" && (
                      <Image src="/logo.png" alt="N" width={24} height={24}
                        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <div style={{
                      maxWidth: "75%",
                      padding: "8px 12px",
                      borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: m.from === "user" ? "linear-gradient(135deg, #1e40af, #0284c7)" : "#f1f5f9",
                      color: m.from === "user" ? "#fff" : "#0f172a",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8, flexShrink: 0 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Mesajınızı yazın..."
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 10,
                    border: "1px solid #e2e8f0", fontSize: 13,
                    outline: "none", color: "#0f172a",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: input.trim() ? "linear-gradient(135deg, #1e40af, #0284c7)" : "#e2e8f0",
                    border: "none", cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#fff" : "#94a3b8"} strokeWidth={2.5}>
                    <path d="m22 2-7 20-4-9-9-4 20-7z"/>
                    <path d="M22 2 11 13"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
