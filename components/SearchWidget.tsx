"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
      style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(2,132,199,0.15)", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
      <select
        value={dest}
        onChange={(e) => setDest(e.target.value)}
        className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: dest ? "#0f172a" : "#94a3b8" }}
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
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }}
      >
        {[1,2,3,4,5,6].map((n) => (
          <option key={n} value={n}>👤 {n} nəfər</option>
        ))}
      </select>

      <button type="submit"
        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center gap-2 justify-center"
        style={{ background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", whiteSpace: "nowrap", boxShadow: "0 4px 15px rgba(2,132,199,0.3)" }}>
        <Search size={15} /> Axtar
      </button>
    </form>
  );
}
