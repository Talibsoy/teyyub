"use client";
import Link from "next/link";
import { Globe2, MapPin, Sun, Building2, Briefcase, Zap, RefreshCw, Target, TrendingUp, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function HaqqimızdaPage() {
  const { language } = useLanguage();

  const services = [
    {
      Icon: Globe2,
      title: language === "az" ? "Avropa Turları" : language === "tr" ? "Avrupa Turları" : "Europe Tours",
      items: language === "az"
        ? ["İtaliya, Fransa, Almaniya", "Şəhər turları + mədəni təcrübələr", "Viza dəstəyi ilə paketlər"]
        : language === "tr"
        ? ["İtalya, Fransa, Almanya", "Şehir turları + kültürel deneyimler", "Vize desteği içeren paketler"]
        : ["Italy, France, Germany", "City tours + cultural experiences", "Packages with visa support"]
    },
    {
      Icon: MapPin,
      title: language === "az" ? "Türkiyə Turları" : language === "tr" ? "Türkiye Turları" : "Turkey Tours",
      items: language === "az"
        ? ["Antalya, Bodrum, İstanbul", "Ailəvi və premium resort paketləri", "Hər büdcəyə uyğun seçimlər"]
        : language === "tr"
        ? ["Antalya, Bodrum, İstanbul", "Aile ve premium resort paketleri", "Her bütçeye uygun seçenekler"]
        : ["Antalya, Bodrum, Istanbul", "Family & premium resort packages", "Options for every budget"]
    },
    {
      Icon: Sun,
      title: language === "az" ? "Misir Turları" : language === "tr" ? "Mısır Turları" : "Egypt Tours",
      items: language === "az"
        ? ["Şarm El-Şeyx, Hurqada", "Hər şey daxil otellər", "Dəniz və istirahət paketləri"]
        : language === "tr"
        ? ["Şarm El-Şeyh, Hurghada", "Her şey dahil oteller", "Deniz ve dinlenme paketleri"]
        : ["Sharm El-Sheikh, Hurghada", "All-inclusive hotels", "Sea & relaxation packages"]
    },
    {
      Icon: Building2,
      title: language === "az" ? "Dubai Turları" : language === "tr" ? "Dubai Turları" : "Dubai Tours",
      items: language === "az"
        ? ["Lüks və premium paketlər", "Şəhər + əyləncə kombinasiyaları", "Alış-veriş və təcrübə turları"]
        : language === "tr"
        ? ["Lüks ve premium paketler", "Şehir + eğlence kombinasyonları", "Alışveriş ve deneyim turları"]
        : ["Luxury & premium packages", "City + entertainment combinations", "Shopping & experience tours"]
    },
    {
      Icon: Briefcase,
      title: language === "az" ? "Fərdi Planlama" : language === "tr" ? "Kişisel Planlama" : "Custom Planning",
      items: language === "az"
        ? ["Müştəriyə xüsusi proqram", "Büdcəyə uyğun optimizasiya", "Tam xidmət (bilet+otel+transfer)"]
        : language === "tr"
        ? ["Müşteriye özel program", "Bütçeye uygun optimizasyon", "Tam hizmet (bilet+otel+transfer)"]
        : ["Tailored program for clients", "Budget optimization", "Full service (ticket+hotel+transfer)"]
    },
  ];

  const usps = [
    {
      Icon: Zap,
      title: language === "az" ? "AI əsaslı sistem" : language === "tr" ? "Yapay Zeka Destekli" : "AI-Powered System",
      desc: language === "az"
        ? "Müştəri ilə chatbot danışır, tələbatı analiz edir, avtomatik uyğun paket təklif edir."
        : language === "tr"
        ? "Müşteri ile chatbot konuşur, talepleri analiz eder ve otomatik uygun paketleri önerir."
        : "The chatbot communicates with the client, analyzes needs, and automatically suggests matching packages."
    },
    {
      Icon: RefreshCw,
      title: language === "az" ? "Avtomatlaşdırılmış proses" : language === "tr" ? "Otomasyon Süreci" : "Automated Processes",
      desc: language === "az"
        ? "Lead-lər avtomatik toplanır, CRM inteqrasiyası, satış prosesi optimallaşdırılır."
        : language === "tr"
        ? "Potansiyel müşteriler otomatik toplanır, CRM entegrasyonu ile satış süreçleri optimize edilir."
        : "Leads are collected automatically, CRM integration, and sales workflow is optimized."
    },
    {
      Icon: Target,
      title: language === "az" ? "Fərdi yanaşma" : language === "tr" ? "Kişisel Yaklaşım" : "Personal Approach",
      desc: language === "az"
        ? "Hər müştəri üçün xüsusi plan. Büdcəyə uyğun maksimum dəyər."
        : language === "tr"
        ? "Her müşteri için özel bir plan. Bütçeye göre maksimum değer."
        : "Custom travel plans for every client. Maximum value for your budget."
    },
    {
      Icon: TrendingUp,
      title: language === "az" ? "Satış yönümlü" : language === "tr" ? "Satış Odaklı" : "Sales-Oriented",
      desc: language === "az"
        ? "Sadəcə məlumat verilmir — müştəri qərar mərhələsinə gətirilir."
        : language === "tr"
        ? "Sadece bilgi verilmez — müşteri karar verme aşamasına getirilir."
        : "We don't just provide information — we guide the customer to the buying decision."
    },
  ];

  const stats = [
    { num: "5+",   label: language === "az" ? "İstiqamət" : language === "tr" ? "Destinasyon" : "Destinations" },
    { num: "100%", label: language === "az" ? "Fərdi yanaşma" : language === "tr" ? "Kişisel Yaklaşım" : "Personalized" },
    { num: "AI",   label: language === "az" ? "Dəstəkli sistem" : language === "tr" ? "Destekli Sistem" : "Powered System" },
    { num: "24/7", label: language === "az" ? "WhatsApp dəstəyi" : language === "tr" ? "WhatsApp Desteği" : "WhatsApp Support" },
  ];

  const whyItems = language === "az"
    ? [
        "Araşdırma etməyə vaxt itirmirsən",
        "Sənə uyğun ən optimal variant təqdim olunur",
        "Sürətli və rahat qərar prosesi",
        "Minimum risk, maksimum rahatlıq",
      ]
    : language === "tr"
    ? [
        "Araştırma yaparken zaman kaybetmezsiniz",
        "Size en uygun ve en optimal seçenekler sunulur",
        "Hızlı ve konforlu bir karar süreci",
        "Minimum risk, maksimum rahatlık",
      ]
    : [
        "You don't waste time doing hours of research",
        "The most optimal options tailored to you are presented",
        "Fast and hassle-free decision process",
        "Minimum risk, maximum comfort",
      ];

  return (
    <div className="ns-page">

      {/* Page Header */}
      <div className="ns-page-header">
        <span className="ns-label">
          {language === "az" ? "Biz Kimik?" : language === "tr" ? "Biz Kimiz?" : "Who We Are?"}
        </span>
        <h1>{language === "az" ? "Haqqımızda" : language === "tr" ? "Hakkımızda" : "About Us"}</h1>
        <p>
          {language === "az"
            ? "AI + avtomatlaşdırma + satış psixologiyası üzərində qurulmuş müasir turizm platforması"
            : language === "tr"
            ? "Yapay zeka + otomasyon + satış psikolojisi üzerine kurulmuş modern turizm platformu"
            : "Modern tourism platform built on AI + automation + sales psychology"}
        </p>
      </div>

      {/* What is Natoure */}
      <section className="ns-section-w">
        <div className="ns-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="ns-label">
                {language === "az" ? "Platformamız" : language === "tr" ? "Platformumuz" : "Our Platform"}
              </span>
              <h2 className="ns-title mb-5">
                {language === "az" ? "Natoure Nədir?" : language === "tr" ? "Natoure Nedir?" : "What is Natoure?"}
              </h2>
              <p className="ns-subtitle mb-4">
                {language === "az"
                  ? "Natoure — müasir yanaşma ilə fəaliyyət göstərən, fərdi və korporativ müştərilər üçün optimallaşdırılmış turizm platformasıdır."
                  : language === "tr"
                  ? "Natoure — modern bir yaklaşımla faaliyet gösteren, bireysel ve kurumsal müşteriler için optimize edilmiş bir turizm platformudur."
                  : "Natoure is a modern tourism platform optimized for individual and corporate clients using an innovative approach."}
              </p>
              <p className="ns-subtitle mb-4">
                {language === "az"
                  ? "Bizim əsas məqsədimiz standart tur paketləri satmaq yox — müştəriyə uyğun fərdi təcrübə yaratmaqdır."
                  : language === "tr"
                  ? "Bizim temel amacımız standart tur paketleri satmak değil — müşteriye uygun kişisel deneyimler yaratmaktır."
                  : "Our primary goal is not just selling standard packages — but crafting personalized experiences tailored to each client."}
              </p>
              <p className="ns-subtitle">
                {language === "az"
                  ? "Natoure, klassik turizm agentliyi deyil — AI + avtomatlaşdırma + satış psixologiyası üzərində qurulmuş sistemdir."
                  : language === "tr"
                  ? "Natoure, klasik bir turizm acentesi değildir — yapay zeka + otomasyon + satış psikolojisi üzerine kurulu bir sistemdir."
                  : "Natoure is not a classic travel agency — it is a smart system built on AI + automation + sales psychology."}
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
            <span className="ns-label">
              {language === "az" ? "Nə Təklif Edirik?" : language === "tr" ? "Ne Sunuyoruz?" : "What We Offer?"}
            </span>
            <h2 className="ns-title">
              {language === "az" ? "Xidmətlərimiz" : language === "tr" ? "Hizmetlerimiz" : "Our Services"}
            </h2>
            <p className="ns-subtitle">
              {language === "az" ? "5 əsas istiqamətdə tam xidmət" : language === "tr" ? "5 ana yönde tam hizmet" : "Full support across 5 key areas"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.title} className="ns-card-hover p-6">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center mb-3">
                  <s.Icon size={20} className="text-sky-600" />
                </div>
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
            <span className="ns-label">
              {language === "az" ? "Üstünlüklərimiz" : language === "tr" ? "Farkımız" : "Why Choose Us"}
            </span>
            <h2 className="ns-title">
              {language === "az" ? "Digər Şirkətlərdən Fərqimiz" : language === "tr" ? "Diğer Şirketlerden Farkımız" : "How We Are Different"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {usps.map(u => (
              <div key={u.title} className="ns-card-hover flex gap-4 p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <u.Icon size={20} className="text-indigo-600" />
                </div>
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
          <span className="ns-label">
            {language === "az" ? "Seçim Etmək Asan" : language === "tr" ? "Seçim Yapmak Kolay" : "Easy Choices"}
          </span>
          <h2 className="ns-title mb-10">
            {language === "az" ? "Niyə Natoure?" : language === "tr" ? "Neden Natoure?" : "Why Natoure?"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10">
            {whyItems.map(item => (
              <div key={item} className="flex items-start gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                <CheckCircle size={16} className="text-sky-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/elaqe" className="ns-btn ns-btn-primary">
            {language === "az" ? "Bizimlə Əlaqə" : language === "tr" ? "Bizimle İletişim" : "Contact Us"}
          </Link>
        </div>
      </section>

    </div>
  );
}
