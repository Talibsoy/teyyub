import Link from "next/link";

const destinations = [
  {
    id: "turkiye",
    name: "Türkiyə",
    flag: "🇹🇷",
    description: "İstanbul, Antalya, Kapadokiya və daha çox. Hər büdcəyə uyğun turlar.",
    image: "bg-gradient-to-br from-red-600 to-red-400",
    price: "499",
    tours: 24,
  },
  {
    id: "ereb",
    name: "Ərəb Ölkələri",
    flag: "🇦🇪",
    description: "Dubai, Abu Dhabi, Qahirə, Türkistan. Lüks və macəra dolu səyahətlər.",
    image: "bg-gradient-to-br from-yellow-600 to-amber-400",
    price: "699",
    tours: 18,
  },
  {
    id: "avropa",
    name: "Avropa",
    flag: "🇪🇺",
    description: "Paris, Roma, Barselona, Prag. Avropa şəhərlərini kəşf edin.",
    image: "bg-gradient-to-br from-blue-600 to-indigo-400",
    price: "899",
    tours: 31,
  },
];

const features = [
  { icon: "🛡️", title: "Etibarlı Şirkət", desc: "Lisenziyalı turizm agentliyi, sığortalı turlar" },
  { icon: "💰", title: "Sərfəli Qiymətlər", desc: "Rəqabətli qiymətlər, gizli ödənişlər yoxdur" },
  { icon: "🎯", title: "Fərdi Yanaşma", desc: "Hər turistə xüsusi xidmət və diqqət" },
  { icon: "🌍", title: "Geniş İstiqamətlər", desc: "3 əsas istiqamət, 70+ aktiv tur" },
];

const popularTours = [
  {
    name: "İstanbul 4 Gecə",
    destination: "Türkiyə 🇹🇷",
    price: "549",
    duration: "5 gün / 4 gecə",
    includes: ["Uçuş", "Otel", "Turlar", "Viza dəstəyi"],
  },
  {
    name: "Dubai Lüks Paket",
    destination: "BƏƏ 🇦🇪",
    price: "799",
    duration: "6 gün / 5 gecə",
    includes: ["Uçuş", "5★ Otel", "Turlar", "Transfer"],
  },
  {
    name: "Paris – Roma İkili",
    destination: "Avropa 🇪🇺",
    price: "1199",
    duration: "8 gün / 7 gecə",
    includes: ["Uçuş", "Otel", "Gəzintilər", "Sığorta"],
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-[#0057A8] via-[#0069cc] to-[#004a90] text-white overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>✈</span>
            <span>Bakıdan Bütün Dünyaya</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Xəyal Etdiyiniz{" "}
            <span className="text-[#D4AF37]">Səyahəti</span>
            <br />Biz Reallaşdırırıq
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Türkiyə, Ərəb ölkələri və Avropa istiqamətlərində sərfəli, rahat və etibarlı turlar.
            Bakı ofisindən birbaşa rezervasiya edin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/turlar"
              className="bg-[#D4AF37] text-[#0057A8] font-bold px-8 py-4 rounded-full hover:bg-yellow-400 transition-all hover:scale-105 shadow-lg"
            >
              Turlara Bax
            </Link>
            <Link
              href="/elaqe"
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-[#0057A8] transition-all"
            >
              Pulsuz Məsləhət Al
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { num: "70+", label: "Aktiv Tur" },
              { num: "5000+", label: "Məmnun Turist" },
              { num: "3", label: "İstiqamət" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-[#D4AF37]">{s.num}</div>
                <div className="text-sm text-blue-200 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">Əsas İstiqamətlər</h2>
          <p className="text-gray-500 max-w-xl mx-auto">3 əsas istiqamətdə 70-dən artıq tur paketimiz mövcuddur</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <Link key={dest.id} href={`/turlar?kateqoriya=${dest.id}`} className="group">
              <div className={`${dest.image} rounded-2xl p-8 text-white h-64 flex flex-col justify-between group-hover:scale-[1.02] transition-transform shadow-lg`}>
                <div>
                  <div className="text-5xl mb-3">{dest.flag}</div>
                  <h3 className="text-2xl font-bold">{dest.name}</h3>
                  <p className="text-sm mt-2 text-white/80">{dest.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">{dest.tours} tur</span>
                  <span className="font-bold text-lg">{dest.price} $ <span className="text-sm font-normal">-dən</span></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR TOURS */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">Populyar Turlar</h2>
            <p className="text-gray-500">Ən çox seçilən tur paketlərimiz</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularTours.map((tour) => (
              <div key={tour.name} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-[#0057A8] to-[#009B77] h-3" />
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-1">{tour.destination}</div>
                  <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">{tour.name}</h3>
                  <div className="text-sm text-gray-500 mb-4">⏱ {tour.duration}</div>
                  <ul className="space-y-1.5 mb-6">
                    {tour.includes.map((item) => (
                      <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-[#009B77]">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#0057A8]">{tour.price}$</span>
                      <span className="text-sm text-gray-400 ml-1">/nəfər</span>
                    </div>
                    <Link
                      href="/elaqe"
                      className="bg-[#0057A8] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#004a90] transition-colors"
                    >
                      Sifariş Et
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/turlar" className="inline-block border-2 border-[#0057A8] text-[#0057A8] font-semibold px-8 py-3 rounded-full hover:bg-[#0057A8] hover:text-white transition-colors">
              Bütün Turlara Bax →
            </Link>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">Niyə FlyNaToure?</h2>
          <p className="text-gray-500">Müştərilərimizin bizə etibar etməsinin əsas səbəbləri</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="text-center p-6 rounded-2xl border border-gray-100 hover:border-[#0057A8]/30 hover:shadow-md transition-all">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-[#1a1a2e] mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#0057A8] to-[#009B77] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Səyahətinizi Planlaşdırmağa Hazırsınız?</h2>
          <p className="text-blue-100 mb-8 text-lg">Pulsuz məsləhət üçün bizimlə əlaqə saxlayın. Mütəxəssislərimiz ən uyğun tur paketini sizin üçün seçəcək.</p>
          <Link
            href="/elaqe"
            className="inline-block bg-[#D4AF37] text-[#0057A8] font-bold px-10 py-4 rounded-full hover:bg-yellow-400 hover:scale-105 transition-all shadow-lg text-lg"
          >
            İndi Əlaqə Saxla
          </Link>
        </div>
      </section>
    </>
  );
}
