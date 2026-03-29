"use client";

import { useState } from "react";

const DESTINATIONS = [
  "Türkiyə", "Dubai", "Misir", "Avropa", "Rusiya",
  "Gürcüstan", "Maldiv", "Tailand", "Digər",
];

export default function ReviewForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({ name: "", destination: "", rating: 0, message: "" });
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rating) { setErr("Zəhmət olmasa ulduz seçin"); return; }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Xəta baş verdi"); return; }
      setDone(true);
      onSuccess?.();
    } catch {
      setErr("Şəbəkə xətası, yenidən cəhd edin");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{
        background: "#0d1a0d", border: "1px solid #25D366",
        borderRadius: 16, padding: "40px 32px", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h3 style={{ color: "#25D366", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Rəyiniz qəbul edildi!
        </h3>
        <p style={{ color: "#aaa", fontSize: 14 }}>
          Moderasiyadan keçdikdən sonra saytda dərc olunacaq. Təşəkkür edirik!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{
      background: "#111", border: "1px solid #222",
      borderRadius: 16, padding: "32px", display: "flex", flexDirection: "column", gap: 20,
    }}>
      {/* Star rating */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 8, display: "block" }}>
          Reytinq *
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setForm(f => ({ ...f, rating: star }))}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 32, lineHeight: 1,
                color: star <= (hover || form.rating) ? "#D4AF37" : "#333",
                transition: "color 0.15s",
              }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 6, display: "block" }}>
          Adınız *
        </label>
        <input
          type="text"
          placeholder="Məs: Aytən X."
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: 8, padding: "10px 14px", color: "#fff",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Destination */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 6, display: "block" }}>
          Getdiyiniz ölkə (istəyə bağlı)
        </label>
        <select
          value={form.destination}
          onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: 8, padding: "10px 14px", color: form.destination ? "#fff" : "#666",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
        >
          <option value="">— Seçin —</option>
          {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Message */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 6, display: "block" }}>
          Rəyiniz *
        </label>
        <textarea
          placeholder="Səyahətiniz haqqında fikirlərinizi paylaşın..."
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          required
          rows={4}
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: 8, padding: "10px 14px", color: "#fff",
            fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box",
          }}
        />
        <div style={{ color: "#555", fontSize: 11, marginTop: 4, textAlign: "right" }}>
          {form.message.length}/1000
        </div>
      </div>

      {err && (
        <div style={{
          background: "#1a0a0a", border: "1px solid #c0392b",
          borderRadius: 8, padding: "10px 14px", color: "#e74c3c", fontSize: 13,
        }}>
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? "#555" : "#D4AF37",
          color: "#0b0b0b", border: "none", borderRadius: 10,
          padding: "13px 24px", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s",
        }}
      >
        {loading ? "Göndərilir..." : "Rəyi Göndər"}
      </button>
    </form>
  );
}
