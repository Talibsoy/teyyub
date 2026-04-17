"use client";
import { useState } from "react";
import { waLink } from "@/lib/whatsapp";

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
    } catch { setSent(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="ns-page">

      {/* Page Header */}
      <div className="ns-page-header">
        <span className="ns-label">Bizimlə Əlaqə</span>
        <h1>Əlaqə</h1>
        <p>Suallarınız üçün bizimlə əlaqə saxlayın. Pulsuz məsləhət veririk.</p>
      </div>

      <section className="ns-section-w">
        <div className="ns-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Contact Info */}
            <div>
              <h2 className="ns-title mb-7">Bizimlə Əlaqə</h2>
              <div className="space-y-5">
                {[
                  { icon: "📍", title: "Ünvan",              lines: ["Bakı, Azərbaycan"] },
                  { icon: "📞", title: "Telefon / WhatsApp", lines: ["+994 51 776 96 32"] },
                  { icon: "✉️", title: "Email",              lines: ["info@natourefly.com"] },
                  { icon: "🕐", title: "İş Saatları",        lines: ["B.e – Şənbə: 09:00 – 18:00"] },
                ].map(item => (
                  <div key={item.title} className="flex gap-4 items-start">
                    <div className="ns-card w-10 h-10 flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-0.5">{item.title}</div>
                      {item.lines.map(line => (
                        <div key={line} className="text-sm text-slate-500">{line}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <a href={waLink()} target="_blank" rel="noopener noreferrer"
                className="ns-btn ns-btn-wa mt-8 w-full justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp-da Yazın
              </a>

              {/* Socials */}
              <div className="mt-6">
                <p className="ns-label mb-3">Sosial Media</p>
                <div className="flex gap-2">
                  {[
                    { label: "Instagram", href: "https://instagram.com/natoure.fly",                              bg: "#E1306C" },
                    { label: "Facebook",  href: "https://www.facebook.com/profile.php?id=61563875994345",          bg: "#1877F2" },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold px-4 py-2 rounded-xl text-white hover:opacity-80 transition"
                      style={{ background: s.bg }}>
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="ns-card p-7">
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Müraciətiniz Göndərildi!</h3>
                  <p className="text-sm text-slate-500 mb-6">24 saat ərzində sizinlə əlaqə saxlayacağıq.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ ad: "", telefon: "", email: "", tur: "", mesaj: "" }); }}
                    className="text-sm font-semibold text-sky-600 hover:underline">
                    Yeni müraciət göndər
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-bold text-slate-800 text-lg mb-1">Rezervasiya / Müraciət</h2>
                  <p className="text-xs text-slate-500 mb-6">Formu doldurun, ən qısa zamanda cavab verəcəyik.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="ns-label-field">Ad Soyad *</label>
                        <input required value={form.ad}
                          onChange={e => setForm({ ...form, ad: e.target.value })}
                          className="ns-input" placeholder="Adınızı daxil edin" />
                      </div>
                      <div>
                        <label className="ns-label-field">Telefon *</label>
                        <input required value={form.telefon}
                          onChange={e => setForm({ ...form, telefon: e.target.value })}
                          className="ns-input" placeholder="+994 xx xxx xx xx" />
                      </div>
                    </div>
                    <div>
                      <label className="ns-label-field">Email</label>
                      <input type="email" value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="ns-input" placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="ns-label-field">Maraqlandığınız Tur</label>
                      <select value={form.tur}
                        onChange={e => setForm({ ...form, tur: e.target.value })}
                        className="ns-input cursor-pointer">
                        <option value="">İstiqamət seçin</option>
                        <option value="turkiye">🇹🇷 Türkiyə</option>
                        <option value="ereb">🇦🇪 Dubai / BƏƏ</option>
                        <option value="misir">🇪🇬 Misir</option>
                        <option value="avropa">🇪🇺 Avropa</option>
                        <option value="ferdi">🧳 Fərdi Tur</option>
                      </select>
                    </div>
                    <div>
                      <label className="ns-label-field">Mesaj</label>
                      <textarea rows={3} value={form.mesaj}
                        onChange={e => setForm({ ...form, mesaj: e.target.value })}
                        className="ns-input resize-none" placeholder="Sualınızı yazın..." />
                    </div>
                    <button type="submit" disabled={loading}
                      className="ns-btn ns-btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? "Göndərilir..." : "Müraciət Göndər ✈"}
                    </button>
                    <p className="text-xs text-center text-slate-400">Məlumatlarınız gizli saxlanılır</p>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
