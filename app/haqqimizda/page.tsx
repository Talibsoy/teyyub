import Link from "next/link";

const services = [
  {
    flag: "🇪🇺", title: "Avropa Turları",
    items: ["İtaliya, Fransa, Almaniya və digər Şengen ölkələri", "Şəhər turları + mədəni təcrübələr", "Viza dəstəyi ilə paketlər"],
  },
  {
    flag: "🇹🇷", title: "Türkiyə Turları",
    items: ["Antalya, Bodrum, İstanbul", "Ailəvi və premium resort paketləri", "Hər büdcəyə uyğun seçimlər"],
  },
  {
    flag: "🇪🇬", title: "Misir Turları",
    items: ["Şarm El-Şeyx, Hurqada", "All-inclusive otellər", "Dəniz və istirahət fokuslu paketlər"],
  },
  {
    flag: "🇦🇪", title: "Dubay Turları",
    items: ["Lüks və premium tətil paketləri", "Şəhər + əyləncə kombinasiyaları", "Shopping və experience turları"],
  },
  {
    flag: "🧳", title: "Fərdi Planlama",
    items: ["Müştəriyə xüsusi itinerary hazırlanması", "Büdcəyə uyğun optimizasiya", "Full service (bilet + hotel + transfer + plan)"],
  },
];

const portfolio = [
  { flag: "🇦🇪", dest: "Dubay", desc: "Lüks və şəhər təcrübəsi paketləri" },
  { flag: "🇹🇷", dest: "Türkiyə", desc: "Ailəvi və resort turları" },
  { flag: "🇪🇬", dest: "Misir", desc: "Dəniz və istirahət paketləri" },
  { flag: "🇪🇺", dest: "Avropa", desc: "Fərdi və Şengen əsaslı səyahətlər" },
];

const usps = [
  { icon: "⚡", title: "AI əsaslı satış sistemi", desc: "Müştəri ilə chatbot danışır, tələbatı analiz edir, avtomatik uyğun paket təklif edir." },
  { icon: "🔄", title: "Avtomatlaşdırılmış sistem", desc: "Lead-lər avtomatik toplanır, CRM inteqrasiyası, satış prosesi optimallaşdırılır." },
  { icon: "🎯", title: "Fərdi yanaşma", desc: "Hər müştəri üçün xüsusi plan. Büdcəyə uyğun maksimum dəyər." },
  { icon: "📈", title: "Satış yönümlü yanaşma", desc: "Sadəcə məlumat verilmir — müştəri qərar mərhələsinə gətirilir." },
];

const partners = [
  { icon: "✈️", label: "Aviaşirkətlər" },
  { icon: "🏨", label: "Otellər və resortlar" },
  { icon: "🌍", label: "Beynəlxalq tur operatorları" },
  { icon: "🚐", label: "Transfer və lokal xidmət təminatçıları" },
];

export default function HaqqimızdaPage() {
  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0057A8] to-[#004a90] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Haqqımızda</h1>
        <p className="text-blue-200 max-w-xl mx-auto">AI + avtomatlaşdırma + satış psixologiyası üzərində qurulmuş müasir turizm platforması</p>
      </div>

      {/* What is Natoure */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-6">Natoure Nədir?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Natoure — müasir yanaşma ilə fəaliyyət göstərən, fərdi və korporativ müştərilər üçün optimallaşdırılmış turizm və travel xidmətləri təqdim edən platformadır.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bizim əsas məqsədimiz standart tur paketləri satmaq yox — müştəriyə uyğun <strong>fərdi təcrübə</strong> yaratmaqdır.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Natoure, klassik turizm agentliyi deyil — <strong>AI + avtomatlaşdırma + satış psixologiyası</strong> üzərində qurulmuş sistemdir.
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#0057A8] to-[#009B77] rounded-2xl p-8 text-white">
            <div className="grid grid-cols-2 gap-6">
              {[
                { num: "5", label: "İstiqamət" },
                { num: "100%", label: "Fərdi yanaşma" },
                { num: "AI", label: "Dəstəkli sistem" },
                { num: "24/7", label: "Chatbot dəstəyi" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold text-[#D4AF37]">{s.num}</div>
                  <div className="text-sm text-blue-200 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1a1a2e] text-center mb-12">Xidmətlərimiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{s.flag}</div>
                <h3 className="font-bold text-[#1a1a2e] text-lg mb-3">{s.title}</h3>
                <ul className="space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className="text-sm text-gray-500 flex items-start gap-2">
                      <span className="text-[#009B77] mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-[#1a1a2e] text-center mb-4">Keçirilmiş Turlar</h2>
        <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Aşağıdakı istiqamətlər üzrə uğurlu turlar təşkil etmişik</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {portfolio.map((p) => (
            <div key={p.dest} className="text-center p-6 rounded-2xl border border-gray-100 hover:border-[#0057A8]/30 hover:shadow-md transition-all">
              <div className="text-4xl mb-3">{p.flag}</div>
              <h3 className="font-bold text-[#1a1a2e] mb-1">{p.dest}</h3>
              <p className="text-xs text-gray-400">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 bg-gradient-to-r from-[#0057A8]/10 to-[#009B77]/10 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { icon: "⭐", text: "Yüksək müştəri məmnuniyyəti" },
            { icon: "🔄", text: "Təkrar alış edən müştərilər" },
            { icon: "👥", text: "Referal üzərindən gələn satışlar" },
          ].map((r) => (
            <div key={r.text} className="flex items-center justify-center gap-3">
              <span className="text-2xl">{r.icon}</span>
              <span className="text-sm font-medium text-[#1a1a2e]">{r.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* USP */}
      <section className="bg-[#1a1a2e] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Digər Şirkətlərdən Fərqimiz</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">Niyə Natoure? Çünki biz sadəcə tur satmırıq — müştəriyə ən uyğun həll yaradırıq.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {usps.map((u) => (
              <div key={u.title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center text-2xl">
                  {u.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#D4AF37] mb-2">{u.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{u.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1a1a2e] text-center mb-4">Tərəfdaşlarımız</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Xarici turizm agentlikləri ilə B2B əməkdaşlıq, incoming tərəfdaşlıqlar, korporativ travel xidmətləri</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {partners.map((p) => (
              <div key={p.label} className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{p.icon}</div>
                <p className="text-sm font-medium text-[#1a1a2e]">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Natoure */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-[#1a1a2e] mb-8">Niyə Natoure?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-12">
          {[
            "Araşdırma etməyə vaxt itirmirsən",
            "Sənə uyğun ən optimal variant təqdim olunur",
            "Sürətli və rahat qərar prosesi",
            "Minimum risk, maksimum rahatlıq",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 bg-[#0057A8]/5 rounded-xl p-4">
              <span className="text-[#009B77] text-xl">✓</span>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
        <Link href="/elaqe" className="inline-block bg-[#0057A8] text-white font-bold px-8 py-3 rounded-full hover:bg-[#004a90] transition-colors">
          Pulsuz Məsləhət Al
        </Link>
      </section>
    </div>
  );
}
