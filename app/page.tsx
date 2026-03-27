import Link from "next/link";

const destinations = [
  { id: "turkiye", name: "Türkiyə", flag: "🇹🇷", description: "İstanbul, Antalya, Kapadokiya. Hər büdcəyə uyğun turlar.", price: "499", tours: 24 },
  { id: "ereb", name: "Ərəb Ölkələri", flag: "🇦🇪", description: "Dubai, Abu Dhabi, Qahirə. Lüks və macəra dolu səyahətlər.", price: "699", tours: 18 },
  { id: "avropa", name: "Avropa", flag: "🇪🇺", description: "Paris, Roma, Barselona, Prag. Avropa şəhərlərini kəşf edin.", price: "899", tours: 31 },
  { id: "misir", name: "Misir", flag: "🇪🇬", description: "Şarm El-Şeyx, Hurqada. Dəniz və istirahət paketləri.", price: "599", tours: 12 },
];

const features = [
  { icon: "⚡", title: "AI əsaslı sistem", desc: "Müştəriyə uyğun tur avtomatik təklif edilir" },
  { icon: "🎯", title: "Fərdi yanaşma", desc: "Hər müştəri üçün xüsusi plan hazırlanır" },
  { icon: "💰", title: "Sərfəli qiymətlər", desc: "Rəqabətli qiymətlər, gizli ödənişlər yoxdur" },
  { icon: "🔄", title: "Tam xidmət", desc: "Bilet + otel + transfer + plan — hamısı bizdə" },
];

const popularTours = [
  { name: "İstanbul 4 Gecə", destination: "Türkiyə 🇹🇷", price: "549", duration: "5 gün / 4 gecə", includes: ["Uçuş", "Otel", "Turlar", "Viza dəstəyi"] },
  { name: "Dubai Lüks Paket", destination: "BƏƏ 🇦🇪", price: "799", duration: "6 gün / 5 gecə", includes: ["Uçuş", "5★ Otel", "Turlar", "Transfer"] },
  { name: "Paris – Roma İkili", destination: "Avropa 🇪🇺", price: "1199", duration: "8 gün / 7 gecə", includes: ["Uçuş", "Otel", "Gəzintilər", "Sığorta"] },
];

export default function HomePage() {
  return (
    <div style={{ background: "#0b0b0b", color: "#fff" }}>

      {/* HERO */}
      <section style={{ padding: "100px 60px", maxWidth: "1100px", margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-6" style={{ background: "#111", border: "1px solid #222", color: "#aaa" }}>
          <span>✈</span>
          <span>Bakıdan Bütün Dünyaya</span>
        </div>
        <h1 className="font-bold leading-tight mb-6" style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1.2 }}>
          Xəyal Etdiyiniz <span style={{ color: "#00c2ff" }}>Səyahəti</span><br />
          Biz Reallaşdırırıq
        </h1>
        <p style={{ color: "#aaa", maxWidth: "520px", lineHeight: 1.7, marginBottom: "36px", fontSize: "17px" }}>
          Türkiyə, Ərəb ölkələri, Misir və Avropa istiqamətlərində sərfəli, rahat və etibarlı turlar. Bakı ofisindən birbaşa rezervasiya edin.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/turlar" style={{ background: "#00c2ff", color: "#000", fontWeight: 600, padding: "14px 28px", borderRadius: "10px" }} className="hover:opacity-90 transition-opacity">
            Turlara Bax
          </Link>
          <Link href="/elaqe" style={{ border: "1px solid #333", color: "#fff", padding: "14px 28px", borderRadius: "10px" }} className="hover:border-[#00c2ff] transition-colors">
            Pulsuz Məsləhət Al
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-16" style={{ maxWidth: "400px" }}>
          {[{ num: "70+", label: "Aktiv Tur" }, { num: "5000+", label: "Məmnun Turist" }, { num: "5", label: "İstiqamət" }].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold" style={{ color: "#00c2ff" }}>{s.num}</div>
              <div className="text-sm mt-1" style={{ color: "#aaa" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DESTINATIONS */}
      <section style={{ padding: "80px 60px" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Əsas İstiqamətlər</h2>
          <p className="mb-10" style={{ color: "#aaa" }}>4 əsas istiqamətdə 80-dən artıq tur paketimiz mövcuddur</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {destinations.map((dest) => (
              <Link key={dest.id} href={`/turlar`} className="group block rounded-2xl p-6 transition-all hover:border-[#00c2ff]" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-4xl mb-3">{dest.flag}</div>
                <h3 className="text-lg font-bold text-white mb-2">{dest.name}</h3>
                <p className="text-sm mb-4" style={{ color: "#aaa" }}>{dest.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#1a1a1a", color: "#aaa" }}>{dest.tours} tur</span>
                  <span className="font-bold" style={{ color: "#00c2ff" }}>{dest.price} AZN-dən</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR TOURS */}
      <section style={{ padding: "80px 60px", background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Populyar Turlar</h2>
          <p className="mb-10" style={{ color: "#aaa" }}>Ən çox seçilən tur paketlərimiz</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularTours.map((tour) => (
              <div key={tour.name} className="rounded-2xl p-6" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-sm mb-1" style={{ color: "#aaa" }}>{tour.destination}</div>
                <h3 className="text-xl font-bold text-white mb-1">{tour.name}</h3>
                <div className="text-sm mb-4" style={{ color: "#555" }}>⏱ {tour.duration}</div>
                <ul className="space-y-1.5 mb-6">
                  {tour.includes.map((item) => (
                    <li key={item} className="text-sm flex items-center gap-2" style={{ color: "#aaa" }}>
                      <span style={{ color: "#00c2ff" }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid #1a1a1a" }}>
                  <div>
                    <span className="text-2xl font-bold" style={{ color: "#00c2ff" }}>{tour.price} AZN</span>
                    <span className="text-xs ml-1" style={{ color: "#555" }}>/nəfər</span>
                  </div>
                  <Link href="/elaqe" style={{ background: "#00c2ff", color: "#000", fontWeight: 600, padding: "8px 16px", borderRadius: "8px", fontSize: "13px" }} className="hover:opacity-90 transition-opacity">
                    Sifariş Et
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/turlar" style={{ border: "1px solid #333", color: "#fff", padding: "12px 32px", borderRadius: "10px" }} className="hover:border-[#00c2ff] transition-colors inline-block">
              Bütün Turlara Bax →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 60px" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Niyə Natoure?</h2>
          <p className="mb-10" style={{ color: "#aaa" }}>Müştərilərimizin bizə etibar etməsinin əsas səbəbləri</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl p-6" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: "#aaa" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 60px", background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Səyahətinizi Planlaşdırmağa Hazırsınız?</h2>
          <p className="mb-8 text-lg" style={{ color: "#aaa" }}>Pulsuz məsləhət üçün bizimlə əlaqə saxlayın. Mütəxəssislərimiz ən uyğun tur paketini sizin üçün seçəcək.</p>
          <Link href="/elaqe" style={{ background: "#00c2ff", color: "#000", fontWeight: 700, padding: "16px 40px", borderRadius: "10px", fontSize: "16px" }} className="inline-block hover:opacity-90 transition-opacity">
            İndi Əlaqə Saxla
          </Link>
        </div>
      </section>

    </div>
  );
}
