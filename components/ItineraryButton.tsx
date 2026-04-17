"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  destination: string;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
}

export default function ItineraryButton({ destination, start_date, end_date, duration_days }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      // Calculate duration from tour dates if not provided
      let days = duration_days;
      if (!days && start_date && end_date) {
        days = Math.max(1, Math.round(
          (new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000
        ));
      }
      days = days || 5;

      // Use tour start_date or default to 30 days from now
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
        }),
      });

      if (!res.ok) throw new Error("Server xətası");
      const data = await res.json();
      router.push(`/itinerary/${data.id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: loading ? "#1a1a1a" : "transparent",
        color: loading ? "#555" : "#0ea5e9",
        border: `1px solid ${loading ? "#222" : "#0ea5e9"}`,
        borderRadius: 10,
        padding: "11px 24px",
        fontWeight: 600,
        fontSize: 14,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        width: "100%",
        justifyContent: "center",
        marginTop: 10,
      }}
    >
      {loading ? (
        <>
          <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
          Proqram hazırlanır...
        </>
      ) : (
        <>
          <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
          AI Günlük Proqram Yarat
        </>
      )}
    </button>
  );
}
