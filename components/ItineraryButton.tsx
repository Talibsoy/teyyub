"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  destination: string;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  language?: string;
}

export default function ItineraryButton({ destination, start_date, end_date, duration_days, language = "az" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      let days = duration_days;
      if (!days && start_date && end_date) {
        days = Math.max(1, Math.round(
          (new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000
        ));
      }
      days = days || 5;

      let startDate = start_date;
      if (!startDate) {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        startDate = d.toISOString().split("T")[0];
      }

      const res = await fetch("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          start_date: startDate,
          duration_days: days,
          guests: 2,
          language, // pass language down to the API if needed
        }),
      });

      if (!res.ok) {
        throw new Error(
          language === "az"
            ? "Proqram yaradıla bilmədi. Yenidən cəhd edin."
            : language === "tr"
            ? "Program oluşturulamadı. Lütfen tekrar deneyin."
            : "Could not create the itinerary. Please try again."
        );
      }
      const data = await res.json();
      router.push(`/itinerary/${data.id}`);
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : language === "az"
          ? "Xəta baş verdi"
          : language === "tr"
          ? "Bir hata oluştu"
          : "An error occurred"
      );
    }
  }

  return (
    <div style={{ width: "100%", marginTop: 10 }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: loading ? "#1a1a1a" : "transparent",
          color: loading ? "#555" : "#0ea5e9",
          border: `1px solid ${loading ? "#222" : error ? "#ef4444" : "#0ea5e9"}`,
          borderRadius: 10,
          padding: "11px 24px",
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          width: "100%",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <>
            <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            {language === "az" ? "Proqram hazırlanır..." : language === "tr" ? "Program hazırlanıyor..." : "Preparing itinerary..."}
          </>
        ) : (
          <>
            <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            {language === "az" ? "AI Günlük Proqram Yarat" : language === "tr" ? "AI Günlük Program Oluştur" : "Create Daily Itinerary with AI"}
          </>
        )}
      </button>
      {error && (
        <p style={{ marginTop: 6, fontSize: 12, color: "#ef4444", textAlign: "center" }}>{error}</p>
      )}
    </div>
  );
}
