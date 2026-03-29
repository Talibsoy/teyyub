import Link from "next/link";
import { waLink } from "@/lib/whatsapp";
import ReviewsSection from "@/components/ReviewsSection";

const WA_GENERAL = waLink();

const destinations = [
  { id: "turkiye", name: "Türkiyə", flag: "🇹🇷", desc: "İstanbul, Antalya, Kapadokiya", price: "499", duration: "4–7 gün", tours: 24 },
  { id: "dubai",   name: "Dubai",   flag: "🇦🇪", desc: "Lüks otellər, şəhər turları",   price: "699", duration: "5–7 gün", tours: 14 },
  { id: "misir",   name: "Misir",   flag: "🇪🇬", desc: "Şarm El-Şeyx, Hurqada",         price: "549", duration: "7 gün",   tours: 10 },
  { id: "avropa",  name: "Avropa",  flag: "🇪🇺", desc: "Paris, Roma, Barselona",         price: "899", duration: "6–9 gün", tours: 20 },
];

const packages = [
  { name: "İstanbul Klassik",         destination: "Türkiyə 🇹🇷", price: "549",  duration: "5 gün / 4 gecə", includes: ["Uçuş", "4★ Otel", "Transfer", "Bələdçi"],       msg: "Salam, İstanbul Klassik paketi haqqında məlumat almaq istəyirəm" },
  { name: "Dubai Lüks",               destination: "BƏƏ 🇦🇪",    price: "799",  duration: "6 gün / 5 gecə", includes: ["Uçuş", "5★ Otel", "Transfer", "City Tour"],      msg: "Salam, Dubai Lüks paketi haqqında məlumat almaq istəyirəm" },
  { name: "Şarm El-Şeyx All Inclusive",destination: "Misir 🇪🇬",  price: "649",  duration: "7 gün / 6 gecə", includes: ["Uçuş", "All Inclusive", "Transfer", "Sığorta"],  msg: "Salam, Misir all inclusive paketi haqqında məlumat almaq istəyirəm" },
  { name: "Paris – Roma İkili",        destination: "Avropa 🇪🇺",  price: "1199", duration: "8 gün / 7 gecə", includes: ["Uçuşlar", "Otellər", "Gəzintilər", "Sığorta"],  msg: "Salam, Paris–Roma paketi haqqında məlumat almaq istəyirəm" },
];

const testimonials = [
  { name: "Aytən X.", dest: "Dubai",   text: "Hər şey mükəmməl idi — otel, transfer, ekskursiyalar. Natoure komandası 24/7 əlaqədə idi.", rating: 5 },
  { name: "Müşfiq A.", dest: "Türkiyə", text: "İlk dəfə xarici turda idim, heç problem yaşamadım. Çox professional yanaşdılar.",          rating: 5 },
  { name: "Leyla M.", dest: "Misir",   text: "Qiymət-keyfiyyət nisbəti əla idi. Ailə ilə getdik, hamı razı qaldı.",                       rating: 5 },
];

const whyUs = [
  { icon: "⚡", title: "AI dəstəkli sistem",  desc: "Sizə uyğun paketi dərhal tapırıq — araşdırmaya vaxt lazım deyil" },
  { icon: "🎯", title: "Fərdi yanaşma",       desc: "Hər müştəri üçün büdcəyə uyğun xüsusi plan hazırlanır" },
  { icon: "✈️", title: "Tam xidmət",          desc: "Bilet + otel + transfer + viza — hamısı bizdən" },
  { icon: "📞", title: "24/7 dəstək",         desc: "Səyahət boyunca komandamız sizinlə daim əlaqədədir" },
];

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function StarRating({ n }: { n: number }) {
  return <div className="flex gap-0.5">{Array.from({ length: n }).map((_, i) => <span key={i} style={{ color: "#D4AF37" }}>★</span>)}</div>;
}

export default function HomePage() {
  return (
    <div style={{ background: "#0b0b0b", color: "#fff" }}>

      {/* ── HERO ── */}
      <section className="px-4 py-16 md:py-24 md:px-12 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm mb-5"
          style={{ background: "#111", border: "1px solid #222", color: "#aaa" }}>
          <span style={{ color: "#D4AF37" }}>★</span>
          <span>500+ məmnun turist • Bakıdan bütün dünyaya</span>
        </div>

        <h1 className="font-bold mb-5 text-3xl md:text-5xl lg:text-6xl" style={{ lineHeight: 1.15 }}>
          Azərbaycandan Dünyaya<br />
          <span style={{ color: "#D4AF37" }}>Premium Səyahət</span> Paketləri
        </h1>

        <p className="text-sm md:text-base mb-8 max-w-xl" style={{ color: "#aaa", lineHeight: 1.8 }}>
          Türkiyə, Dubai, Misir, Avropa — hər istiqamətdə sərfəli, rahat və etibarlı turlar.
          Pulsuz məsləhət üçün WhatsApp-da yazın.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a href={WA_GENERAL} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold py-3.5 px-6 rounded-xl"
            style={{ background: "#25D366", color: "#fff" }}>
            <WaIcon /> WhatsApp-da Təklif Al
          </a>
          <Link href="/turlar"
            className="flex items-center justify-center text-sm py-3.5 px-6 rounded-xl hover:border-[#D4AF37] transition-colors"
            style={{ border: "1px solid #333", color: "#fff" }}>
            Bütün Turlara Bax
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-12 max-w-xs md:max-w-sm">
          {[{ num: "500+", label: "Məmnun Turist" }, { num: "5", label: "İstiqamət" }, { num: "24/7", label: "WA Dəstəyi" }].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl md:text-2xl font-bold" style={{ color: "#D4AF37" }}>{s.num}</div>
              <div className="text-xs mt-1" style={{ color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section className="px-4 py-12 md:py-16 md:px-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Populyar İstiqamətlər</h2>
              <p className="text-sm" style={{ color: "#666" }}>Ən çox seçilən 4 istiqamət</p>
            </div>
            <Link href="/turlar" className="text-sm hover:underline hidden sm:block" style={{ color: "#D4AF37" }}>
              Hamısına bax →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {destinations.map((d) => (
              <a key={d.id} href={waLink(`Salam, ${d.name} turu haqqında məlumat almaq istəyirəm`)}
                target="_blank" rel="noopener noreferrer"
                className="block rounded-xl p-4 md:p-5 transition-all hover:border-[#D4AF37]"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-3xl mb-2">{d.flag}</div>
                <h3 className="text-base font-bold text-white mb-1">{d.name}</h3>
                <p className="text-xs mb-3 hidden md:block" style={{ color: "#666" }}>{d.desc}</p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: "#555" }}>{d.duration}</span>
                  <span className="font-bold text-sm" style={{ color: "#D4AF37" }}>{d.price} AZN-dən</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section className="px-4 py-12 md:py-16 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Tur Paketləri</h2>
          <p className="text-sm mb-8" style={{ color: "#666" }}>Hazır paketlər — bilet, otel, transfer daxil</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.name} className="rounded-xl flex flex-col" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="p-4 md:p-5 flex-1">
                  <div className="text-xs mb-1" style={{ color: "#666" }}>{pkg.destination}</div>
                  <h3 className="text-base font-bold text-white mb-1">{pkg.name}</h3>
                  <p className="text-xs mb-3" style={{ color: "#555" }}>⏱ {pkg.duration}</p>
                  <ul className="space-y-1 mb-4">
                    {pkg.includes.map((item) => (
                      <li key={item} className="text-xs flex items-center gap-1.5" style={{ color: "#aaa" }}>
                        <span style={{ color: "#D4AF37" }}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 md:p-5 pt-0">
                  <div className="flex items-center justify-between mb-3 pt-3" style={{ borderTop: "1px solid #1a1a1a" }}>
                    <span className="text-lg font-bold" style={{ color: "#D4AF37" }}>{pkg.price} AZN</span>
                    <span className="text-xs" style={{ color: "#555" }}>/nəfər</span>
                  </div>
                  <a href={waLink(pkg.msg)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg hover:opacity-90 transition-opacity text-xs font-semibold"
                    style={{ background: "#25D366", color: "#fff" }}>
                    <WaIcon /> Təklif Al
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="px-4 py-12 md:py-16 md:px-12" style={{ background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Niyə Natoure?</h2>
          <p className="text-sm mb-8" style={{ color: "#666" }}>Sadəcə tur agentliyi deyil — tam səyahət həlli</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {whyUs.map((w) => (
              <div key={w.title} className="rounded-xl p-4 md:p-5" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-2xl mb-3">{w.icon}</div>
                <h3 className="font-bold text-white text-sm mb-1">{w.title}</h3>
                <p className="text-xs" style={{ color: "#666" }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <ReviewsSection />

      {/* ── CTA ── */}
      <section className="px-4 py-12 md:py-16 md:px-12" style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">✈️</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Səyahətinizi Bu Gün Planlaşdırın</h2>
          <p className="text-sm mb-6" style={{ color: "#666", lineHeight: 1.7 }}>
            WhatsApp-da yazın — 5 dəqiqə ərzində sizə uyğun tur paketini göndərərik. Pulsuz məsləhət, heç bir öhdəlik.
          </p>
          <a href={WA_GENERAL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold py-3.5 px-8 rounded-xl"
            style={{ background: "#25D366", color: "#fff" }}>
            <WaIcon /> İndi WhatsApp-da Yazın
          </a>
          <div className="mt-4 text-xs" style={{ color: "#555" }}>
            📞 +994 51 776 96 32 &nbsp;·&nbsp; ✉️ info@natourefly.com
          </div>
        </div>
      </section>

    </div>
  );
}
