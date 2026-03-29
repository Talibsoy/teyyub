"use client";

import { useState, useRef } from "react";
import { getSupabase } from "@/lib/supabase";

const DESTINATIONS = [
  "Türkiyə", "Dubai", "Misir", "Avropa", "Rusiya",
  "Gürcüstan", "Maldiv", "Tailand", "Digər",
];

const MAX_FILES = 4;
const MAX_MB = 5;

export default function ReviewForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState({ name: "", destination: "", rating: 0, message: "" });
  const [hover, setHover] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > MAX_MB * 1024 * 1024) { setErr(`${f.name} ${MAX_MB}MB-dan böyükdür`); return false; }
      return true;
    });
    const combined = [...images, ...valid].slice(0, MAX_FILES);
    setImages(combined);
    setPreviews(combined.map(f => URL.createObjectURL(f)));
    setErr("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(i: number) {
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  }

  async function uploadImages(): Promise<string[]> {
    if (!images.length) return [];
    const sb = getSupabase();
    const urls: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await sb.storage.from("review-images").upload(path, file, { cacheControl: "3600" });
      if (error) throw new Error("Şəkil yüklənmədi: " + error.message);
      const { data } = sb.storage.from("review-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rating) { setErr("Zəhmət olmasa ulduz seçin"); return; }
    setLoading(true);
    setErr("");
    try {
      const imageUrls = await uploadImages();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_urls: imageUrls }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Xəta baş verdi"); return; }
      setDone(true);
      onSuccess?.();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Xəta baş verdi");
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
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 8, display: "block" }}>Reytinq *</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button"
              onClick={() => setForm(f => ({ ...f, rating: star }))}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 32, lineHeight: 1,
                color: star <= (hover || form.rating) ? "#D4AF37" : "#333",
                transition: "color 0.15s",
              }}>★</button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 6, display: "block" }}>Adınız *</label>
        <input type="text" placeholder="Məs: Aytən X." value={form.name} required
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: 8, padding: "10px 14px", color: "#fff",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }} />
      </div>

      {/* Destination */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 6, display: "block" }}>Getdiyiniz ölkə (istəyə bağlı)</label>
        <select value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: 8, padding: "10px 14px", color: form.destination ? "#fff" : "#666",
            fontSize: 14, outline: "none", boxSizing: "border-box",
          }}>
          <option value="">— Seçin —</option>
          {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Message */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 6, display: "block" }}>Rəyiniz *</label>
        <textarea placeholder="Səyahətiniz haqqında fikirlərinizi paylaşın..."
          value={form.message} required rows={4}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          style={{
            width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: 8, padding: "10px 14px", color: "#fff",
            fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box",
          }} />
        <div style={{ color: "#555", fontSize: 11, marginTop: 4, textAlign: "right" }}>
          {form.message.length}/1000
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label style={{ color: "#aaa", fontSize: 13, marginBottom: 8, display: "block" }}>
          Şəkillər (istəyə bağlı, max {MAX_FILES} ədəd, {MAX_MB}MB)
        </label>

        {/* Previews */}
        {previews.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                <img src={src} alt="" style={{
                  width: 80, height: 80, objectFit: "cover",
                  borderRadius: 8, border: "1px solid #2a2a2a",
                }} />
                <button type="button" onClick={() => removeImage(i)} style={{
                  position: "absolute", top: -6, right: -6,
                  background: "#c0392b", color: "#fff", border: "none",
                  borderRadius: "50%", width: 20, height: 20,
                  fontSize: 11, cursor: "pointer", lineHeight: "20px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {images.length < MAX_FILES && (
          <>
            <input ref={fileRef} type="file" accept="image/*" multiple
              onChange={onFileChange} style={{ display: "none" }} />
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{
                background: "#1a1a1a", border: "1px dashed #3a3a3a",
                borderRadius: 8, padding: "10px 18px", color: "#888",
                fontSize: 13, cursor: "pointer", display: "flex",
                alignItems: "center", gap: 8,
              }}>
              <span style={{ fontSize: 18 }}>📷</span>
              Şəkil əlavə et ({images.length}/{MAX_FILES})
            </button>
          </>
        )}
      </div>

      {err && (
        <div style={{
          background: "#1a0a0a", border: "1px solid #c0392b",
          borderRadius: 8, padding: "10px 14px", color: "#e74c3c", fontSize: 13,
        }}>{err}</div>
      )}

      <button type="submit" disabled={loading} style={{
        background: loading ? "#555" : "#D4AF37",
        color: "#0b0b0b", border: "none", borderRadius: 10,
        padding: "13px 24px", fontSize: 15, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s",
      }}>
        {loading ? (images.length ? "Şəkillər yüklənir..." : "Göndərilir...") : "Rəyi Göndər"}
      </button>
    </form>
  );
}
