import Link from "next/link";
import { Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "#0f172a", color: "white" }} className="pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #0284c7, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Globe size={18} color="white" />
              </div>
              <span className="font-bold text-lg">Natoure</span>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#94a3b8" }}>
              AI ilə gücləndirilen növbəti nəsil turizm platforması.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=61563875994345" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "#1877F2" }}>f</a>
              <a href="https://wa.me/994517769632" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs transition-opacity hover:opacity-80"
                style={{ background: "#25D366" }}>WA</a>
              <a href="https://instagram.com/natoure.fly" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs transition-opacity hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #bc1888)" }}>IG</a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Keçidlər</h4>
            <ul className="space-y-3 text-sm" style={{ color: "#64748b" }}>
              {[
                { href: "/", label: "Ana Səhifə" },
                { href: "/turlar", label: "Turlar" },
                { href: "/haqqimizda", label: "Haqqımızda" },
                { href: "/elaqe", label: "Əlaqə" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-slate-300" style={{ textDecoration: "none", color: "inherit" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Xidmətlər</h4>
            <ul className="space-y-3 text-sm" style={{ color: "#64748b" }}>
              <li>🇹🇷 Türkiyə Turları</li>
              <li>🇦🇪 Dubai & Ərəbistan</li>
              <li>🇪🇬 Misir Turları</li>
              <li>🇪🇺 Avropa Turları</li>
              <li>🧳 Fərdi Planlama</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Əlaqə</h4>
            <ul className="space-y-3 text-sm" style={{ color: "#64748b" }}>
              <li>📍 Bakı, Azərbaycan</li>
              <li>
                <a href="tel:+994517769632" className="transition-colors hover:text-slate-300" style={{ textDecoration: "none", color: "inherit" }}>
                  📞 +994 51 776 96 32
                </a>
              </li>
              <li>
                <a href="mailto:info@natourefly.com" className="transition-colors hover:text-slate-300" style={{ textDecoration: "none", color: "inherit" }}>
                  ✉️ info@natourefly.com
                </a>
              </li>
              <li>🕐 B.e – Ş: 09:00 – 18:00</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#475569" }}>
          <span>© {new Date().getFullYear()} Natoure. Bütün hüquqlar qorunur.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors" style={{ textDecoration: "none", color: "inherit" }}>Gizlilik Siyasəti</Link>
            <Link href="/terms-of-service" className="hover:text-slate-400 transition-colors" style={{ textDecoration: "none", color: "inherit" }}>İstifadə Şərtləri</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
