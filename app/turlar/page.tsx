"use client";
import { useState } from "react";
import Link from "next/link";

const allTours = [
  // Türkiyə
  { id: 1, name: "İstanbul Klassik", destination: "turkiye", flag: "🇹🇷", country: "Türkiyə", price: 499, duration: "4 gün / 3 gecə", includes: ["Uçuş", "Otel", "Gəzintilər"], badge: "Ən Populyar" },
  { id: 2, name: "Antalya Dəniz & Günəş", destination: "turkiye", flag: "🇹🇷", country: "Türkiyə", price: 549, duration: "7 gün / 6 gecə", includes: ["Uçuş", "5★ Otel", "Transferlər", "All Inclusive"], badge: "" },
  { id: 3, name: "Kapadokiya Balonu", destination: "turkiye", flag: "🇹🇷", country: "Türkiyə", price: 699, duration: "5 gün / 4 gecə", includes: ["Uçuş", "Otel", "Balon uçuşu", "Turlar"], badge: "Unikal" },
  { id: 4, name: "İzmir & Efes", destination: "turkiye", flag: "🇹🇷", country: "Türkiyə", price: 479, duration: "4 gün / 3 gecə", includes: ["Uçuş", "Otel", "Turlar"], badge: "" },
  // Ərəb
  { id: 5, name: "Dubai Lüks", destination: "ereb", flag: "🇦🇪", country: "BƏƏ", price: 799, duration: "6 gün / 5 gecə", includes: ["Uçuş", "5★ Otel", "Turlar", "Transfer"], badge: "Lüks" },
  { id: 6, name: "Abu Dhabi Möcüzəsi", destination: "ereb", flag: "🇦🇪", country: "BƏƏ", price: 749, duration: "5 gün / 4 gecə", includes: ["Uçuş", "Otel", "Louvre", "Transfer"], badge: "" },
  { id: 7, name: "Qahirə & Piramidalar", destination: "ereb", flag: "🇪🇬", country: "Misir", price: 649, duration: "6 gün / 5 gecə", includes: ["Uçuş", "Otel", "Bələdçi", "Turlar"], badge: "Tarixi" },
  { id: 8, name: "Şarm-əl-Şeyx Dəniz", destination: "ereb", flag: "🇪🇬", country: "Misir", price: 599, duration: "7 gün / 6 gecə", includes: ["Uçuş", "4★ Otel", "All Inclusive"], badge: "" },
  // Avropa
  { id: 9, name: "Paris Romantik", destination: "avropa", flag: "🇫🇷", country: "Fransa", price: 999, duration: "5 gün / 4 gecə", includes: ["Uçuş", "Otel", "Gəzintilər", "Sığorta"], badge: "Romantik" },
  { id: 10, name: "Roma Əbədi Şəhər", destination: "avropa", flag: "🇮🇹", country: "İtaliya", price: 899, duration: "5 gün / 4 gecə", includes: ["Uçuş", "Otel", "Turlar", "Sığorta"], badge: "" },
  { id: 11, name: "Barselona & Prag", destination: "avropa", flag: "🇪🇸", country: "İspaniya/Çexiya", price: 1199, duration: "8 gün / 7 gecə", includes: ["Uçuşlar", "Otellər", "Gəzintilər", "Sığorta"], badge: "İkili Tur" },
  { id: 12, name: "Amsterdam & Brüssel", destination: "avropa", flag: "🇳🇱", country: "Hollandiya/Belçika", price: 1099, duration: "7 gün / 6 gecə", includes: ["Uçuşlar", "Otellər", "Turlar", "Sığorta"], badge: "" },
];

const categories = [
  { id: "hamisi", label: "Hamısı" },
  { id: "turkiye", label: "🇹🇷 Türkiyə" },
  { id: "ereb", label: "🇦🇪 Ərəb Ölkələri" },
  { id: "avropa", label: "🇪🇺 Avropa" },
];

export default function TurlarPage() {
  const [active, setActive] = useState("hamisi");

  const filtered = active === "hamisi" ? allTours : allTours.filter((t) => t.destination === active);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0057A8] to-[#004a90] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Bütün Turlar</h1>
        <p className="text-blue-200 max-w-xl mx-auto">Türkiyə, Ərəb ölkələri və Avropa istiqamətlərindəki bütün tur paketlərimiz</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                active === cat.id
                  ? "bg-[#0057A8] text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#0057A8]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((tour) => (
            <div key={tour.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              {tour.badge && (
                <div className="bg-[#D4AF37] text-[#0057A8] text-xs font-bold px-3 py-1 text-center">
                  {tour.badge}
                </div>
              )}
              {!tour.badge && <div className="h-1 bg-gradient-to-r from-[#0057A8] to-[#009B77]" />}
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                  <span>{tour.flag}</span>
                  <span>{tour.country}</span>
                </div>
                <h3 className="font-bold text-[#1a1a2e] text-lg mb-1">{tour.name}</h3>
                <p className="text-sm text-gray-400 mb-4">⏱ {tour.duration}</p>
                <ul className="space-y-1 mb-5">
                  {tour.includes.map((item) => (
                    <li key={item} className="text-xs text-gray-600 flex items-center gap-1.5">
                      <span className="text-[#009B77]">✓</span> {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-xl font-bold text-[#0057A8]">{tour.price}$</span>
                    <span className="text-xs text-gray-400 ml-1">/nəfər</span>
                  </div>
                  <Link href="/elaqe" className="bg-[#0057A8] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#004a90] transition-colors">
                    Sifariş Et
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#0057A8] to-[#009B77] rounded-2xl p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">İstədiyiniz Turu Tapmadınız?</h3>
          <p className="text-blue-100 mb-6">Fərdi tur paketləri də hazırlayırıq. Bizimlə əlaqə saxlayın.</p>
          <Link href="/elaqe" className="inline-block bg-[#D4AF37] text-[#0057A8] font-bold px-8 py-3 rounded-full hover:bg-yellow-400 transition-colors">
            Fərdi Tur Sifariş Et
          </Link>
        </div>
      </div>
    </div>
  );
}
