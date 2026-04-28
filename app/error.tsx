"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("[GlobalError]", error.message);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#f8fafc", padding: "40px 20px", textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
        Xəta baş verdi
      </h1>
      <p style={{ color: "#64748b", fontSize: 15, marginBottom: 28, maxWidth: 360 }}>
        Texniki problem yarandı. Zəhmət olmasa yenidən cəhd edin.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#0284c7,#4f46e5)",
            color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          Yenidən cəhd et
        </button>
        <Link href="/" style={{
          padding: "10px 24px", borderRadius: 12,
          border: "1px solid #e2e8f0", background: "white",
          color: "#334155", fontWeight: 600, fontSize: 14, textDecoration: "none",
        }}>
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}
