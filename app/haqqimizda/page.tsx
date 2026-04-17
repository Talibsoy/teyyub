import Link from "next/link";

const services = [
  { flag: "🇪🇺", title: "Avropa Turları",  items: ["İtaliya, Fransa, Almaniya", "Şəhər turları + mədəni təcrübələr", "Viza dəstəyi ilə paketlər"] },
  { flag: "🇹🇷", title: "Türkiyə Turları", items: ["Antalya, Bodrum, İstanbul", "Ailəvi və premium resort paketləri", "Hər büdcəyə uyğun seçimlər"] },
  { flag: "🇪🇬", title: "Misir Turları",   items: ["Şarm El-Şeyx, Hurqada", "All-inclusive otellər", "Dəniz və istirahət paketləri"] },
  { flag: "🇦🇪", title: "Dubai Turları",   items: ["Lüks və premium paketlər", "Şəhər + əyləncə kombinasiyaları", "Shopping və experience turları"] },
  { flag: "🧳",  title: "Fərdi Planlama", items: ["Müştəriyə xüsusi itinerary", "Büdcəyə uyğun optimizasiya", "Full service (bilet+otel+transfer)"] },
];

const usps = [
  { icon: "⚡", title: "AI əsaslı sistem",           desc: "Müştəri ilə chatbot danışır, tələbatı analiz edir, avtomatik uyğun paket təklif edir." },
  { icon: "🔄", title: "Avtomatlaşdırılmış prosess", desc: "Lead-lər avtomatik toplanır, CRM inteqrasiyası, satış prosesi optimallaşdırılır." },
  { icon: "🎯", title: "Fərdi yanaşma",              desc: "Hər müştəri üçün xüsusi plan. Büdcəyə uyğun maksimum dəyər." },
  { icon: "📈", title: "Satış yönümlü",              desc: "Sadəcə məlumat verilmir — müştəri qərar mərhələsinə gətirilir." },
];

const stats = [
  { num: "5+",   label: "İstiqamət" },
  { num: "100%", label: "Fərdi yanaşma" },
  { num: "AI",   label: "Dəstəkli sistem" },
  { num: "24/7", label: "WhatsApp dəstəyi" },
];

const whyItems = [
  "Araşdırma etməyə vaxt itirmirsən",
  "Sənə uyğun ən optimal variant təqdim olunur",
  "Sürətli və rahat qərar prosesi",
  "Minimum risk, maksimum rahatlıq",
];

export default function HaqqimızdaPage() {
  return (
    <div className="ns-page">

      {/* Page Header */}
      <div className="ns-page-header">
        <span className="ns-label">Biz Kimik?</span>
        <h1>Haqqımızda</h1>
        <p>AI + avtomatlaşdırma + satış psixologiyası üzərində qurulmuş müasir turizm platforması</p>
      </div>

      {/* What is Natoure */}
      <section className="ns-section-w">
        <div className="ns-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="ns-label">Platformamız</span>
              <h2 className="ns-title mb-5">Natoure Nədir?</h2>
              <p className="ns-subtitle mb-4">
                Natoure — müasir yanaşma ilə fəaliyyət göstərən, fərdi və korporativ
                müştərilər üçün optimallaşdırılmış turizm platformasıdır.
              </p>
              <p className="ns-subtitle mb-4">
                Bizim əsas məqsədimiz standart tur paketləri satmaq yox —
                müştəriyə uyğun <strong className="text-slate-700">fərdi təcrübə</strong> yaratmaqdır.
              </p>
              <p className="ns-subtitle">
                Natoure, klassik turizm agentliyi deyil —{" "}
                <strong className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  AI + avtomatlaşdırma + satış psixologiyası
                </strong>{" "}
                üzərində qurulmuş sistemdir.
              </p>
            </div>

            {/* Stats card */}
            <div className="ns-card p-8">
              <div className="grid grid-cols-2 gap-8">
                {stats.map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                      {s.num}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="ns-section">
        <div className="ns-container-lg">
          <div className="text-center mb-10">
            <span className="ns-label">Nə Təklif Edirik?</span>
            <h2 className="ns-title">Xidmətlərimiz</h2>
            <p className="ns-subtitle">5 əsas istiqamətdə tam xidmət</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.title} className="ns-card-hover p-6">
                <div className="text-4xl mb-3">{s.flag}</div>
                <h3 className="font-bold text-slate-800 text-base mb-3">{s.title}</h3>
                <ul className="space-y-2">
                  {s.items.map(item => (
                    <li key={item} className="text-sm text-slate-500 flex items-start gap-2">
                      <span className="text-sky-500 flex-shrink-0 mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="ns-section-w">
        <div className="ns-container">
          <div className="text-center mb-10">
            <span className="ns-label">Üstünlüklərimiz</span>
            <h2 className="ns-title">Digər Şirkətlərdən Fərqimiz</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usps.map(u => (
              <div key={u.title} className="ns-card-hover flex gap-4 p-6">
                <div className="text-3xl flex-shrink-0">{u.icon}</div>
                <div>
                  <h3 className="font-bold text-sky-700 text-sm mb-1">{u.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="ns-section">
        <div className="ns-container-sm text-center">
          <span className="ns-label">Seçim Etmək Asan</span>
          <h2 className="ns-title mb-10">Niyə Natoure?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10">
            {whyItems.map(item => (
              <div key={item} className="ns-check-item text-sm text-slate-600">{item}</div>
            ))}
          </div>
          <a href="/elaqe" className="ns-btn ns-btn-primary">
            Bizimlə Əlaqə
          </a>
        </div>
      </section>

    </div>
  );
}
