"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { waLink } from "@/lib/whatsapp";
import WishlistButton from "@/components/WishlistButton";

const KEY = "natoure_wishlist";

interface Tour {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date: string | null;
  end_date: string | null;
  hotel: string | null;
}

export default function WishlistPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
      setIds(saved);
      if (saved.length === 0) { setLoading(false); return; }
      supabase.from("tours").select("*").in("id", saved).eq("is_active", true)
        .then(({ data }) => { setTours(data || []); setLoading(false); });
    } catch {
      setLoading(false);
    }
  }, []);

  function getDuration(start: string | null, end: string | null) {
    if (!start || !end) return "";
    const d = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
    return `${d} gün / ${d - 1} gecə`;
  }

  return (
    <div style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh" }}>
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }} className="px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Bəyənilənlərim</h1>
        <p className="text-sm" style={{ color: "#666" }}>Saxladığınız tur paketləri</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && <div className="text-center py-16" style={{ color: "#555" }}>Yüklənir...</div>}

        {!loading && ids.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🤍</div>
            <p style={{ color: "#555" }} className="mb-4">Hələ heç bir tur saxlamamısınız</p>
            <Link href="/turlar"
              className="text-sm font-bold px-6 py-3 rounded-xl inline-block hover:opacity-90 transition-opacity"
              style={{ background: "#D4AF37", color: "#000" }}>
              Turlara Bax
            </Link>
          </div>
        )}

        {!loading && ids.length > 0 && tours.length === 0 && (
          <div className="text-center py-16">
            <p style={{ color: "#555" }} className="mb-4">Saxladığınız turlar artıq aktiv deyil</p>
            <Link href="/turlar" className="text-sm underline" style={{ color: "#D4AF37" }}>Yeni turlara bax</Link>
          </div>
        )}

        {!loading && tours.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tours.map((tour) => (
              <div key={tour.id} className="rounded-xl flex flex-col overflow-hidden" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs" style={{ color: "#666" }}>{tour.destination}</p>
                    <WishlistButton tourId={tour.id} />
                  </div>
                  <Link href={`/turlar/${tour.id}`}>
                    <h3 className="font-bold text-white text-base mb-1 hover:text-yellow-400 transition-colors">{tour.name}</h3>
                  </Link>
                  {getDuration(tour.start_date, tour.end_date) && (
                    <p className="text-xs mb-2" style={{ color: "#555" }}>⏱ {getDuration(tour.start_date, tour.end_date)}</p>
                  )}
                  {tour.hotel && <p className="text-xs" style={{ color: "#666" }}>🏨 {tour.hotel}</p>}
                </div>
                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between mb-3 pt-3" style={{ borderTop: "1px solid #1a1a1a" }}>
                    <span className="text-lg font-bold" style={{ color: "#D4AF37" }}>{tour.price_azn} AZN</span>
                    <span className="text-xs" style={{ color: "#555" }}>/nəfər</span>
                  </div>
                  <a href={waLink(`Salam, "${tour.name}" turu haqqında məlumat almaq istəyirəm`)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                    style={{ background: "#25D366", color: "#fff" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp-da Sifariş Et
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
