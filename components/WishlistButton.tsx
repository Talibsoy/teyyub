"use client";
import { useState, useEffect } from "react";

const KEY = "natoure_wishlist";

function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function useWishlist(tourId: string) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getWishlist().includes(tourId));
  }, [tourId]);

  function toggle() {
    const list = getWishlist();
    const next = list.includes(tourId)
      ? list.filter((id) => id !== tourId)
      : [...list, tourId];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next.includes(tourId));
  }

  return { saved, toggle };
}

export default function WishlistButton({ tourId }: { tourId: string }) {
  const { saved, toggle } = useWishlist(tourId);

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      title={saved ? "Bəyənilənlərdən çıxar" : "Bəyənilənlərə əlavə et"}
      style={{
        width: 32, height: 32, borderRadius: "50%",
        background: saved ? "#D4AF37" : "#1a1a1a",
        border: `1px solid ${saved ? "#D4AF37" : "#333"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24"
        fill={saved ? "#000" : "none"}
        stroke={saved ? "#000" : "#888"}
        strokeWidth={2}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
