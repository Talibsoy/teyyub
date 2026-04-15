/**
 * GET /api/admin/knowledge/seed
 * İlkin biliklər — FAQ, destinasiyalar, şirkət məlumatları
 * Yalnız bir dəfə icra edilməlidir
 */

import { NextRequest, NextResponse } from "next/server";
import { addKnowledgeBatch, clearKnowledgeBySource } from "@/lib/knowledge";

const KNOWLEDGE: Array<{ content: string; source: string; metadata?: Record<string, unknown> }> = [

  // ─── Şirkət məlumatları ───────────────────────────────────────────────────
  {
    source: "company",
    content: `Natoure (natourefly.com) Azərbaycanın etibarlı turizm şirkətidir. Bakıda yerləşirik. Biz Türkiyə, Dubai, Misir, Avropa, Bali, Tailand və digər istiqamətlərə tur satırıq. Xidmətlərimizə uçuş, otel, transfer, viza dəstəyi daxildir. Əlaqə: +994 51 776 96 32, info@natourefly.com. İş saatları: Bazar ertəsi – Şənbə, 09:00–18:00.`,
    metadata: { category: "general" },
  },
  {
    source: "company",
    content: `Natoure WhatsApp: +994 51 776 96 32. Instagram: @natoure.fly. Facebook: natoure. Rezervasiya üçün WhatsApp-da yazın və ya natourefly.com saytından online rezervasiya edin. Ödəniş nağd, köçürmə və ya hissə-hissə (taksit) ilə mümkündür.`,
    metadata: { category: "contact" },
  },
  {
    source: "company",
    content: `Natoure-da loyallıq proqramı var. Hər ödənişdən xal qazanırsınız. Bronze (0-999 xal), Silver (1000-4999 xal), Gold (5000-9999 xal), Platinum (10000+ xal). Yüksək səviyyə — daha çox endirim və üstünlüklər.`,
    metadata: { category: "loyalty" },
  },

  // ─── FAQ ──────────────────────────────────────────────────────────────────
  {
    source: "faq",
    content: `Sual: Tur qiymətinə nə daxildir? Cavab: Əksər turlarda uçuş, otel (all-inclusive və ya yarım pansion), aeroport transferi daxildir. Viza, sığorta və şəxsi xərclər ayrıca ödənilir. Hər turun detallarına baxın.`,
    metadata: { category: "pricing" },
  },
  {
    source: "faq",
    content: `Sual: Uşaqlar üçün qiymət necədir? Cavab: 0-2 yaş uşaqlar əksər turlarda pulsuz (yataq olmadan). 2-12 yaş uşaqlar üçün xüsusi uşaq qiyməti var — 30-50% endirim. 12 yaşdan yuxarı böyük qiyməti tətbiq olunur.`,
    metadata: { category: "children" },
  },
  {
    source: "faq",
    content: `Sual: Ödənişi necə etmək olar? Cavab: Nağd ödəniş (ofisdə), bank köçürməsi, online ödəniş (Payriff) və ya hissə-hissə (taksit — 3-12 ay). Depozit olaraq tur qiymətinin 30%-i əvvəlcədən ödənilir.`,
    metadata: { category: "payment" },
  },
  {
    source: "faq",
    content: `Sual: Tur ləğv edilsə nə olur? Cavab: Turdan 21+ gün əvvəl ləğv — tam geri ödəniş. 14-21 gün — 20% saxlanılır. 7-14 gün — 50% saxlanılır. 7 gündən az — geri ödəniş yoxdur. Sığorta ilə qorunmaq tövsiyə olunur.`,
    metadata: { category: "cancellation" },
  },
  {
    source: "faq",
    content: `Sual: Viza lazımdırmı? Cavab: Türkiyəyə — viza lazım deyil (Azərbaycan vətəndaşları üçün). Dubaya — e-viza (30$, biz kömək edirik). Misirə — arrival viza (25$). Avropaya — Şengen viza (biz sənədlər üçün yardım edirik). Hər ölkə üçün ayrıca məlumat alın.`,
    metadata: { category: "visa" },
  },
  {
    source: "faq",
    content: `Sual: Sığorta vacibdirmi? Cavab: Biz sığortanı tövsiyə edirik. Tibbi sığorta əksər ölkələr üçün məcburidir. Natoure sizin üçün səyahət sığortası tərtib edə bilər — qiymət 1-3 AZN/gün.`,
    metadata: { category: "insurance" },
  },
  {
    source: "faq",
    content: `Sual: Tur nə vaxt çıxır? Bakıdan hansı hava yolları ilə uçuruq? Cavab: Əsasən AZAL, Buta Airways, Turkish Airlines, FlyDubai ilə uçuşlarımız var. Çıxış tarixi hər tura görə dəyişir. Cədvəli natourefly.com/turlar saytında görə bilərsiniz.`,
    metadata: { category: "flights" },
  },

  // ─── Destinasiyalar ───────────────────────────────────────────────────────
  {
    source: "destination",
    content: `Antalya, Türkiyə: Azərbaycanlıların ən sevdiyi istirahət məntəqəsi. Rixos, Titanic, Akra, Limak kimi lüks otellər. All-inclusive sistemi. Dəniz mövsümü: May-Oktyabr. Bakıdan 3 saat uçuş. Viza tələb olunmur. Ortalama qiymət: 800-2500 AZN/nəfər (7 gecə, all-inclusive).`,
    metadata: { destination: "Antalya", country: "Türkiyə" },
  },
  {
    source: "destination",
    content: `İstanbul, Türkiyə: Mədəniyyət, alış-veriş və qastronomiyanın mərkəzi. Boğaz, Sultanəhməd, Qəpəliçarşı, Beyoğlu. Bakıdan 3 saat uçuş, viza yoxdur. Otellər: Hilton, Marriott, butik otellər. Tur müddəti: 3-7 gecə. Qiymət: 600-1800 AZN/nəfər.`,
    metadata: { destination: "İstanbul", country: "Türkiyə" },
  },
  {
    source: "destination",
    content: `Dubai, BƏƏ: Lüks, müasir həyat, alış-veriş cənnəti. Burj Khalifa, Palm Jumeirah, Dubai Mall, çöl safarisi. E-viza tələb olunur (30$). Bakıdan 4.5 saat uçuş. Ən yaxşı mövsüm: Noyabr-Aprel. Qiymət: 1200-3500 AZN/nəfər (5 gecə).`,
    metadata: { destination: "Dubai", country: "BƏƏ" },
  },
  {
    source: "destination",
    content: `Şarm əl-Şeyx, Misir: Qırmızı dəniz, mercan rifləri, dalış. Naama Bay, Ras Muhammad. Arrival viza (25$). Bakıdan 4 saat uçuş. Mövsüm: il boyu (yaz-yay çox isti). Otellər: all-inclusive. Qiymət: 900-2200 AZN/nəfər (7 gecə).`,
    metadata: { destination: "Şarm əl-Şeyx", country: "Misir" },
  },
  {
    source: "destination",
    content: `Hurgada, Misir: Ailə üçün ideal, sakit dəniz, all-inclusive otellər. El Gouna, Sahl Hasheesh. Bakıdan 4 saat uçuş. Arrival viza (25$). Bütün büdcələrə uyğun otellər mövcuddur. Qiymət: 700-1800 AZN/nəfər (7 gecə).`,
    metadata: { destination: "Hurgada", country: "Misir" },
  },
  {
    source: "destination",
    content: `Bali, İndoneziya: Ekzotik, romantik, unikal mədəniyyət. Kuta, Ubud, Seminyak. Visa on arrival (35$). Bakıdan 14+ saat uçuş (transit). Ən yaxşı mövsüm: Aprel-Oktyabr. Qiymət: 2500-5000 AZN/nəfər (10 gecə). Bal ayı üçün ideal.`,
    metadata: { destination: "Bali", country: "İndoneziya" },
  },
  {
    source: "destination",
    content: `Paris, Fransa: Eyfel qülləsi, Luvr, romantika. Şengen viza tələb olunur (biz sənəd hazırlığında kömək edirik). Bakıdan 5 saat uçuş. Qiymət: 2000-4500 AZN/nəfər (5-7 gecə, Şengen viza daxil).`,
    metadata: { destination: "Paris", country: "Fransa" },
  },

  // ─── Tur növləri ──────────────────────────────────────────────────────────
  {
    source: "tour_type",
    content: `All-Inclusive tur: Otel, yemək (3 öğün + snack), içki, animasiya, hovuz — hamısı qiymətə daxildir. Əlavə xərc minimum. Ailələr və uşaqlar üçün ideal. Antalya, Hurgada, Şarm əl-Şeyx-də geniş seçim var.`,
    metadata: { type: "all_inclusive" },
  },
  {
    source: "tour_type",
    content: `Bal ayı turu: Cütlüklər üçün xüsusi hazırlanmış romantik paketlər. Maldiv, Bali, Dubai, Santorini populyar seçimlərdir. Natoure cütlük üçün xüsusi otaq bəzəyi, şampan, çiçək sifariş edə bilər.`,
    metadata: { type: "honeymoon" },
  },
  {
    source: "tour_type",
    content: `Qrup turu: Digər ailələrlə birlikdə, rəhbər müşayiətilə. Daha ucuz qiymət. Qrup turları əsasən İstanbul, Avropa, Dubayə təşkil olunur. Minimum 10, maximum 40 nəfər.`,
    metadata: { type: "group" },
  },
  {
    source: "tour_type",
    content: `Fərdi (VIP) tur: Yalnız siz və ailənizdən ibarət xüsusi proqram. Öz tarixinizi, oteli, turları seçirsiniz. Şəxsi bələdçi, xüsusi transfer. Qiymət daha yüksəkdir, lakin tam azadlıq.`,
    metadata: { type: "individual" },
  },
];

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Əvvəlki seed-i sil, yenidən yaz
    const sources = [...new Set(KNOWLEDGE.map(k => k.source))];
    for (const source of sources) {
      await clearKnowledgeBySource(source);
    }

    await addKnowledgeBatch(KNOWLEDGE);

    return NextResponse.json({
      ok:    true,
      count: KNOWLEDGE.length,
      sources,
    });
  } catch (err) {
    console.error("[Knowledge Seed]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
