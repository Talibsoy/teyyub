"use client";
import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setEmail("");
    } else {
      setStatus("error");
      setMsg(data.error || "Xəta baş verdi");
    }
  }

  return (
    <section className="px-4 py-12 md:py-16 md:px-12" style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
      <div className="max-w-xl mx-auto text-center">
        <div className="text-3xl mb-3">📬</div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Ən Yaxşı Təklifləri Kaçırmayın</h2>
        <p className="text-sm mb-6" style={{ color: "#666" }}>
          Həftəlik tur endirimleri və səyahət məsləhətlərini emailinizə alın
        </p>

        {status === "ok" ? (
          <div className="py-4 px-6 rounded-xl inline-block" style={{ background: "#1a2e1a", border: "1px solid #2a4a2a" }}>
            <p style={{ color: "#4ade80", fontSize: 14, fontWeight: 600 }}>✓ Abunəliyiniz təsdiqləndi! Email yoxlayın.</p>
          </div>
        ) : (
          <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="email@example.com"
              required
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "#111", border: "1px solid #1a1a1a", color: "#fff" }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#D4AF37", color: "#000", whiteSpace: "nowrap" }}
            >
              {status === "loading" ? "..." : "Abunə Ol"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-2 text-xs" style={{ color: "#f87171" }}>{msg}</p>
        )}
      </div>
    </section>
  );
}
