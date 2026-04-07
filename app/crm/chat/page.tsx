"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, RefreshCw, Send, Bot, User, Shield } from "lucide-react";

interface Session {
  sessionId: string;
  lastMessage: string;
  lastRole: string;
  messageCount: number;
  userMessageCount: number;
  adminActive: boolean;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function CRMChatPage() {
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [history, setHistory]       = useState<Msg[]>([]);
  const [reply, setReply]           = useState("");
  const [pauseAI, setPauseAI]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/crm/chat-sessions");
    const data = await res.json();
    setSessions(data);
  }, []);

  const loadHistory = useCallback(async (sid: string) => {
    setLoading(true);
    const res = await fetch(`/api/crm/chat-sessions?sessionId=${sid}`);
    // Tarixçəni birbaşa conversation-store-dan al
    const r2 = await fetch(`/api/crm/chat-history?sessionId=${sid}`);
    if (r2.ok) {
      const data = await r2.json();
      setHistory(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  useEffect(() => {
    if (selected) loadHistory(selected);
    const interval = setInterval(() => {
      if (selected) loadHistory(selected);
    }, 4000);
    return () => clearInterval(interval);
  }, [selected, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function sendReply() {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    await fetch("/api/crm/chat-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: selected, message: reply.trim(), pauseAI }),
    });
    setReply("");
    setSending(false);
    loadHistory(selected);
  }

  async function resumeAI() {
    if (!selected) return;
    await fetch("/api/crm/chat-reply", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: selected }),
    });
    loadSessions();
  }

  const activeSession = sessions.find(s => s.sessionId === selected);

  return (
    <div style={{ display: "flex", height: "calc(100dvh - 112px)", gap: 0, background: "#f8fafc", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>

      {/* Sol — sessiyalar */}
      <div style={{ width: 280, borderRight: "1px solid #e2e8f0", background: "white", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={18} color="#0284c7" />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Canlı Chatlar</span>
          </div>
          <button onClick={loadSessions}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 6 }}>
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {sessions.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Aktiv chat yoxdur
            </div>
          ) : sessions.map(s => (
            <div key={s.sessionId}
              onClick={() => setSelected(s.sessionId)}
              style={{
                padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9",
                background: selected === s.sessionId ? "#eff6ff" : "white",
                borderLeft: selected === s.sessionId ? "3px solid #0284c7" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                  #{s.sessionId.slice(0, 8)}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  {s.adminActive && (
                    <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                      Admin
                    </span>
                  )}
                  <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4 }}>
                    {s.userMessageCount} mesaj
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.lastRole === "user" ? "Müştəri: " : "Nigar: "}{s.lastMessage}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ — söhbət */}
      {!selected ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#94a3b8" }}>
          <MessageSquare size={40} strokeWidth={1} />
          <p style={{ fontSize: 14 }}>Sol tərəfdən bir sessiya seçin</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ padding: "12px 20px", background: "white", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                Sessiya #{selected.slice(0, 8)}
              </span>
              {activeSession?.adminActive && (
                <span style={{ marginLeft: 8, fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                  AI dayandırılıb
                </span>
              )}
            </div>
            {activeSession?.adminActive && (
              <button onClick={resumeAI}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", color: "#0284c7", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Bot size={14} /> AI-ı yenidən aktiv et
              </button>
            )}
          </div>

          {/* Mesajlar */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {loading && history.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Yüklənir...</div>
            ) : history.map((m, i) => {
              const isAdmin = m.content.startsWith("[Admin]");
              const isUser  = m.role === "user";
              const text    = isAdmin ? m.content.replace("[Admin] ", "") : m.content;
              return (
                <div key={i} style={{ display: "flex", flexDirection: isUser ? "row" : "row-reverse", gap: 8, alignItems: "flex-end" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: isUser ? "#e0f2fe" : isAdmin ? "#fef3c7" : "linear-gradient(135deg,#1e40af,#0284c7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isUser ? <User size={14} color="#0284c7" /> : isAdmin ? <Shield size={14} color="#92400e" /> : <Bot size={14} color="white" />}
                  </div>
                  <div style={{
                    maxWidth: "70%", padding: "9px 13px", borderRadius: 12, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
                    background: isUser ? "#f1f5f9" : isAdmin ? "#fef9c3" : "#eff6ff",
                    color: "#0f172a",
                    border: isAdmin ? "1px solid #fde68a" : "none",
                  }}>
                    {isAdmin && <span style={{ fontSize: 11, color: "#92400e", fontWeight: 700, display: "block", marginBottom: 4 }}>Admin</span>}
                    {text}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", background: "white", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                <input type="checkbox" checked={pauseAI} onChange={e => setPauseAI(e.target.checked)}
                  style={{ accentColor: "#0284c7" }} />
                AI-ı dayandır (mənim cavabım göndərilsin)
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                placeholder="Müştəriyə cavab yazın..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", color: "#0f172a" }}
                onFocus={e => (e.currentTarget.style.borderColor = "#0284c7")}
                onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
              />
              <button onClick={sendReply} disabled={!reply.trim() || sending}
                style={{
                  padding: "10px 16px", borderRadius: 10, border: "none",
                  background: reply.trim() && !sending ? "linear-gradient(135deg,#1e40af,#0284c7)" : "#e2e8f0",
                  color: reply.trim() && !sending ? "white" : "#94a3b8",
                  cursor: reply.trim() && !sending ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13,
                }}>
                <Send size={15} /> Göndər
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
