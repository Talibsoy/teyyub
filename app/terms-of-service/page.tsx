import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İstifadə Şərtləri | FlyNaToure",
  description: "FlyNaToure turizm platformasının istifadə şərtləri və qaydaları.",
};

export default function TermsOfServicePage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#1a1a2e] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-400 mb-2">
            <Link href="/" className="hover:underline">Ana Səhifə</Link> › İstifadə Şərtləri
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">İstifadə Şərtləri</h1>
          <p className="mt-3 text-gray-400 text-sm">Son yenilənmə: 27 Mart 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 text-gray-700 leading-relaxed space-y-10 text-[15px]">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Razılaşmanın Qəbulu</h2>
          <p>
            FlyNaToure (natourefly.com) platformasından istifadə etməklə Siz bu İstifadə Şərtlərini qəbul etmiş olursunuz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Xidmətlərin Təsviri</h2>
          <p>
            Şirkətimiz turlar, viza dəstəyi, sığorta və əlaqəli turizm xidmətlərini təmin edir. Bütün xidmətlər mövcudluq və tərəfdaşlarımızın şərtlərinə tabedir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Süni İntellekt (AI) və Avtomatlaşdırma</h2>
          <p>
            Platformamız müştəri xidmətlərini yaxşılaşdırmaq üçün süni intellekt (AI) və avtomatlaşdırılmış botlardan istifadə edir.
            Messenger, Instagram və WhatsApp üzərindən gələn sorğular avtomatik emal edilə bilər.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Bizimlə Əlaqə</h2>
          <p>
            Hər hansı bir sualınız yaranarsa, <a href="mailto:info@natourefly.com" className="text-[#0057A8] underline">info@natourefly.com</a> vasitəsilə bizə yaza bilərsiniz.
          </p>
        </section>
      </div>
    </main>
  );
}
