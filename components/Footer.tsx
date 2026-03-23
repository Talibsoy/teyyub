import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-gray-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div>
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            <span className="text-[#D4AF37]">✈</span> FlyNaToure
          </h3>
          <p className="text-sm leading-relaxed">
            Bakı mərkəzli turizm şirkəti. Türkiyə, Ərəb ölkələri və Avropa istiqamətlərində keyfiyyətli turlar.
          </p>
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

        {/* Contact */}
        <div>
          <h4 className="text-white font-semibold mb-3">Əlaqə</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">📍 Bakı, Azərbaycan</li>
            <li className="flex items-center gap-2">📞 +994 12 000 00 00</li>
            <li className="flex items-center gap-2">✉️ info@flynatoure.com</li>
            <li className="flex items-center gap-2">🕐 B.e – Ş: 09:00 – 18:00</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} FlyNaToure. Bütün hüquqlar qorunur.
      </div>
    </footer>
  );
}
