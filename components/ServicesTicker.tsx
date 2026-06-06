"use client";

import { useLanguage } from "./LanguageContext";
import { SERVICES, serviceHref, serviceIsExternal } from "@/lib/services";

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
        {items.map((s, i) => {
          const external = serviceIsExternal(s);
          const Icon = s.icon;
          return (
            <a
              key={i}
              href={serviceHref(s, language)}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={s.label[language]}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "0 26px",
                height: "100%",
                whiteSpace: "nowrap",
                fontSize: 12.5,
                fontWeight: 600,
                color: "rgba(255,255,255,0.78)",
                letterSpacing: "0.02em",
                textDecoration: "none",
                transition: "color .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.78)")}
            >
              <Icon size={15} strokeWidth={2.25} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span translate="no">{s.label[language]}</span>
              {/* Ayırıcı nöqtə */}
              <span style={{ color: "rgba(14,165,233,0.5)", marginLeft: 6 }}>•</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
