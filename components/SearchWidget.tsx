"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const destinations = [
  { value: "turkiye", label: "🇹🇷 Türkiyə" },
  { value: "ereb",    label: "🇦🇪 Dubai / BƏƏ" },
  { value: "misir",   label: "🇪🇬 Misir" },
  { value: "avropa",  label: "🇪🇺 Avropa" },
];

export default function SearchWidget() {
  const router = useRouter();
  const [dest, setDest] = useState("");
  const [persons, setPersons] = useState("2");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (dest) params.set("dest", dest);
    if (persons) params.set("persons", persons);
    router.push(`/turlar${params.toString() ? "?" + params.toString() : ""}`);
  }

  return (
    <form onSubmit={handleSearch}
      className="flex flex-col sm:flex-row gap-2 mt-8 p-3 rounded-2xl max-w-xl"
      style={{ background: "#111", border: "1px solid #1a1a1a" }}>
      <select
        value={dest}
        onChange={(e) => setDest(e.target.value)}
        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "#1a1a1a", border: "1px solid #222", color: dest ? "#fff" : "#666" }}
      >
        <option value="">📍 İstiqamət seçin</option>
        {destinations.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      <select
        value={persons}
        onChange={(e) => setPersons(e.target.value)}
        className="px-3 py-2.5 rounded-xl text-sm outline-none w-full sm:w-36"
        style={{ background: "#1a1a1a", border: "1px solid #222", color: "#fff" }}
      >
        {[1,2,3,4,5,6].map((n) => (
          <option key={n} value={n}>👤 {n} nəfər</option>
        ))}
      </select>

      <button type="submit"
        className="px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        style={{ background: "#D4AF37", color: "#000", whiteSpace: "nowrap" }}>
        Axtar →
      </button>
    </form>
  );
}
