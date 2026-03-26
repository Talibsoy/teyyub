import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Siyasəti | FlyNaToure",
  description: "FlyNaToure turizm şirkətinin gizlilik siyasəti və şəxsi məlumatların qorunması haqqında məlumat.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0057A8] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-blue-200 mb-2">
            <Link href="/" className="hover:underline">Ana Səhifə</Link> › Gizlilik Siyasəti
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">Gizlilik Siyasəti</h1>
          <p className="mt-3 text-blue-100 text-sm">Son yenilənmə: 1 Yanvar 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 text-gray-700 leading-relaxed space-y-10 text-[15px]">

        <section>
          <p>
            FlyNaToure (bundan sonra &quot;Şirkət&quot;, &quot;biz&quot; və ya &quot;bizim&quot;) olaraq,
            <strong> natourefly.com</strong> saytını ziyarət edən və xidmətlərimizdən istifadə edən
            müştərilərimizin (bundan sonra &quot;Siz&quot;) şəxsi məlumatlarının qorunmasına ciddi əhəmiyyət
            veririk. Bu Gizlilik Siyasəti hansı məlumatları topladığımızı, bunları necə istifadə
            etdiyimizi və hüquqlarınızı izah edir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Topladığımız Məlumatlar</h2>
          <p className="mb-3">Sizdən aşağıdakı məlumatları toplaya bilərik:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Şəxsiyyət məlumatları:</strong> Ad, soyad, doğum tarixi, pasport məlumatları (rezervasiya üçün tələb olunduqda).</li>
            <li><strong>Əlaqə məlumatları:</strong> Telefon nömrəsi, e-poçt ünvanı.</li>
            <li><strong>Ödəniş məlumatları:</strong> Kart nömrəsi və ya bank köçürmə məlumatları (şifrələnmiş formada işlənir, saxlanılmır).</li>
            <li><strong>Ünsiyyət məlumatları:</strong> Messenger, WhatsApp və ya e-poçt vasitəsilə bizimlə apardığınız yazışmalar.</li>
            <li><strong>Texniki məlumatlar:</strong> IP ünvanı, brauzer növü, saytımızda ziyarət etdiyiniz səhifələr (analitika məqsədilə).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Məlumatların İstifadəsi</h2>
          <p className="mb-3">Topladığımız məlumatları aşağıdakı məqsədlər üçün istifadə edirik:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Rezervasiya və tur xidmətlərini yerinə yetirmək.</li>
            <li>Bilet, otel, viza və sığorta tərtibi üçün tərəfdaş şirkətlərə ötürmək.</li>
            <li>Ödəniş əməliyyatlarını emal etmək.</li>
            <li>Müştəri dəstəyi göstərmək və suallarınıza cavab vermək.</li>
            <li>Xidmətlərimizi, kampaniyalarımızı və xüsusi təkliflərimizi sizinlə paylaşmaq (razılıq verdiyiniz halda).</li>
            <li>Yasal öhdəliklərimizi yerinə yetirmək.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Məlumatların Paylaşılması</h2>
          <p className="mb-3">
            Şəxsi məlumatlarınızı üçüncü tərəflərə <strong>satmırıq</strong>. Aşağıdakı hallarda məlumatlarınız paylaşıla bilər:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Xidmət tərəfdaşları:</strong> Otel, aviasiya, transfer şirkətləri — yalnız rezervasiya emalı üçün.</li>
            <li><strong>Ödəniş sistemləri:</strong> Payriff, bank — ödənişin təhlükəsiz emalı üçün.</li>
            <li><strong>Texniki xidmətçilər:</strong> Hosting, e-poçt, analitika xidmətləri (gizlilik müqaviləsi ilə bağlı).</li>
            <li><strong>Dövlət orqanları:</strong> Qanunun tələb etdiyi hallarda (məhkəmə qərarı, vergi orqanları).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Məlumatların Saxlanması</h2>
          <p>
            Şəxsi məlumatlarınız xidmətin göstərilməsi üçün zəruri olan müddət boyunca saxlanılır.
            Mühasibat və hüquqi öhdəliklər üçün bu müddət 5 ilə qədər ola bilər. Artıq zəruri
            olmayan məlumatlar təhlükəsiz şəkildə silinir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Sosial Media Platformaları</h2>
          <p className="mb-3">
            Facebook Messenger, Instagram Direct və WhatsApp vasitəsilə bizimlə əlaqə saxladığınızda:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Yazışmalar müvafiq platformaların gizlilik siyasətinə tabedir (Meta, WhatsApp Inc.).</li>
            <li>Süni intellekt sistemimiz (AI) cavab vermək üçün mesajları emal edir; söhbət tarixi şifrəli şəkildə saxlanılır.</li>
            <li>Platforma ilə əlaqəni kəsdikdə bizdəki söhbət tarixçənizi silməyi tələb edə bilərsiniz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Uşaqların Gizliliyi</h2>
          <p>
            Xidmətlərimiz 18 yaşdan yuxarı şəxslərə yönəlibdir. 18 yaşdan kiçik şəxslərdən
            bilərəkdən şəxsi məlumat toplamırıq. Uşağınıza aid məlumatın bizdə olduğunu
            düşünürsünüzsə, bizimlə əlaqə saxlayın.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Hüquqlarınız</h2>
          <p className="mb-3">Azərbaycan Respublikasının &quot;Fərdi məlumatlar haqqında&quot; Qanununa əsasən aşağıdakı hüquqlara maliksiniz:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Haqqınızda hansı məlumatların saxlandığını öyrənmək.</li>
            <li>Yanlış məlumatların düzəldilməsini tələb etmək.</li>
            <li>Məlumatlarınızın silinməsini tələb etmək (&quot;unutulma hüququ&quot;).</li>
            <li>Marketinq kommunikasiyalarından imtina etmək.</li>
            <li>Məlumatlarınızın işlənməsinə etiraz etmək.</li>
          </ul>
          <p className="mt-3">
            Bu hüquqlardan istifadə etmək üçün{" "}
            <a href="mailto:info@natourefly.com" className="text-[#0057A8] underline">
              info@natourefly.com
            </a>{" "}
            ünvanına yazın. 30 iş günü ərzində cavab veriləcəkdir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Çərəzlər (Cookies)</h2>
          <p>
            Saytımız sessiyanın idarəsi üçün zəruri çərəzlərdən istifadə edir. Analitika
            çərəzlərini brauzerinizin parametrlərindən söndürə bilərsiniz. Çərəzləri
            söndürmək saytın bəzi funksiyalarına təsir edə bilər.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Siyasətin Dəyişdirilməsi</h2>
          <p>
            Bu Gizlilik Siyasəti zəruri hallarda yenilənə bilər. Əhəmiyyətli dəyişikliklər
            olduqda sizi e-poçt vasitəsilə məlumatlandıracağıq. Dəyişikliklər saytda
            dərc edildikdən sonra qüvvəyə minir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Bizimlə Əlaqə</h2>
          <div className="bg-gray-50 rounded-xl p-6 space-y-2 text-sm">
            <p><strong>FlyNaToure Turizm MMC</strong></p>
            <p>📍 Bakı şəhəri, Azərbaycan</p>
            <p>📞 <a href="tel:+994517769632" className="text-[#0057A8] hover:underline">+994 51 776 96 32</a></p>
            <p>✉️ <a href="mailto:info@natourefly.com" className="text-[#0057A8] hover:underline">info@natourefly.com</a></p>
            <p>🌐 <a href="https://natourefly.com" className="text-[#0057A8] hover:underline">natourefly.com</a></p>
          </div>
        </section>

      </div>
    </main>
  );
}
