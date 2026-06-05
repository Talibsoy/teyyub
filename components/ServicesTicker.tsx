"use client";

import { useLanguage } from "./LanguageContext";

const SERVICES = [
  { icon: "✈️", az: "Aviabilet",           en: "Flights",             tr: "Uçuş Bileti" },
  { icon: "🏨", az: "Otellər",             en: "Hotels",              tr: "Oteller" },
  { icon: "🚗", az: "Rent a Car",           en: "Car Rental",          tr: "Araç Kiralama" },
  { icon: "🛳️", az: "Kruiz Turları",        en: "Cruise Tours",        tr: "Kruvaziyer Turları" },
  { icon: "🚂", az: "Qatar Biletləri",      en: "Train Tickets",       tr: "Tren Biletleri" },
  { icon: "🏝️", az: "Paket Turlar",         en: "Package Tours",       tr: "Paket Turlar" },
  { icon: "🗺️", az: "Xüsusi Planlaşdırma", en: "Custom Planning",     tr: "Özel Planlama" },
  { icon: "💼", az: "Biznes Səyahəti",      en: "Business Travel",     tr: "İş Seyahati" },
  { icon: "🎯", az: "Fərdi Turlar",         en: "Private Tours",       tr: "Özel Turlar" },
  { icon: "🌍", az: "Dünya Üzrə",           en: "Worldwide",           tr: "Dünya Geneli" },
  { icon: "💳", az: "Epoint ödəniş",        en: "Epoint Payment",      tr: "Epoint Ödeme" },
  { icon: "📞", az: "24/7 Dəstək",          en: "24/7 Support",        tr: "7/24 Destek" },
];

export default function ServicesTicker() {
  const { language } = useLanguage();

  const items = [...SERVICES, ...SERVICES]; // Sonsuz dövr üçün dublikat

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
        height: 40,
      }}
    >
      {/* Sol kənar solğunlaşma */}
      <div
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 60,
          background: "linear-gradient(90deg, #0f172a, transparent)",
          zIndex: 2, pointerEvents: "none",
        }}
      />
      {/* Sağ kənar solğunlaşma */}
      <div
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 60,
          background: "linear-gradient(270deg, #0f172a, transparent)",
          zIndex: 2, pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: ticker 30s linear infinite;
          height: 100%;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-track">
        {items.map((s, i) => (
          <div
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 28px",
              height: "100%",
              whiteSpace: "nowrap",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.02em",
            }}
          >
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span translate="no">
              {language === "en" ? s.en : language === "tr" ? s.tr : s.az}
            </span>
            {/* Ayırıcı nöqtə */}
            <span style={{ color: "rgba(14,165,233,0.5)", marginLeft: 8 }}>•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
