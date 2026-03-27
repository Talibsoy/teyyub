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
      await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setSent(true);
    } catch { setSent(true); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 py-12 md:py-16 text-center" style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Əlaqə</h1>
        <p className="text-sm" style={{ color: "#666" }}>Suallarınız üçün bizimlə əlaqə saxlayın. Pulsuz məsləhət veririk.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

        {/* Contact Info */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Bizimlə Əlaqə</h2>
          <div className="space-y-5">
            {[
              { icon: "📍", title: "Ünvan",         lines: ["Bakı, Azərbaycan"] },
              { icon: "📞", title: "Telefon / WhatsApp", lines: ["+994 51 776 96 32"] },
              { icon: "✉️", title: "Email",          lines: ["info@natourefly.com"] },
              { icon: "🕐", title: "İş Saatları",   lines: ["B.e – Şənbə: 09:00 – 18:00"] },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white mb-0.5">{item.title}</div>
                  {item.lines.map((line) => <div key={line} className="text-sm" style={{ color: "#aaa" }}>{line}</div>)}
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <a href={waLink()} target="_blank" rel="noopener noreferrer"
            className="mt-8 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl hover:opacity-90 transition-opacity text-sm font-bold"
            style={{ background: "#25D366", color: "#fff" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp-da Yazın
          </a>

          {/* Socials */}
          <div className="mt-6">
            <p className="text-xs mb-3" style={{ color: "#555" }}>Sosial Media</p>
            <div className="flex gap-2">
              {[
                { label: "Instagram", href: "https://instagram.com/natoure.fly", bg: "#E1306C" },
                { label: "Facebook",  href: "https://www.facebook.com/profile.php?id=61563875994345", bg: "#1877F2" },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity text-white"
                  style={{ background: s.bg }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-5 md:p-6" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
          {sent ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-bold text-white mb-2">Müraciətiniz Göndərildi!</h3>
              <p className="text-sm mb-5" style={{ color: "#666" }}>24 saat ərzində sizinlə əlaqə saxlayacağıq.</p>
              <button onClick={() => { setSent(false); setForm({ ad: "", telefon: "", email: "", tur: "", mesaj: "" }); }}
                className="text-sm underline" style={{ color: "#D4AF37" }}>
                Yeni müraciət göndər
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Rezervasiya / Müraciət</h2>
              <p className="text-xs mb-5" style={{ color: "#666" }}>Aşağıdakı formu doldurun, ən qısa zamanda cavab verəcəyik.</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "#555" }}>Ad Soyad *</label>
                    <input required value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: "#1a1a1a", border: "1px solid #222" }}
                      placeholder="Adınızı daxil edin" />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "#555" }}>Telefon *</label>
                    <input required value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                      className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: "#1a1a1a", border: "1px solid #222" }}
                      placeholder="+994 xx xxx xx xx" />
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "#555" }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: "#1a1a1a", border: "1px solid #222" }}
                    placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "#555" }}>Maraqlandığınız Tur</label>
                  <select value={form.tur} onChange={(e) => setForm({ ...form, tur: e.target.value })}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                    <option value="">İstiqamət seçin</option>
                    <option value="turkiye">🇹🇷 Türkiyə</option>
                    <option value="ereb">🇦🇪 Ərəb Ölkələri</option>
                    <option value="misir">🇪🇬 Misir</option>
                    <option value="avropa">🇪🇺 Avropa</option>
                    <option value="ferdi">🧳 Fərdi Tur</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "#555" }}>Mesaj</label>
                  <textarea rows={3} value={form.mesaj} onChange={(e) => setForm({ ...form, mesaj: e.target.value })}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none resize-none"
                    style={{ background: "#1a1a1a", border: "1px solid #222" }}
                    placeholder="Sualınızı yazın..." />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: "#D4AF37", color: "#000" }}>
                  {loading ? "Göndərilir..." : "Müraciət Göndər ✈"}
                </button>
                <p className="text-xs text-center" style={{ color: "#555" }}>Məlumatlarınız gizli saxlanılır</p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
