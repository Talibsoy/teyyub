import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-gray-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-[#D4AF37]">✈</span> FlyNaToure
          </h3>
          <p className="text-sm leading-relaxed mb-4">
            Bakı mərkəzli turizm şirkəti. 2018-ci ildən Türkiyə, Ərəb ölkələri və Avropa istiqamətlərində keyfiyyətli turlar.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com/profile.php?id=61563875994345" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity text-white text-sm font-bold">
              f
            </a>
            <a href="https://wa.me/994517769632" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center hover:opacity-80 transition-opacity text-white text-xs">
              WA
            </a>
            <a href="https://instagram.com/natoure.fly" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center hover:opacity-80 transition-opacity text-white text-xs">
              IG
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Keçidlər</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-[#D4AF37] transition-colors">Ana Səhifə</Link></li>
            <li><Link href="/turlar" className="hover:text-[#D4AF37] transition-colors">Turlar</Link></li>
            <li><Link href="/haqqimizda" className="hover:text-[#D4AF37] transition-colors">Haqqımızda</Link></li>
            <li><Link href="/elaqe" className="hover:text-[#D4AF37] transition-colors">Əlaqə</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-white font-semibold mb-3">Xidmətlər</h4>
          <ul className="space-y-2 text-sm">
            <li className="text-gray-400">🇹🇷 Türkiyə Turları</li>
            <li className="text-gray-400">🇦🇪 Dubai & Ərəbistan</li>
            <li className="text-gray-400">🇪🇺 Avropa Turları</li>
            <li className="text-gray-400">✈️ Viza Dəstəyi</li>
            <li className="text-gray-400">🏥 Tibbi Sığorta</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-3">Əlaqə</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">📍 Bakı, Azərbaycan</li>
            <li>
              <a href="tel:+994517769632" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
                📞 +994 51 776 96 32
              </a>
            </li>
            <li>
              <a href="mailto:info@natourefly.com" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
                ✉️ info@natourefly.com
              </a>
            </li>
            <li className="flex items-center gap-2">🕐 B.e – Ş: 09:00 – 18:00</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 border-t border-gray-700 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <span>© {new Date().getFullYear()} FlyNaToure. Bütün hüquqlar qorunur.</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy-policy" className="hover:text-gray-300 transition-colors">Gizlilik Siyasəti</Link>
          <Link href="/elaqe" className="hover:text-gray-300 transition-colors">Əlaqə</Link>
        </div>
      </div>
    </footer>
  );
}
