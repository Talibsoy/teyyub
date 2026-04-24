"use client";

import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

interface Props {
  tourId: string;
  seatsLeft: number;
  tourName: string;
}

export default function BookingCTA({ tourId, seatsLeft, tourName }: Props) {
  const router = useRouter();

  async function handleBook() {
    const { data: { session } } = await getSupabase().auth.getSession();
    const dest = `/rezervasiya?tour=${tourId}`;
    if (session) {
      router.push(dest);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(dest)}`);
    }
  }

  if (seatsLeft <= 0) {
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Bu tur dolub</p>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Növbəti tur üçün bizimlə əlaqə saxlayın</p>
        <a
          href={`https://wa.me/994517769632?text=${encodeURIComponent(`Salam, "${tourName}" turu ilə maraqlanıram, növbəti tur nə vaxt?`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#25D366", color: "#fff", borderRadius: 12,
            padding: "13px 32px", fontWeight: 700, fontSize: 14,
            textDecoration: "none",
          }}
        >
          WhatsApp-da Əlaqə
        </a>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
        Bu tura qoşulmaq istəyirsiniz?
      </p>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
        Yalnız <span style={{ color: "#ef4444", fontWeight: 700 }}>{seatsLeft} yer</span> qalıb — indi rezervasiya edin
      </p>
      <button
        onClick={handleBook}
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #0284c7, #4f46e5)", color: "white", borderRadius: 12,
          padding: "13px 36px", fontWeight: 800, fontSize: 15,
          border: "none", cursor: "pointer",
        }}
      >
        Rezervasiya Et
      </button>
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 12 }}>
        Sualınız var?{" "}
        <a
          href={`https://wa.me/994517769632?text=${encodeURIComponent(`Salam, "${tourName}" turu haqqında məlumat almaq istəyirəm`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ color: "#25D366", textDecoration: "none", fontWeight: 600 }}
        >
          WhatsApp-da yazın
        </a>
      </p>
    </div>
  );
}
