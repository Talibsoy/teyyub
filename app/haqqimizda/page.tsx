import Link from "next/link";
import { waLink } from "@/lib/whatsapp";

const services = [
  { flag: "🇪🇺", title: "Avropa Turları",   items: ["İtaliya, Fransa, Almaniya", "Şəhər turları + mədəni təcrübələr", "Viza dəstəyi ilə paketlər"] },
  { flag: "🇹🇷", title: "Türkiyə Turları",  items: ["Antalya, Bodrum, İstanbul", "Ailəvi və premium resort paketləri", "Hər büdcəyə uyğun seçimlər"] },
  { flag: "🇪🇬", title: "Misir Turları",    items: ["Şarm El-Şeyx, Hurqada", "All-inclusive otellər", "Dəniz və istirahət paketləri"] },
  { flag: "🇦🇪", title: "Dubai Turları",    items: ["Lüks və premium paketlər", "Şəhər + əyləncə kombinasiyaları", "Shopping və experience turları"] },
  { flag: "🧳", title: "Fərdi Planlama",   items: ["Müştəriyə xüsusi itinerary", "Büdcəyə uyğun optimizasiya", "Full service (bilet+otel+transfer)"] },
];

const usps = [
  { icon: "⚡", title: "AI əsaslı satış sistemi",     desc: "Müştəri ilə chatbot danışır, tələbatı analiz edir, avtomatik uyğun paket təklif edir." },
  { icon: "🔄", title: "Avtomatlaşdırılmış sistem",   desc: "Lead-lər avtomatik toplanır, CRM inteqrasiyası, satış prosesi optimallaşdırılır." },
  { icon: "🎯", title: "Fərdi yanaşma",               desc: "Hər müştəri üçün xüsusi plan. Büdcəyə uyğun maksimum dəyər." },
  { icon: "📈", title: "Satış yönümlü yanaşma",       desc: "Sadəcə məlumat verilmir — müştəri qərar mərhələsinə gətirilir." },
];

const whyItems = [
  "Araşdırma etməyə vaxt itirmirsən",
  "Sənə uyğun ən optimal variant təqdim olunur",
  "Sürətli və rahat qərar prosesi",
  "Minimum risk, maksimum rahatlıq",
];

export default function HaqqimızdaPage() {
  return (
    <div style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 py-12 md:py-16 text-center" style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Haqqımızda</h1>
        <p className="text-sm" style={{ color: "#666" }}>AI + avtomatlaşdırma + satış psixologiyası üzərində qurulmuş müasir turizm platforması</p>
      </div>

      {/* What is Natoure */}
      <section className="px-4 py-12 md:py-16 md:px-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Natoure Nədir?</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#aaa" }}>
              Natoure — müasir yanaşma ilə fəaliyyət göstərən, fərdi və korporativ müştərilər üçün optimallaşdırılmış turizm platformasıdır.
            </p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#aaa" }}>
              Bizim əsas məqsədimiz standart tur paketləri satmaq yox — müştəriyə uyğun <strong style={{ color: "#fff" }}>fərdi təcrübə</strong> yaratmaqdır.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#aaa" }}>
              Natoure, klassik turizm agentliyi deyil — <strong style={{ color: "#D4AF37" }}>AI + avtomatlaşdırma + satış psixologiyası</strong> üzərində qurulmuş sistemdir.
            </p>
          </div>
          <div className="rounded-2xl p-6 md:p-8" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
            <div className="grid grid-cols-2 gap-6">
              {[{ num: "5", label: "İstiqamət" }, { num: "100%", label: "Fərdi yanaşma" }, { num: "AI", label: "Dəstəkli sistem" }, { num: "24/7", label: "WA Dəstəyi" }].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold" style={{ color: "#D4AF37" }}>{s.num}</div>
                  <div className="text-xs mt-1" style={{ color: "#666" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-4 py-12 md:py-16 md:px-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Xidmətlərimiz</h2>
          <p className="text-sm mb-8" style={{ color: "#666" }}>5 əsas istiqamətdə tam xidmət</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.title} className="rounded-xl p-5" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-3xl mb-3">{s.flag}</div>
                <h3 className="font-bold text-white text-base mb-3">{s.title}</h3>
                <ul className="space-y-1.5">
                  {s.items.map((item) => (
                    <li key={item} className="text-xs flex items-start gap-1.5" style={{ color: "#aaa" }}>
                      <span style={{ color: "#D4AF37", flexShrink: 0 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="px-4 py-12 md:py-16 md:px-12" style={{ background: "#0b0b0b" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Digər Şirkətlərdən Fərqimiz</h2>
          <p className="text-sm mb-8" style={{ color: "#666" }}>Niyə Natoure?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usps.map((u) => (
              <div key={u.title} className="flex gap-4 rounded-xl p-5" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-2xl flex-shrink-0">{u.icon}</div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#D4AF37" }}>{u.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#666" }}>{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="px-4 py-12 md:py-16 md:px-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Niyə Natoure?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10">
            {whyItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl p-4" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <span style={{ color: "#D4AF37" }}>✓</span>
                <span className="text-sm" style={{ color: "#aaa" }}>{item}</span>
              </div>
            ))}
          </div>
          <a href={waLink("Salam, pulsuz məsləhət almaq istəyirəm")} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold py-3.5 px-8 rounded-xl"
            style={{ background: "#25D366", color: "#fff" }}>
            Pulsuz Məsləhət Al
          </a>
        </div>
      </section>
    </div>
  );
}
