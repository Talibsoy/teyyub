import Link from "next/link";
import { waLink } from "@/components/WhatsAppButton";

const WA_GENERAL = waLink();

const destinations = [
  { id: "turkiye", name: "Türkiyə", flag: "🇹🇷", desc: "İstanbul, Antalya, Kapadokiya", price: "499", duration: "4–7 gün", tours: 24 },
  { id: "dubai",   name: "Dubai",   flag: "🇦🇪", desc: "Lüks otellər, şəhər turları",   price: "699", duration: "5–7 gün", tours: 14 },
  { id: "misir",   name: "Misir",   flag: "🇪🇬", desc: "Şarm El-Şeyx, Hurqada",         price: "549", duration: "7 gün",   tours: 10 },
  { id: "avropa",  name: "Avropa",  flag: "🇪🇺", desc: "Paris, Roma, Barselona",         price: "899", duration: "6–9 gün", tours: 20 },
];

const packages = [
  {
    name: "İstanbul Klassik",
    destination: "Türkiyə 🇹🇷",
    price: "549",
    duration: "5 gün / 4 gecə",
    includes: ["Uçuş", "4★ Otel", "Transfer", "Bələdçi"],
    msg: "Salam, İstanbul Klassik paketi haqqında məlumat almaq istəyirəm",
  },
  {
    name: "Dubai Lüks",
    destination: "BƏƏ 🇦🇪",
    price: "799",
    duration: "6 gün / 5 gecə",
    includes: ["Uçuş", "5★ Otel", "Transfer", "City Tour"],
    msg: "Salam, Dubai Lüks paketi haqqında məlumat almaq istəyirəm",
  },
  {
    name: "Şarm El-Şeyx All Inclusive",
    destination: "Misir 🇪🇬",
    price: "649",
    duration: "7 gün / 6 gecə",
    includes: ["Uçuş", "All Inclusive", "Transfer", "Sığorta"],
    msg: "Salam, Misir all inclusive paketi haqqında məlumat almaq istəyirəm",
  },
  {
    name: "Paris – Roma İkili",
    destination: "Avropa 🇪🇺",
    price: "1199",
    duration: "8 gün / 7 gecə",
    includes: ["Uçuşlar", "Otellər", "Gəzintilər", "Sığorta"],
    msg: "Salam, Paris–Roma paketi haqqında məlumat almaq istəyirəm",
  },
];

const testimonials = [
  { name: "Aytən X.", dest: "Dubai", text: "Hər şey mükəmməl idi — otel, transfer, ekskursiyalar. Natoure komandası 24/7 əlaqədə idi.", rating: 5 },
  { name: "Müşfiq A.", dest: "Türkiyə", text: "İlk dəfə xarici turda idim, heç problem yaşamadım. Çox professional yanaşdılar.", rating: 5 },
  { name: "Leyla M.", dest: "Misir", text: "Qiymət-keyfiyyət nisbəti əla idi. Ailə ilə getdik, hamı razı qaldı.", rating: 5 },
];

const whyUs = [
  { icon: "⚡", title: "AI dəstəkli sistem", desc: "Sizə uyğun paketi dərhal tapırıq — araşdırmaya vaxt lazım deyil" },
  { icon: "🎯", title: "Fərdi yanaşma", desc: "Hər müştəri üçün büdcəyə uyğun xüsusi plan hazırlanır" },
  { icon: "✈️", title: "Tam xidmət", desc: "Bilet + otel + transfer + viza — hamısı bizdən" },
  { icon: "📞", title: "24/7 dəstək", desc: "Səyahət boyunca komandamız sizinlə daim əlaqədədir" },
];

export default function HomePage() {
  return (
    <div style={{ background: "#0b0b0b", color: "#fff" }}>

      {/* ── HERO ── */}
      <section style={{ padding: "110px 60px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-6"
          style={{ background: "#111", border: "1px solid #222", color: "#aaa" }}>
          <span style={{ color: "#D4AF37" }}>★</span>
          <span>500+ məmnun turist • Bakıdan bütün dünyaya</span>
        </div>

        <h1 className="font-bold mb-6" style={{ fontSize: "clamp(36px,5vw,60px)", lineHeight: 1.15 }}>
          Azərbaycandan Dünyaya<br />
          <span style={{ color: "#D4AF37" }}>Premium Səyahət</span> Paketləri
        </h1>

        <p style={{ color: "#aaa", maxWidth: "520px", lineHeight: 1.8, marginBottom: "40px", fontSize: "17px" }}>
          Türkiyə, Dubai, Misir, Avropa — hər istiqamətdə sərfəli, rahat və etibarlı turlar.
          Pulsuz məsləhət üçün WhatsApp-da yazın.
        </p>

        <div className="flex flex-wrap gap-4">
          <a href={WA_GENERAL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: "#25D366", color: "#fff", fontWeight: 700, padding: "15px 30px", borderRadius: "10px", fontSize: "15px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp-da Təklif Al
          </a>
          <Link href="/turlar"
            style={{ border: "1px solid #333", color: "#fff", padding: "15px 30px", borderRadius: "10px", fontSize: "15px" }}
            className="hover:border-[#D4AF37] transition-colors">
            Bütün Turlara Bax
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-16" style={{ maxWidth: "380px" }}>
          {[{ num: "500+", label: "Məmnun Turist" }, { num: "5", label: "İstiqamət" }, { num: "24/7", label: "WhatsApp Dəstəyi" }].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: "#D4AF37" }}>{s.num}</div>
              <div className="text-xs mt-1" style={{ color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section style={{ padding: "80px 60px", background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Populyar İstiqamətlər</h2>
              <p style={{ color: "#666" }}>Ən çox seçilən 4 istiqamət</p>
            </div>
            <Link href="/turlar" style={{ color: "#D4AF37", fontSize: "14px" }} className="hover:underline hidden md:block">
              Hamısına bax →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {destinations.map((d) => (
              <a key={d.id} href={waLink(`Salam, ${d.name} turu haqqında məlumat almaq istəyirəm`)}
                target="_blank" rel="noopener noreferrer"
                className="group block rounded-2xl p-6 transition-all hover:border-[#D4AF37] cursor-pointer"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-4xl mb-3">{d.flag}</div>
                <h3 className="text-lg font-bold text-white mb-1">{d.name}</h3>
                <p className="text-sm mb-4" style={{ color: "#666" }}>{d.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#1a1a1a", color: "#666" }}>{d.duration}</span>
                  <span className="font-bold text-sm" style={{ color: "#D4AF37" }}>{d.price} AZN-dən</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section style={{ padding: "80px 60px" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Tur Paketləri</h2>
          <p className="mb-10" style={{ color: "#666" }}>Hazır paketlər — bilet, otel, transfer, bələdçi daxil</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {packages.map((pkg) => (
              <div key={pkg.name} className="rounded-2xl flex flex-col" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="p-5 flex-1">
                  <div className="text-xs mb-2" style={{ color: "#666" }}>{pkg.destination}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                  <p className="text-xs mb-4" style={{ color: "#555" }}>⏱ {pkg.duration}</p>
                  <ul className="space-y-1.5 mb-5">
                    {pkg.includes.map((item) => (
                      <li key={item} className="text-sm flex items-center gap-2" style={{ color: "#aaa" }}>
                        <span style={{ color: "#D4AF37" }}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between mb-4 pt-4" style={{ borderTop: "1px solid #1a1a1a" }}>
                    <div>
                      <span className="text-xl font-bold" style={{ color: "#D4AF37" }}>{pkg.price} AZN</span>
                      <span className="text-xs ml-1" style={{ color: "#555" }}>/nəfər</span>
                    </div>
                  </div>
                  <a href={waLink(pkg.msg)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm font-semibold"
                    style={{ background: "#25D366", color: "#fff" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Təklif Al
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section style={{ padding: "80px 60px", background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2">Niyə Natoure?</h2>
          <p className="mb-10" style={{ color: "#666" }}>Sadəcə tur agentliyi deyil — tam səyahət həlli</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyUs.map((w) => (
              <div key={w.title} className="rounded-2xl p-6" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="text-3xl mb-4">{w.icon}</div>
                <h3 className="font-bold text-white mb-2">{w.title}</h3>
                <p className="text-sm" style={{ color: "#666" }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "80px 60px" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">Müştərilərimiz Nə Deyir?</h2>
            <p style={{ color: "#666" }}>500+ məmnun turistin rəyi</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl p-6" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <StarRating n={t.rating} />
                <p className="my-4 text-sm leading-relaxed" style={{ color: "#aaa" }}>&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#555" }}>{t.dest} sefəri</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 60px", background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">✈️</div>
          <h2 className="text-3xl font-bold text-white mb-4">Səyahətinizi Bu Gün Planlaşdırın</h2>
          <p className="mb-8" style={{ color: "#666", lineHeight: 1.7 }}>
            WhatsApp-da yazın — 5 dəqiqə ərzində sizə uyğun tur paketini göndərərik. Pulsuz məsləhət, heç bir öhdəlik.
          </p>
          <a href={WA_GENERAL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: "#25D366", color: "#fff", fontWeight: 700, padding: "16px 40px", borderRadius: "12px", fontSize: "16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            İndi WhatsApp-da Yazın
          </a>
          <div className="mt-6 text-xs" style={{ color: "#555" }}>
            📞 +994 51 776 96 32 &nbsp;·&nbsp; ✉️ info@natourefly.com
          </div>
        </div>
      </section>

    </div>
  );
}

function StarRating({ n }: { n: number }) {
  return <div className="flex gap-0.5">{Array.from({ length: n }).map((_, i) => <span key={i} style={{ color: "#D4AF37" }}>★</span>)}</div>;
}
