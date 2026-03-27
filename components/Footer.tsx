import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{ background: "#0b0b0b", borderTop: "1px solid #1a1a1a" }} className="text-[#aaa] pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/logo.png" alt="Natoure" width={32} height={32} className="object-contain" />
            <h3 className="text-white font-bold text-lg">Natoure</h3>
          </div>
          <p className="text-sm leading-relaxed mb-4">
            AI + avtomatlaşdırma üzərində qurulmuş müasir turizm platforması.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com/profile.php?id=61563875994345" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity text-white text-sm font-bold"
              style={{ background: "#1877F2" }}>f</a>
            <a href="https://wa.me/994517769632" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity text-white text-xs"
              style={{ background: "#25D366" }}>WA</a>
            <a href="https://instagram.com/natoure.fly" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity text-white text-xs"
              style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #bc1888)" }}>IG</a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Keçidlər</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-[#00c2ff] transition-colors">Ana Səhifə</Link></li>
            <li><Link href="/turlar" className="hover:text-[#00c2ff] transition-colors">Turlar</Link></li>
            <li><Link href="/haqqimizda" className="hover:text-[#00c2ff] transition-colors">Haqqımızda</Link></li>
            <li><Link href="/elaqe" className="hover:text-[#00c2ff] transition-colors">Əlaqə</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Xidmətlər</h4>
          <ul className="space-y-2 text-sm">
            <li>🇹🇷 Türkiyə Turları</li>
            <li>🇦🇪 Dubai & Ərəbistan</li>
            <li>🇪🇬 Misir Turları</li>
            <li>🇪🇺 Avropa Turları</li>
            <li>🧳 Fərdi Planlama</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Əlaqə</h4>
          <ul className="space-y-2 text-sm">
            <li>📍 Bakı, Azərbaycan</li>
            <li>
              <a href="tel:+994517769632" className="hover:text-[#00c2ff] transition-colors">
                📞 +994 51 776 96 32
              </a>
            </li>
            <li>
              <a href="mailto:info@natourefly.com" className="hover:text-[#00c2ff] transition-colors">
                ✉️ info@natourefly.com
              </a>
            </li>
            <li>🕐 B.e – Ş: 09:00 – 18:00</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs" style={{ borderTop: "1px solid #1a1a1a" }}>
        <span>© {new Date().getFullYear()} Natoure. Bütün hüquqlar qorunur.</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Gizlilik Siyasəti</Link>
          <Link href="/terms-of-service" className="hover:text-white transition-colors">İstifadə Şərtləri</Link>
        </div>
      </div>
    </footer>
  );
}
