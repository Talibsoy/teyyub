import Link from "next/link";
import { useLanguage } from "./LanguageContext";

export default function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="bg-white border-t border-slate-200 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#0284c7,#4f46e5)" }}>
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent notranslate" translate="no">
                Natoure
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              {language === "az"
                ? "AI ilə gücləndirilən növbəti nəsil turizm platforması. Bakıdan dünyaya."
                : language === "tr"
                ? "Yapay zeka ile güçlendirilmiş yeni nesil turizm platformu. Bakü'den dünyaya."
                : "Next-generation tourism platform powered by AI. From Baku to the world."}
            </p>
            <div className="flex items-center gap-2">
              <a href="https://www.facebook.com/profile.php?id=61563875994345"
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition"
                style={{ background: "#1877F2" }}>f</a>
              <a href="https://wa.me/447828721748"
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-semibold hover:opacity-80 transition"
                style={{ background: "#25D366" }}>WA</a>
              <a href="https://instagram.com/natoure.fly"
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-semibold hover:opacity-80 transition"
                style={{ background: "linear-gradient(135deg,#f09433,#e6683c,#bc1888)" }}>IG</a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-4 text-sm">
              {language === "az" ? "Keçidlər" : language === "tr" ? "Hızlı Linkler" : "Quick Links"}
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/",           label: language === "az" ? "Ana Səhifə" : language === "tr" ? "Ana Sayfa" : "Home" },
                { href: "/turlar",     label: language === "az" ? "Turlar" : language === "tr" ? "Turlar" : "Tours" },
                { href: "/oteller",    label: language === "az" ? "Otellər" : language === "tr" ? "Oteller" : "Hotels" },
                { href: "/haqqimizda", label: language === "az" ? "Haqqımızda" : language === "tr" ? "Hakkımızda" : "About Us" },
                { href: "/elaqe",      label: language === "az" ? "Əlaqə" : language === "tr" ? "İletişim" : "Contact" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-slate-500 hover:text-sky-600 transition-colors"
                    style={{ textDecoration: "none" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-4 text-sm">
              {language === "az" ? "Xidmətlər" : language === "tr" ? "Hizmetler" : "Services"}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>{language === "az" ? "🇹🇷 Türkiyə Turları" : language === "tr" ? "🇹🇷 Türkiye Turları" : "🇹🇷 Turkey Tours"}</li>
              <li>{language === "az" ? "🇦🇪 Dubay & BƏƏ" : language === "tr" ? "🇦🇪 Dubai & BAE" : "🇦🇪 Dubai & UAE"}</li>
              <li>{language === "az" ? "🇪🇬 Misir Turları" : language === "tr" ? "🇪🇬 Mısır Turları" : "🇪🇬 Egypt Tours"}</li>
              <li>{language === "az" ? "🇪🇺 Avropa Turları" : language === "tr" ? "🇪🇺 Avrupa Turları" : "🇪🇺 Europe Tours"}</li>
              <li>{language === "az" ? "🧳 Fərdi Planlama" : language === "tr" ? "🧳 Kişisel Planlama" : "🧳 Custom Planning"}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-4 text-sm">
              {language === "az" ? "Əlaqə" : language === "tr" ? "İletişim" : "Contact Us"}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>{language === "az" ? "📍 Bakı, Azərbaycan" : language === "tr" ? "📍 Bakü, Azerbaycan" : "📍 Baku, Azerbaijan"}</li>
              <li>
                <a href="tel:+447828721748"
                  className="hover:text-sky-600 transition-colors"
                  style={{ textDecoration: "none", color: "inherit" }}>
                  📞 +44 7828 721748
                </a>
              </li>
              <li>
                <a href="mailto:info@natourefly.com"
                  className="hover:text-sky-600 transition-colors"
                  style={{ textDecoration: "none", color: "inherit" }}>
                  ✉️ info@natourefly.com
                </a>
              </li>
              <li>
                {language === "az"
                  ? "🕐 B.e – Ş: 09:00 – 18:00"
                  : language === "tr"
                  ? "🕐 Pzt – Cmt: 09:00 – 18:00"
                  : "🕐 Mon - Sat: 09:00 - 18:00"}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-slate-100 text-xs text-slate-400">
          <span>
            © {new Date().getFullYear()} <span className="notranslate" translate="no">Natoure</span>. {language === "az"
              ? "Bütün hüquqlar qorunur."
              : language === "tr"
              ? "Tüm hakları saklıdır."
              : "All rights reserved."}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy"
              className="hover:text-slate-600 transition-colors"
              style={{ textDecoration: "none", color: "inherit" }}>
              {language === "az" ? "Gizlilik Siyasəti" : language === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
            </Link>
            <Link href="/terms-of-service"
              className="hover:text-slate-600 transition-colors"
              style={{ textDecoration: "none", color: "inherit" }}>
              {language === "az" ? "İstifadə Şərtləri" : language === "tr" ? "Kullanım Şartları" : "Terms of Service"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
