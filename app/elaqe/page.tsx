"use client";
import { useState } from "react";

export default function ElaqePage() {
  const [form, setForm] = useState({ ad: "", telefon: "", email: "", tur: "", mesaj: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {
      // Xəta olsa da təşəkkür göstər
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0057A8] to-[#004a90] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Əlaqə</h1>
        <p className="text-blue-200 max-w-xl mx-auto">Suallarınız üçün bizimlə əlaqə saxlayın. Pulsuz məsləhət veririk.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-8">Bizimlə Əlaqə</h2>

          <div className="space-y-6">
            {[
              { icon: "📍", title: "Ünvan", lines: ["Bakı şəhəri, Nizami küçəsi 10", "Azərbaycan"] },
              { icon: "📞", title: "Telefon / WhatsApp", lines: ["+994 51 776 96 32"] },
              { icon: "✉️", title: "Email", lines: ["info@natourefly.com"] },
              { icon: "🕐", title: "İş Saatları", lines: ["Bazar ertəsi – Şənbə: 09:00 – 18:00", "Bazar: Qapalı"] },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#0057A8]/10 rounded-full flex items-center justify-center text-lg">
                  {item.icon}
                </div>
                <div>
                  <div className="font-semibold text-[#1a1a2e] text-sm mb-1">{item.title}</div>
                  {item.lines.map((line) => (
                    <div key={line} className="text-sm text-gray-500">{line}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Social */}
          <div className="mt-10">
            <h3 className="font-semibold text-[#1a1a2e] mb-4 text-sm">Sosial Media</h3>
            <div className="flex gap-3">
              {[
                { label: "Instagram", href: "https://instagram.com/natoure.fly" },
                { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61563875994345" },
                { label: "WhatsApp", href: "https://wa.me/994517769632" },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-gray-100 hover:bg-[#0057A8] hover:text-white px-3 py-1.5 rounded-full transition-colors text-gray-600">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-10 bg-gradient-to-br from-[#0057A8]/10 to-[#009B77]/10 rounded-2xl h-48 flex items-center justify-center border border-[#0057A8]/20">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📍</div>
              <div className="text-sm">Bakı, Nizami küçəsi 10</div>
              <div className="text-xs mt-1 text-[#0057A8]">Xəritədə aç →</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {sent ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">Müraciətiniz Göndərildi!</h3>
              <p className="text-gray-500 text-sm">24 saat ərzində sizinlə əlaqə saxlayacağıq.</p>
              <button
                onClick={() => { setSent(false); setForm({ ad: "", telefon: "", email: "", tur: "", mesaj: "" }); }}
                className="mt-6 text-[#0057A8] text-sm underline"
              >
                Yeni müraciət göndər
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Rezervasiya / Müraciət</h2>
              <p className="text-sm text-gray-400 mb-6">Aşağıdakı formu doldurun, ən qısa zamanda cavab verəcəyik.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad *</label>
                    <input
                      required
                      value={form.ad}
                      onChange={(e) => setForm({ ...form, ad: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057A8] transition-colors"
                      placeholder="Adınızı daxil edin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Telefon *</label>
                    <input
                      required
                      value={form.telefon}
                      onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057A8] transition-colors"
                      placeholder="+994 xx xxx xx xx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057A8] transition-colors"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Maraqlandığınız Tur</label>
                  <select
                    value={form.tur}
                    onChange={(e) => setForm({ ...form, tur: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057A8] transition-colors bg-white"
                  >
                    <option value="">İstiqamət seçin</option>
                    <option value="turkiye">🇹🇷 Türkiyə</option>
                    <option value="ereb">🇦🇪 Ərəb Ölkələri</option>
                    <option value="avropa">🇪🇺 Avropa</option>
                    <option value="ferdi">Fərdi Tur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mesaj</label>
                  <textarea
                    rows={4}
                    value={form.mesaj}
                    onChange={(e) => setForm({ ...form, mesaj: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0057A8] transition-colors resize-none"
                    placeholder="Sualınızı və ya xüsusi tələblərinizi yazın..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0057A8] text-white font-bold py-3 rounded-full hover:bg-[#004a90] transition-colors"
                >
                  Müraciət Göndər ✈
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Məlumatlarınız gizli saxlanılır və 3-cü şəxslərə verilmir.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
