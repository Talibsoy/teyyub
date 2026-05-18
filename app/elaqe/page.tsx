"use client";
import { useState } from "react";
import { waLink } from "@/lib/whatsapp";
import { MapPin, Phone, Mail, Clock, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function ElaqePage() {
  const { language } = useLanguage();
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

  const contactItems = [
    {
      Icon: MapPin,
      title: language === "az" ? "Ünvan" : language === "tr" ? "Adres" : "Address",
      lines: [language === "az" ? "Bakı, Azərbaycan" : language === "tr" ? "Bakü, Azerbaycan" : "Baku, Azerbaijan"]
    },
    {
      Icon: Phone,
      title: language === "az" ? "Telefon / WhatsApp" : language === "tr" ? "Telefon / WhatsApp" : "Phone / WhatsApp",
      lines: ["+994 51 776 96 32"]
    },
    {
      Icon: Mail,
      title: language === "az" ? "Email" : language === "tr" ? "E-posta" : "Email",
      lines: ["info@natourefly.com"]
    },
    {
      Icon: Clock,
      title: language === "az" ? "İş Saatları" : language === "tr" ? "Çalışma Saatleri" : "Working Hours",
      lines: [language === "az" ? "B.e – Şənbə: 09:00 – 18:00" : language === "tr" ? "Pzt – Cmt: 09:00 – 18:00" : "Mon - Sat: 09:00 - 18:00"]
    },
  ];

  return (
    <div className="ns-page">

      {/* Page Header */}
      <div className="ns-page-header">
        <span className="ns-label">
          {language === "az" ? "Bizimlə Əlaqə" : language === "tr" ? "Bizimle İletişime Geçin" : "Contact Us"}
        </span>
        <h1>{language === "az" ? "Əlaqə" : language === "tr" ? "İletişim" : "Contact"}</h1>
        <p>
          {language === "az"
            ? "Suallarınız üçün bizimlə əlaqə saxlayın. Pulsuz məsləhət veririk."
            : language === "tr"
            ? "Sorularınız için bizimle iletişime geçin. Ücretsiz danışmanlık veriyoruz."
            : "Contact us for any questions. We offer free travel consultation."}
        </p>
      </div>

      <section className="ns-section-w">
        <div className="ns-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Contact Info */}
            <div>
              <h2 className="ns-title mb-7">
                {language === "az" ? "Bizimlə Əlaqə" : language === "tr" ? "Bizimle İletişime Geçin" : "Contact Us"}
              </h2>
              <div className="space-y-5">
                {contactItems.map(item => (
                  <div key={item.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <item.Icon size={18} className="text-sky-600" />
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
                {language === "az" ? "WhatsApp-da Yazın" : language === "tr" ? "WhatsApp'tan Yazın" : "Chat on WhatsApp"}
              </a>

              {/* Socials */}
              <div className="mt-6">
                <p className="ns-label mb-3">
                  {language === "az" ? "Sosial Media" : language === "tr" ? "Sosyal Medya" : "Social Media"}
                </p>
                <div className="flex gap-2">
                  {[
                    { label: "Instagram", href: "https://instagram.com/natoure.fly",                             bg: "#E1306C" },
                    { label: "Facebook",  href: "https://www.facebook.com/profile.php?id=61563875994345",         bg: "#1877F2" },
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
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    {language === "az" ? "Müraciətiniz Göndərildi!" : language === "tr" ? "Talebiniz Gönderildi!" : "Your Request Has Been Sent!"}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {language === "az"
                      ? "24 saat ərzində sizinlə əlaqə saxlayacağıq."
                      : language === "tr"
                      ? "24 saat içinde sizinle iletişime geçeceğiz."
                      : "We will contact you within 24 hours."}
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ ad: "", telefon: "", email: "", tur: "", mesaj: "" }); }}
                    className="text-sm font-semibold text-sky-600 hover:underline">
                    {language === "az" ? "Yeni müraciət göndər" : language === "tr" ? "Yeni talep gönder" : "Send a new request"}
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-bold text-slate-800 text-lg mb-1">
                    {language === "az" ? "Rezervasiya / Müraciət" : language === "tr" ? "Rezervasyon / İletişim" : "Booking / Request"}
                  </h2>
                  <p className="text-xs text-slate-500 mb-6">
                    {language === "az"
                      ? "Formu doldurun, ən qısa zamanda cavab verəcəyik."
                      : language === "tr"
                      ? "Formu doldurun, en kısa sürede geri döneceğiz."
                      : "Fill in the form, we will get back to you as soon as possible."}
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="ns-label-field">
                          {language === "az" ? "Ad Soyad *" : language === "tr" ? "Ad Soyad *" : "Full Name *"}
                        </label>
                        <input required value={form.ad}
                          onChange={e => setForm({ ...form, ad: e.target.value })}
                          className="ns-input"
                          placeholder={language === "az" ? "Adınızı daxil edin" : language === "tr" ? "Adınızı girin" : "Enter your full name"} />
                      </div>
                      <div>
                        <label className="ns-label-field">
                          {language === "az" ? "Telefon *" : language === "tr" ? "Telefon *" : "Phone *"}
                        </label>
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
                      <label className="ns-label-field">
                        {language === "az" ? "Maraqlandığınız Tur" : language === "tr" ? "İlgilendiğiniz Tur" : "Interested Tour"}
                      </label>
                      <select value={form.tur}
                        onChange={e => setForm({ ...form, tur: e.target.value })}
                        className="ns-input cursor-pointer">
                        <option value="">
                          {language === "az" ? "İstiqamət seçin" : language === "tr" ? "Bölge seçin" : "Select destination"}
                        </option>
                        <option value="turkiye">{language === "az" ? "Türkiyə" : language === "tr" ? "Türkiye" : "Turkey"}</option>
                        <option value="ereb">{language === "az" ? "Dubai / BƏƏ" : language === "tr" ? "Dubai / BAE" : "Dubai / UAE"}</option>
                        <option value="misir">{language === "az" ? "Misir" : language === "tr" ? "Mısır" : "Egypt"}</option>
                        <option value="avropa">{language === "az" ? "Avropa" : language === "tr" ? "Avrupa" : "Europe"}</option>
                        <option value="ferdi">{language === "az" ? "Fərdi Tur" : language === "tr" ? "Kişisel Tur" : "Custom Tour"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="ns-label-field">{language === "az" ? "Mesaj" : language === "tr" ? "Mesaj" : "Message"}</label>
                      <textarea rows={3} value={form.mesaj}
                        onChange={e => setForm({ ...form, mesaj: e.target.value })}
                        className="ns-input resize-none"
                        placeholder={language === "az" ? "Sualınızı yazın..." : language === "tr" ? "Sorunuzu yazın..." : "Write your question..."} />
                    </div>
                    <button type="submit" disabled={loading}
                      className="ns-btn ns-btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading
                        ? (language === "az" ? "Göndərilir..." : language === "tr" ? "Gönderiliyor..." : "Sending...")
                        : (language === "az" ? "Müraciət Göndər" : language === "tr" ? "Talebi Gönder" : "Submit Request")}
                    </button>
                    <p className="text-xs text-center text-slate-400">
                      {language === "az"
                        ? "Məlumatlarınız gizli saxlanılır"
                        : language === "tr"
                        ? "Bilgileriniz gizli tutulmaktadır"
                        : "Your information is kept private"}
                    </p>
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
