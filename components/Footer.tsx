import Link from "next/link";

export default function Footer() {
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
              <span className="font-bold text-lg bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Natoure
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              AI ilə gücləndirilen növbəti nəsil turizm platforması. Bakıdan dünyaya.
            </p>
            <div className="flex items-center gap-2">
              <a href="https://www.facebook.com/profile.php?id=61563875994345"
                target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition"
                style={{ background: "#1877F2" }}>f</a>
              <a href="https://wa.me/994517769632"
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
            <h4 className="font-semibold text-slate-700 mb-4 text-sm">Keçidlər</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/",           label: "Ana Səhifə" },
                { href: "/turlar",     label: "Turlar" },
                { href: "/oteller",    label: "Otellər" },
                { href: "/haqqimizda", label: "Haqqımızda" },
                { href: "/elaqe",      label: "Əlaqə" },
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
            <h4 className="font-semibold text-slate-700 mb-4 text-sm">Xidmətlər</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>🇹🇷 Türkiyə Turları</li>
              <li>🇦🇪 Dubai & BƏƏ</li>
              <li>🇪🇬 Misir Turları</li>
              <li>🇪🇺 Avropa Turları</li>
              <li>🧳 Fərdi Planlama</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-4 text-sm">Əlaqə</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>📍 Bakı, Azərbaycan</li>
              <li>
                <a href="tel:+994517769632"
                  className="hover:text-sky-600 transition-colors"
                  style={{ textDecoration: "none", color: "inherit" }}>
                  📞 +994 51 776 96 32
                </a>
              </li>
              <li>
                <a href="mailto:info@natourefly.com"
                  className="hover:text-sky-600 transition-colors"
                  style={{ textDecoration: "none", color: "inherit" }}>
                  ✉️ info@natourefly.com
                </a>
              </li>
              <li>🕐 B.e – Ş: 09:00 – 18:00</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-slate-100 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Natoure. Bütün hüquqlar qorunur.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy"
              className="hover:text-slate-600 transition-colors"
              style={{ textDecoration: "none", color: "inherit" }}>
              Gizlilik Siyasəti
            </Link>
            <Link href="/terms-of-service"
              className="hover:text-slate-600 transition-colors"
              style={{ textDecoration: "none", color: "inherit" }}>
              İstifadə Şərtləri
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
