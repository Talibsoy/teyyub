"use client";

import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

interface Props {
  tourId: string;
  seatsLeft: number;
  tourName: string;
  language?: string;
}

export default function BookingCTA({ tourId, seatsLeft, tourName, language = "az" }: Props) {
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
    const waText = language === "az"
      ? `Salam, "${tourName}" turu ilə maraqlanıram, növbəti tur nə vaxt?`
      : language === "tr"
      ? `Merhaba, "${tourName}" turu ile ilgileniyorum, bir sonraki tur ne zaman?`
      : `Hello, I am interested in the "${tourName}" tour, when is the next one?`;
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
          {language === "az" ? "Bu tur dolub" : language === "tr" ? "Bu tur doldu" : "This tour is full"}
        </p>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
          {language === "az" ? "Növbəti tur üçün bizimlə əlaqə saxlayın" : language === "tr" ? "Bir sonraki tur için bizimle iletişime geçin" : "Contact us for the next tour"}
        </p>
        <a
          href={`https://wa.me/994517769632?text=${encodeURIComponent(waText)}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#25D366", color: "#fff", borderRadius: 12,
            padding: "13px 32px", fontWeight: 700, fontSize: 14,
            textDecoration: "none",
          }}
        >
          {language === "az" ? "WhatsApp-da Əlaqə" : language === "tr" ? "WhatsApp ile İletişim" : "Contact on WhatsApp"}
        </a>
      </div>
    );
  }

  const waAskText = language === "az"
    ? `Salam, "${tourName}" turu haqqında məlumat almaq istəyirəm`
    : language === "tr"
    ? `Merhaba, "${tourName}" turu hakkında bilgi almak istiyorum`
    : `Hello, I would like to get information about the "${tourName}" tour`;

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
        {language === "az" ? "Bu tura qoşulmaq istəyirsiniz?" : language === "tr" ? "Bu tura katılmak ister misiniz?" : "Want to join this tour?"}
      </p>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
        {language === "az" ? (
          <>Yalnız <span style={{ color: "#ef4444", fontWeight: 700 }}>{seatsLeft} yer</span> qalıb — indi rezervasiya edin</>
        ) : language === "tr" ? (
          <>Sadece <span style={{ color: "#ef4444", fontWeight: 700 }}>{seatsLeft} koltuk</span> kaldı — şimdi rezervasyon yapın</>
        ) : (
          <>Only <span style={{ color: "#ef4444", fontWeight: 700 }}>{seatsLeft} seats</span> left — book now</>
        )}
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
        {language === "az" ? "Rezervasiya Et" : language === "tr" ? "Rezervasyon Yap" : "Book Now"}
      </button>
      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 12 }}>
        {language === "az" ? "Sualınız var? " : language === "tr" ? "Sorunuz mu var? " : "Have questions? "}
        <a
          href={`https://wa.me/994517769632?text=${encodeURIComponent(waAskText)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ color: "#25D366", textDecoration: "none", fontWeight: 600 }}
        >
          {language === "az" ? "WhatsApp-da yazın" : language === "tr" ? "WhatsApp'tan yazın" : "Write on WhatsApp"}
        </a>
      </p>
    </div>
  );
}
