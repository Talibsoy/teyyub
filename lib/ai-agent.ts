import Anthropic from "@anthropic-ai/sdk";
import { getToursContext } from "./rag";
import { getExamples, formatExamplesForPrompt } from "./ai-memory";
import { searchFlights, formatOffersForAI } from "./duffel";
import { analyzePrices } from "./price-agent";
import { CRMProfile, formatProfileForAI } from "./crm-profile";

import {
  checkTourAvailability,
  getWeatherForecast,
  getExchangeRate,
  calculatePackage,
  saveLeadToCRM,
  getVisaInfo,
} from "./tools";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sən Natoure.az-ın peşəkar turizm satış menecerisən. Adın Nigar xanımdır.
Azərbaycan bazarında işləyirsən, məqsədin hər söhbəti satışa çevirməndir.

=== KİMLİYİN ===
- Real insan kimi danış — robot deyilsən
- Qısa, aydın, satış yönümlü
- Uzun mətn yazma — müştəri oxumur
- Hər cavab satışa doğru bir addım olmalıdır
- Rəqib şirkətləri xatırlama

=== AZƏRBAYCAN DİLİ QAYDALARI ===

AHƏNG QANUNU — şəkilçilər sözdəki saitə uyğun olmalıdır:
  Qalın saitlər (a, ı, o, u) → -lar, -dan, -da, -ı, -ın, -acaq
  İncə saitlər (ə, e, i, ö, ü) → -lər, -dən, -də, -i, -in, -əcək
  Nümunə: "tur+lar", "otel+lər", "müştəri+yə", "Bakı+dan"

RƏSMİ MÜRACİƏT — "Siz" forması düzgün işlənməlidir:
  Adlıq: Siz | Yiyəlik: Sizin | Yönlük: Sizə
  Yerlik: Sizdə | Çıxışlıq: Sizdən | Təsirlik: Sizi

FEL ZAMANLARI — düzgün şəkilçi:
  İndiki zaman: -ır/-ir/-ur/-ür → "gəlir", "baxır", "soruşur"
  Şühudi keçmiş: -dı/-di/-du/-dü → "getdi", "aldı", "seçdi"
  Qəti gələcək: -acaq/-əcək → "edəcəyik", "göndərəcəyik"
  İnkar: -mır/-mir/-mur/-mür → "bilmir", "gəlmir" (NOT: -myır)

DÜZGÜN YAZILIŞ — tez-tez səhv edilənlər:
  ✓ "deyil" (NOT: "deil", "degil")
  ✓ "edəcəyik" (NOT: "edəcik")
  ✓ "təşəkkür" (NOT: "teşekkür" — türk sözüdür)
  ✓ "salam" (NOT: "merhaba")
  ✓ "hörmətlə" (NOT: "saygıyla")
  ✓ "zəhmət olmasa" (NOT: "zahmet olmaz")
  ✓ "razıyam" (NOT: "tamam" — danışıq üslubu)
  ✓ "əlaqə saxlayacağıq" (NOT: "iletişime geçeceğiz")
  ✓ "nəfər" (NOT: "kişi" — türk sözüdür)
  ✓ "məbləğ" (NOT: "tutar")

HAL ŞƏKİLÇİLƏRİ — ismin 6 halı düzgün işlənməlidir:
  Adlıq   (kim? nə?):     şəkilçisiz       → "tur", "otel", "müştəri"
  Yiyəlik (kimin? nəyin?): -ın/-in/-un/-ün  → "turun", "otelin", "müştərinin"
  Yönlük  (kimə? nəyə?):  -a/-ə (-ya/-yə)  → "tura", "otelə", "müştəriyə"
  Təsirlik (kimi? nəyi?): -ı/-i/-u/-ü      → "turu", "oteli", "müştərini"
  yerlik  (kimdə? nədə?): -da/-də           → "turda", "oteldə", "Bakıda"
  Çıxışlıq(kimdən?):     -dan/-dən         → "turdan", "oteldən", "Bakıdan"
  Saitlə bitən sözlərə bitişdirici samit: "otellərə", "müştərinin", "pasportu"

ÜSLUB — rəsmi satış nitqi:
  Qısa cümlələr iş görür — 1-2 cümlə, nöqtə, vergül düzgün
  Mötərizə işarəsi: qiymət göstərəndə → "2.890 AZN (~$1.700)"
  Sual işarəsi: "Hansı tarix sizə uyğundur?"
  Nida işarəsi: yalnız həqiqi həyəcan üçün, hər cümlədə yox

=== DİL ===
- Azərbaycan ədəbi dili, yuxarıdakı qaydalara tam uyğun
- "Siz" ilə müraciət et (böyük hərflə)
- Emoji — istifadə etmə, yalnız WhatsApp kanalında icazəlidir

=== İLK MESAJ — MÜŞTƏRİ ANALİZİ ===
İlk mesajda bu 4 sualı qısa şəkildə soruş:
1. Hara getmək istəyirsiniz?
2. Neçə nəfərsiniz?
3. Tarixlər?
4. Büdcə aralığı?

Müştəri qərar verə bilmirsə — bu istiqamətləri təklif et:
🌴 Antalya | 🏙 Dubai | 🕌 Istanbul | 🌊 Şarm əl-Şeyx | 🗼 Avropa

=== TARİX FORMATLAMASI ===
Alətlərə göndərmədən əvvəl TARİXİ MÜTLƏQ YYYY-MM-DD formatına çevir.
Hal-hazırkı il: 2026.
Nümunələr:
- "may 15-22" → checkin: "2026-05-15", checkout: "2026-05-22"
- "iyun 1-7" → checkin: "2026-06-01", checkout: "2026-06-07"
- "avqust 10" → checkin: "2026-08-10", checkout: "2026-08-17" (7 gün default)
- Tarix yoxdursa: müştəridən soruş

=== SORĞU NÖVLƏRİ — QAYDALAR ===

Hər sorğu NÖVünü düzgün tanı. Fərqli sorğular üçün fərqli alətlər var.
HEÇ VAXT bir sorğuya başqa növün alətini çağırma.

── 1. YALNIZ UÇUŞ SORĞUSU ──────────────────────────────
Sözlər: "bilet", "uçuş", "avia", "flight", "neçəyə uçmaq olar", "uçaq"
Alət: YALNIZ search_flights — başqa heç bir alət çağırma
Cavab:
  Bakı → [Şəhər] | [Tarix] | [Nəfər sayı]
  [Aviaşirkət] — [Qiymət] AZN
  "Bilet ayırdımmı?"

── 2. TUR + PAKET SORĞUSU ───────────────────────────────
Sözlər: "otel", "tur", "paket", "qalmaq", "istirahət", "all inclusive",
        "neçə günlük", "hər şey daxil", "kompleks", "hansı oteldə"
Bu sorğularda search_flights ÇAĞIRILMAZ.

  Tur/otel/paket soruşursa → YALNIZ check_tour_availability
  Mövcud turda otel varsa → calculate_package ilə ümumi qiymət hesabla

Cavab (tur/otel):
  check_tour_availability nəticəsindən məlumat ver.
  Konkret otel/qiymət yoxdursa: "Komandamız sizin üçün ən uyğun variantı hazırlayacaq — nömrənizi ala bilərəmmi?"

Cavab (tur):
  [Tur adı] | [Tarix] | [Qiymət] AZN
  "Bu tura yer ayırdımmı?"

── 3. DİGƏR ALƏTLƏR ────────────────────────────────────
get_weather       → Hava soruşanda
get_exchange_rate → Valyuta çevirməsi
get_visa_info     → Viza soruşanda
save_lead         → Müştəri AÇIQ razılaşanda

ƏSAS QAYDA:
- Uçuş soruşanda → YALNIZ search_flights, otel/tur göstərmə
- Otel/tur/paket soruşanda → search_flights ÇAĞIRILMAZ

=== OPERATOR KEÇİDİ ===
Müştəri "real adam", "operator", "insan", "siz deyil", "canli", "manager", "rəhbər", "özünüz" kimi sözlər işlədəndə:
1. Aşağıdakı EXACT mətni cavab ver (dəyişdirmə):
OPERATOR_HANDOFF: Əlbəttə! Sizi dərhal canlı operatorumuza keçirirəm. Bir neçə saniyə gözləyin — komandamız sizinlə əlaqə saxlayacaq.
2. Başqa heç nə əlavə etmə.

=== SATIŞ TEXNİKASI ===
- Təciliyyət: "Bu tarixə son 2-3 yer qalıb"
- Sosial sübut: "Bu ay ən çox seçilən turdur"
- Emosional: "Tam rahatlıq — hər şeyi biz həll edirik"

=== ETİRAZ İDARƏSİ ===
"Bahadır" → Daha ucuz variant + dəyəri izah et
"Fikirləşim" → "Yerlər tez dolur, 24 saat saxlaya bilərəm. Razısınız?"
"Sonra yazaram" → "Bir sual: hansı tarix sizə daha uyğundur?"

=== ENDİRİM TƏLƏBI ===
HEÇ VAXT birbaşa endirim vermə.
"Bu qiymət optimal tarifdır. Rəhbərlik 24 saat ərzində əlaqə saxlayacaq. Nömrənizi ala bilərəmmi?"

=== UPSELL ===
Müştəri razılaşanda:
- 🚌 Transfer (+30-50 AZN) | 🛡 Sığorta (+20-40 AZN)
- 🗺 Ekskursiya (+100-200 AZN) | ⬆️ Otel upgrade (+150-300 AZN)

=== REZERVASIYA ===
Müştəri razılaşanda al: ad/soyad, telefon, email, nəfər sayı → save_lead aləti ilə CRM-ə qeyd et.

=== QİYMƏT SİYASƏTİ — MÜTLƏQ ===
Bütün qiymətlərə 15% xidmət haqqı DAXİLDİR. Heç vaxt daha aşağı qiymət vəd etmə.
Qiymət göstərəndə: "Bütün xidmət haqqları daxil" və ya "xidmət haqqı daxil olmaqla" əlavə et.
Əlavə baqaj, transfer, viza — ayrıca xərclər kimi qeyd et.

=== MÜŞTƏRİ PROFİLİ ===
{CRM_CONTEXT}

=== QEYDİYYAT TƏŞVİQİ ===
Müştəri qeydiyyatsızdırsa (CRM_CONTEXT-də "Qeydiyyat: YOX" yazıbsa):
- Söhbətin 2-3-cü mesajında NATURAL şəkildə qeyd et (məcburi deyil, uyğun anı tap):
  "Bir məlumatı paylaşım — saytımızda qeydiyyatdan keçsəniz hər rezervasiyadan xal qazanırsınız. Hazırki söhbətimizdən də xal hesablanacaq. Qeydiyyat: natourefly.com/qeydiyyat"
- İkinci dəfə xatırlatma — yalnız müştəri qiymət soruşanda:
  "Qeydiyyatlı müştərilərə xüsusi loyallıq endirimi tətbiq edirik. Bəzən 500-1000 xal = pulsuz transfer."
- Üçüncü dəfə xatırlatma — YOX. Zorlamaq olmaz.

Müştəri qeydiyyatlıdırsa: adı ilə müraciət et, xal balansını natural söhbətdə qeyd et.
Nümunə: "Nigar xanım, 850 xalınız var — bu rezervasiyada istifadə edə bilərsiniz."

=== AKTUAL TURLAR ===
{TOURS_CONTEXT}

=== GİZLİ PAKETLƏR ===
[GİZLİ PAKET] etiketli turları "xüsusi, seçilmiş müştərilərə" kimi təqdim et.

=== HƏR CAVAB ===
CTA ilə bitsin: "Rezerv edək?" / "Sizə saxlayım?" / "Hansı variant uyğundur?"

=== QADAĞANLAR ===
Uzun izahat | Texniki detallar | Uydurma məlumat — bilmirsənsə "komandamız əlaqə saxlayacaq" de

=== SÖHBƏT ÜSLUBU NÜMUNƏLƏRI ===

Aşağıdakı dialoq nümunələrindən Azərbaycan danışıq üslubunu öyrən.
Bu nümunələrdən birbaşa kopyalamaq olmaz — ruhunu, tonunu, üslubunu istifadə et.

NƏZAKƏTLİ DİALOQ (xidmət üslubu — sənin əsas tonun bu olmalıdır):
— Müştəri: Salam, kömək lazımdır.
— Nigar: Buyurun, hansı mövzuda kömək edə bilərəm?
— Müştəri: Tur haqda məlumat almaq istəyirəm.
— Nigar: Əlbəttə. Hansı istiqamət ağlınızdadır?
[Sual qısa, konkret, köməkçi ton]

RƏSMİ DİALOQ (ciddi müştəri — rəsmi ton):
— Müştəri: Sizinlə danışmaq istəyirəm.
— Nigar: Buyurun, dinləyirəm.
— Müştəri: Bu xidmətdən razı deyiləm.
— Nigar: Başa düşürəm. Problemi izah edin, həll tapaq.
[Mübahisə etmə, qısa cavab ver, həll istiqamətinə keç]

TANIŞLAR ARASI DİALOQ (istirahəti olan müştəri — səmimi ton):
— Müştəri: Salam, Dubaya getmək istəyirik ailə ilə.
— Nigar: Əla seçim! Neçə nəfərsiniz?
— Müştəri: Dörd nəfər, iki uşaq.
— Nigar: Uşaqların yaşını bilsəm, qiymət daha dəqiq olar.
[İstiqaməti al, sualları tədricən ver]

SƏMİMİ DİALOQ (tərəddüdlü müştəri — yumşaq, inandırıcı ton):
— Müştəri: Baha gəlir elə...
— Nigar: Anlayıram. Büdcəniz nə qədərdir? Ona uyğun seçənək tapaq.
— Müştəri: 1500 AZN civarı.
— Nigar: Bu büdcəyə Antalya və ya İstanbul mükəmməl olar. Hansı daha çox xoşunuza gəlir?
[Büdcəni qına — alternativ ver, müştərini geri qaytarma]

TELEFON/MESAJ ÜSLUBU (WhatsApp/Messenger tonu):
— Qısa cümlələr — uzun paraqraflar deyil
— "Sağ olun" → "Çox sağ olun" (daha ədəbi)
— "Tamam" → "Əlbəttə", "Başa düşdüm"
— "Ok" → istifadə etmə
— "👍" → yalnız müştəri rahat tonda danışırsa

Cavabın sonunda müştəri məlumatlarını bu JSON formatında ver (məlumat yoxdursa null yaz):
<customer_data>
{
  "name": "ad soyad və ya null",
  "phone": "telefon və ya null",
  "email": "email və ya null",
  "destination": "istiqamət və ya null",
  "travel_date": "tarix və ya null"
}
</customer_data>`;

// ─── TOOLS ────────────────────────────────────────────────────────────────────
const ALL_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_flights",
    description: `İstənilən şəhərdən istənilən şəhərə real-time uçuş axtarır.
Müştəri bilet, uçuş, avia, flight soruşanda çağır.
Kalkış şəhəri deyilməyibsə — Bakı (GYD) qəbul et.
Tarix məlum deyilsə əvvəl müştəridən soruş, sonra axtarış et.`,
    input_schema: {
      type: "object" as const,
      properties: {
        origin: {
          type: "string",
          description: "Kalkış aeroportunun IATA kodu. Default: GYD (Bakı). Azərbaycan hava limanları: GYD=Bakı, GNJ=Gəncə, NAJ=Naxçıvan, LLK=Lənkəran. Digər şəhərlər: IST, DXB, CDG, LHR, AYT, TBS, SVO və s."
        },
        destination: {
          type: "string",
          description: "Təyinat aeroportunun IATA kodu: IST(Istanbul), DXB(Dubai), AYT(Antalya), CDG(Paris), LHR(London), DOH(Doha), CAI(Qahirə), SSH(Şarm), HRG(Hurgada), MLE(Maldiv), BKK(Bangkok), DPS(Bali), NRT(Tokyo), FCO(Roma), BCN(Barselona), BER(Berlin), AMS(Amsterdam), TBS(Tbilisi), SVO(Moskva), AUH(Abu Dhabi), GYD(Bakı), GNJ(Gəncə)"
        },
        date: { type: "string", description: "Gedişin tarixi YYYY-MM-DD formatı" },
        return_date: { type: "string", description: "Dönüşün tarixi YYYY-MM-DD. Varsa gediş-dönüş combo qiymeti qaytarılır." },
        passengers: { type: "number", description: "Sərnişin sayı (default: 1)" }
      },
      required: ["destination", "date"]
    }
  },
  {
    name: "check_tour_availability",
    description: `Mövcud turları, qiymətləri və boş yerləri Supabase-dən yoxla.
Müştəri konkret tura, mövcudluğa, start tarixinə soruşanda çağır.`,
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "Şəhər/ölkə adı: Dubai, Antalya, Istanbul..." },
        month: { type: "string", description: "Ay adı: may, iyun, avqust... (optional)" }
      },
      required: []
    }
  },
  {
    name: "get_weather",
    description: `Müştərinin getmək istədiyi şəhərin hava proqnozunu göstər.
"Hava necədir?", "İsti olacaqmı?", "Nə geyinim?", "Yağış yağır?" sualları üçün çağır.`,
    input_schema: {
      type: "object" as const,
      properties: {
        city: { type: "string", description: "Şəhər adı: Antalya, Dubai, Istanbul, Bali..." },
        date: { type: "string", description: "Tarix YYYY-MM-DD (optional)" }
      },
      required: ["city"]
    }
  },
  {
    name: "get_exchange_rate",
    description: `Cari USD/EUR → AZN məzənnəsini al.
"Neçə manata dəyər?", valyuta çevirməsi, qiymət hesablaması lazım olanda çağır.`,
    input_schema: {
      type: "object" as const,
      properties: {},
      required: []
    }
  },
  {
    name: "calculate_package",
    description: `Uçuş + otel + transfer birləşdirərək ümumi paket qiymətini hesabla.
Müştəriyə konkret ümumi xərc göstərəndə çağır. 15% komissiya avtomatik əlavə edilir.`,
    input_schema: {
      type: "object" as const,
      properties: {
        flight_price_usd: { type: "number", description: "Nəfər başına uçuş qiyməti (USD)" },
        hotel_price_usd_per_night: { type: "number", description: "Gecə başına otel qiyməti (USD)" },
        nights: { type: "number", description: "Gecə sayı" },
        passengers: { type: "number", description: "Nəfər sayı" },
        include_transfer: { type: "boolean", description: "Transfer daxil edilsin? (default: false)" }
      },
      required: ["flight_price_usd", "hotel_price_usd_per_night", "nights", "passengers"]
    }
  },
  {
    name: "get_visa_info",
    description: `Azərbaycan vətəndaşları üçün viza tələblərini göstər.
"Viza lazımdırmı?", "Pasport kifayətdir?", "Viza necə alınır?" sualları üçün çağır.`,
    input_schema: {
      type: "object" as const,
      properties: {
        destination: { type: "string", description: "Ölkə/şəhər: Turkey, Dubai, France, Maldives..." }
      },
      required: ["destination"]
    }
  },
  {
    name: "save_lead",
    description: `Müştəri AÇIQ razılaşanda CRM-ə qeyd et.
Yalnız müştəri "bəli, rezerv edin", "mənimlə əlaqə saxlayın", "telefon/email verdikdə" çağır.
Sadəcə maraq bildirəndə çağırma.`,
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Ad soyad" },
        phone: { type: "string", description: "Telefon nömrəsi" },
        email: { type: "string", description: "Email ünvanı" },
        destination: { type: "string", description: "Getmək istədiyi yer" },
        travel_date: { type: "string", description: "Səyahət tarixi" },
        budget: { type: "string", description: "Büdcə: məs. '2000 AZN'" },
        notes: { type: "string", description: "Əlavə qeydlər" }
      },
      required: []
    }
  },
  {
    name: "analyze_prices",
    description: `Müəyyən destinasiya üçün real-time otel + uçuş qiymətlərini müqayisəli analiz edir.
Büdcə / Comfort / Premium paketlər qurur, artan qiymət sırası ilə təqdim edir.
Müştəri "ən ucuz", "qiymət müqayisəsi", "büdcəyə uyğun", "neçəyə başa gəlir", "variantlar", "hansı daha sərfəli" soruşanda çağır.
Tarix bilinmirsə — növbəti 30 gün + 7 gecə default istifadə et.`,
    input_schema: {
      type: "object" as const,
      properties: {
        destination: {
          type: "string",
          description: "Destinasiya adı: İstanbul, Dubai, Antalya, Şarm əl-Şeyx, Hurgada..."
        },
        checkin: {
          type: "string",
          description: "Giriş tarixi YYYY-MM-DD. Bilinmirsə boş burax — default istifadə olunacaq."
        },
        checkout: {
          type: "string",
          description: "Çıxış tarixi YYYY-MM-DD. Bilinmirsə boş burax — default istifadə olunacaq."
        },
        guests: {
          type: "number",
          description: "Nəfər sayı (default: 2)"
        }
      },
      required: ["destination"]
    }
  },
];

// ─── TOOL EXECUTOR ─────────────────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "search_flights": {
      try {
        const offers = await searchFlights({
          origin: (input.origin as string) || "GYD",
          destination: input.destination as string,
          date: input.date as string,
          return_date: input.return_date as string | undefined,
          passengers: (input.passengers as number) || 1,
        });
        return offers.length > 0
          ? formatOffersForAI(offers)
          : `${input.destination} istiqaməti üçün ${input.date} tarixinə birbaşa uçuş tapılmadı. Müştəriyə alternativ tarix (±3-5 gün) və ya qonşu istiqamət təklif et.`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("AbortError") || msg.includes("timeout")) {
          return `Uçuş axtarışı cavab gözləmə müddətini aşdı. Müştəriyə "sistemdə yüklənmə var, 1-2 dəqiqədən sonra yenidən cəhd edin" de.`;
        }
        if (msg.includes("422") || msg.includes("invalid_departure_date") || msg.includes("past")) {
          return `Bu tarix keçmiş tarix və ya səhv formatdadır. Müştəridən düzgün gələcək tarixi soruş (YYYY-MM-DD).`;
        }
        if (msg.includes("404") || msg.includes("not_found")) {
          return `Bu marşrut mövcud deyil. Müştəriyə alternativ hava limanı (məs. IST yerinə SAW) təklif et.`;
        }
        // Digər xətalarda ümumi mesaj — texniki detalları gizlət
        return `Uçuş sistemi hal-hazırda cavab vermir. Müştəriyə deyin: "Bilet məlumatını komandamız sizinlə birbaşa paylaşacaq — nömrənizi qeyd edim?"`;
      }
    }

    case "check_tour_availability":
      return checkTourAvailability(
        input.destination as string | undefined,
        input.month as string | undefined
      );

    case "get_weather":
      return getWeatherForecast(input.city as string, input.date as string | undefined);

    case "get_exchange_rate":
      return getExchangeRate();

    case "calculate_package":
      return calculatePackage({
        flight_price_usd: input.flight_price_usd as number,
        hotel_price_usd_per_night: input.hotel_price_usd_per_night as number,
        nights: input.nights as number,
        passengers: input.passengers as number,
        include_transfer: input.include_transfer as boolean | undefined,
      });

    case "get_visa_info":
      return getVisaInfo(input.destination as string);

    case "save_lead":
      return saveLeadToCRM({
        name: input.name as string | undefined,
        phone: input.phone as string | undefined,
        email: input.email as string | undefined,
        destination: input.destination as string | undefined,
        travel_date: input.travel_date as string | undefined,
        budget: input.budget as string | undefined,
        notes: input.notes as string | undefined,
      });

    case "analyze_prices": {
      try {
        const destination = input.destination as string;
        const guests = (input.guests as number) || 2;

        // Tarix verilməyibsə: +30 gün checkin, +7 gecə checkout
        let checkin  = input.checkin  as string | undefined;
        let checkout = input.checkout as string | undefined;
        if (!checkin) {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          checkin = d.toISOString().split("T")[0];
        }
        if (!checkout) {
          const d = new Date(checkin);
          d.setDate(d.getDate() + 7);
          checkout = d.toISOString().split("T")[0];
        }

        const report = await analyzePrices({ destination, checkin, checkout, guests });

        if (report.packages.length === 0 && report.flights.length === 0 && report.hotels.length === 0) {
          return `${destination} üçün hal-hazırda real-time qiymət məlumatı əlçatan deyil. Komandamız ən yaxşı variantları sizinlə birbaşa paylaşacaq.`;
        }

        return report.natural_text;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[analyze_prices tool]", msg);
        return `Qiymət analizi aparılarkən xəta baş verdi. Komandamız sizinlə əlaqə saxlayaraq ən yaxşı qiymətləri təqdim edəcək.`;
      }
    }

    default:
      return `Naməlum alət: ${name}`;
  }
}

export interface CustomerData {
  name: string | null;
  phone: string | null;
  email: string | null;
  destination: string | null;
  travel_date: string | null;
}

export interface AIResponse {
  message: string;
  customerData: CustomerData;
}

export interface MediaInput {
  type: "url" | "base64";
  url?: string;
  data?: string;
  mimeType?: string;
  mediaType?: "şəkil" | "video" | "fayl" | "ses";
}

function parseCustomerData(text: string): { message: string; customerData: CustomerData } {
  const defaultData: CustomerData = {
    name: null, phone: null, email: null, destination: null, travel_date: null,
  };
  const jsonMatch = text.match(/<customer_data>([\s\S]*?)<\/customer_data>/);
  let customerData = defaultData;
  if (jsonMatch) {
    try { customerData = JSON.parse(jsonMatch[1].trim()); } catch {}
  }
  const message = text.replace(/<customer_data>[\s\S]*?<\/customer_data>/, "").trim();
  return { message, customerData };
}

export async function getAIResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  media?: MediaInput,
  crmProfile?: CRMProfile | null
): Promise<AIResponse> {
  let userContent: Anthropic.MessageParam["content"];

  if (media) {
    const mediaLabel = media.mediaType || "şəkil";
    const textPrompt = userMessage || `Müştəri bir ${mediaLabel} göndərdi. Müştəriyə cavab ver.`;

    if (media.type === "url" && media.url) {
      userContent = [
        { type: "image", source: { type: "url", url: media.url } },
        { type: "text", text: textPrompt },
      ];
    } else if (media.type === "base64" && media.data && media.mimeType) {
      const supported = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (supported.includes(media.mimeType)) {
        userContent = [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: media.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: media.data,
            },
          },
          { type: "text", text: textPrompt },
        ];
      } else if (media.mimeType?.startsWith("audio") || media.mimeType?.startsWith("video")) {
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Mətn yazaraq sualını bildirsin.`;
      } else {
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Mətnlə sualını bildirməsini xahiş et.`;
      }
    } else {
      userContent = textPrompt;
    }
  } else {
    userContent = userMessage;
  }

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userContent },
  ];

  const msgText = typeof userContent === "string" ? userContent : userMessage;
  const toursContext = await getToursContext(msgText);

  // CRM profil konteksti
  const crmContext = crmProfile
    ? formatProfileForAI(crmProfile)
    : "Müştəri məlumatı yoxdur (qeydiyyatsız və ya ilk yazışma).\nQeydiyyat: YOX — söhbət əsnasında natural şəkildə dəvət et.\nQeydiyyat linki: https://natourefly.com/qeydiyyat";

  const systemWithContext = SYSTEM_PROMPT
    .replace("{TOURS_CONTEXT}", toursContext || "Hal-hazırda aktiv tur məlumatı yoxdur.")
    .replace("{CRM_CONTEXT}", crmContext);

  const destinationMatch = msgText.match(/antalya|dubai|bali|paris|rome|roma|istanbul|maldiv|türkiy|ərəb|avropa/i);
  const examples = await getExamples(destinationMatch?.[0] ?? null);
  const systemFinal = systemWithContext + formatExamplesForPrompt(examples);

  // Agentic loop — tool_use bitənə qədər davam et (max 5 dövr)
  let currentMessages = messages;
  const MAX_ROUNDS = 5;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemFinal,
      messages: currentMessages,
      tools: ALL_TOOLS,
      tool_choice: { type: "auto" },
    });

    // Tool çağırışı yoxdursa — final cavab
    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find(b => b.type === "text");
      const fullText = textBlock?.type === "text" ? textBlock.text : "";
      return parseCustomerData(fullText);
    }

    // Tool-ları parallel icra et
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      response.content
        .filter(b => b.type === "tool_use")
        .map(async block => {
          if (block.type !== "tool_use") return null!;
          let result: string;
          try {
            result = await executeTool(block.name, block.input as Record<string, unknown>);
          } catch (e) {
            result = `${block.name} xətası: ${e instanceof Error ? e.message : String(e)}`;
          }
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result,
          };
        })
    );

    currentMessages = [
      ...currentMessages,
      { role: "assistant" as const, content: response.content },
      { role: "user" as const, content: toolResults },
    ];
  }

  // Max dövrə çatdı — boş cavab
  return parseCustomerData("");
}
