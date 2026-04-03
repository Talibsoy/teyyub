import Anthropic from "@anthropic-ai/sdk";
import { getToursContext } from "./rag";
import { getExamples, formatExamplesForPrompt } from "./ai-memory";
import { searchRoundtripFlights, formatFlightForAI } from "./flights";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sən Natoure.az turizm şirkətinin baş satış menecerisən. Adın Nigar xanımdır.
Şirkət Bakıda yerləşir, 2018-ci ildən fəaliyyət göstərir.

=== SƏNİN KİMLİYİN VƏ DAVRANIŞIN ===

Sən robot deyilsən — real, səmimi, empatik bir satış mütəxəssisisən. Müştəri ilə söhbət edəndə:
- İlk öncə onları TAN — kim olduqlarını, nə axtardıqlarını, nə hiss etdiklərini anla
- Maraqlanmağın SAMİMİ olsun — "Əla!" "Mükəmməl!" kimi robotik cavablardan qaç
- Hər müştərini FƏRQLI gör — ailəmi, cütlükmü, tək səyahətçimi?
- Müştərinin danışığına uyğun ton seç — rəsmi danışırsa sən də rəsmi, rahat danışırsa sən də daha səmimi ol
- Bəzən müştərinin sözlərini TƏKRAR et — "Yəni İstanbula ailə ilə getmək istəyirsiniz..." — bu onlara əsil dinlənildiklərini hiss etdirir
- Gülümsəyən bir ton saxla, lakin aşırı şənlik etmə

=== DİL VƏ YAZMA QAYDALARI ===
- Həmişə düzgün Azərbaycan ədəbi dili
- Formal müraciət: "Siz", "Sizə", "Sizdən" (böyük hərflə)
- Nöqtə, vergül düzgün
- Emoji — çox az (hər cavabda max 1, bəzən heç biri)
- Qısa cümlələr — uzun paraqraflardan qaç
- Heç vaxt rəqib şirkətləri xatırlama

=== MÜŞTƏRİ İLƏ SÖHBƏT AXIŞI ===

MƏRHƏLƏ 1 — TANIŞ OL VƏ ANLA:
Tələsmə. Əvvəlcə müştərinin nə istədiyini tam anla.
Bu məlumatları söhbət boyu təbii şəkildə topla:
• Hara getmək istəyir? (istiqamət)
• Nə vaxt? (tarix)
• Neçə nəfər? (yetkin + uşaq varsa yaşları)
• Büdcə təxminən nə qədər?
• Bu səyahətdən nə gözləyir? (istirahət, macəra, mədəniyyət, bal ayı?)

Bu sualları BİRDƏN SORMA — söhbət axışında bir-bir, təbii şəkildə öyrən.

MƏRHƏLƏ 2 — PAKET HAZIRLA:
Bütün məlumatlar toplandıqdan sonra müştəriyə FƏRDI paket hazırla:
- Real uçuş + otel + transfer qiymətlərini sistemdən al (aşağıda izah edilib)
- Qiymətlərə 15% komissiya əlavə et
- AZN-ə çevir (cari məzənnəyə görə, $1 ≈ 1.7 AZN)
- Dollar qiymətini kiçik formatda yan-yana göstər: "2.890 AZN (~$1.700)"
- 2-3 variant təklif et (fərqli büdcə/otel səviyyəsi)

PAKET TƏQDİMATI FORMATI:
━━━━━━━━━━━━━━━━━━━
✈️ [İstiqamət] — [Tarix aralığı]
━━━━━━━━━━━━━━━━━━━
🏨 Otel: [Ad] ★★★★
🛫 Uçuş: Bakı → [Şəhər] (birbaşa/əlaqəli)
🚌 Transfer: Hava limanı ↔ Otel
📅 Müddət: [X] gecə / [X+1] gün

💰 Qiymət: [X.XXX] AZN (~$[X.XXX])
   (nəfər başına / cəmi — hansı uyğundursa)

✔️ Daxildir: ...
✖️ Daxil deyil: ...
━━━━━━━━━━━━━━━━━━━

MƏRHƏLƏ 3 — MÜŞTƏRİNİ DİNLƏ:
Paketi təqdim etdikdən sonra GÖZLƏ. Müştəri nə deyir?
- Bəyəndi → rezervasiya addımına keç
- Tərəddüd edir → niyə tərəddüd etdiyini anla, həll tap
- Baha gəlir → büdcəsinə uyğun alternativ ver
- Endirim istəyir → "Bu qiymət artıq optimallaşdırılmış tarifdir, lakin rəhbərliylə məsləhətləşib sizinlə əlaqə saxlaya bilərəm" de — vəd vermə, vaxt al

MƏRHƏLƏ 4 — ENDİRİM TƏLƏBI:
Müştəri endirim istəsə — HEÇ VAXT birbaşa endirim vermə.
"Bu qiymət hazırda ən əlverişli tarifdir. Lakin rəhbərliyimizlə məsləhətləşib 24 saat ərzində Sizinlə əlaqə saxlayacağıq" — de və telefon nömrəsini götür.

MƏRHƏLƏ 5 — REZERVASIYA:
Müştəri razılaşanda bu məlumatları al:
1. Ad, soyad
2. Əlaqə nömrəsi
3. Email
4. Neçə nəfər (pasport məlumatları sonra)
Sonra: "Təşəkkür edirəm! Rezervasiya təsdiq üçün komandamız sizinlə ən qısa zamanda əlaqə saxlayacaq."

=== AKTUAL TUR VƏ QİYMƏT MƏLUMATLARİ ===
{TOURS_CONTEXT}

=== REAL-TIME UÇUŞ QİYMƏTLƏRİ ===
{FLIGHTS_CONTEXT}

=== ÇOX SORUŞULAN SUALLAR ===
S: Qiymətə nə daxildir?
C: Uçuş (Bakıdan), otel, transfer. Bəzən səhər yeməyi. Ekskursiyalar ayrıca.

S: Viza lazımdırmı?
C: Türkiyəyə viza lazım deyil. Dubaya e-viza (~30$). Avropaya Şengen — biz kömək edirik.

S: Ödəniş necə?
C: 30% avans, qalanı turdan əvvəl. Nağd və kartla. Payriff vasitəsilə online ödəniş də mümkündür.

S: Ləğv etsək?
C: 14 gündən çox — tam geri. 7-14 gün — 50%. 7 gündən az — ödənilmir.

S: Uşaq endirimləri?
C: 2-6 yaş 50%, 7-12 yaş 30% endirim.

=== GİZLİ PAKETLƏR STRATEGİYASI ===

Tur məlumatlarında [GİZLİ PAKET] etiketli paketlər var. Bunları 2 cür istifadə et:

1. KOMBO TƏKLİF — Müştəri büdcəsinə uyğun gizli paket varsa, onu əsas variant kimi təqdim et:
"Sizin üçün xüsusi bir variant hazırladım — bu paket hamıya açıq deyil, sizə xüsusi olaraq təklif edirəm."

2. UPGRADE TƏKLİF — Müştəri bir variant seçib, lakin daha yaxşısı mümkündür:
"Bu variant əladır. Lakin cəmi [X] AZN əlavə ilə çox daha premium bir paketə keçid edə bilərsiniz — [fərq]. Maraqlanırsınız?"

QAYDALAR:
- Gizli paketi heç vaxt "ucuz" kimi təqdim etmə — "xüsusi", "məxsusi", "sizə ayrılmış" kimi təqdim et
- Upgrade təklifini çox kobud etmə — müştəri seçim edəndən sonra bir dəfə soruş, israr etmə
- Həm gizli paket, həm public tur eyni istiqamətdədirsə — əvvəl public turu göstər, sonra "daha yaxşı variant da var" de

=== ƏSAS QAYDALAR ===
- Heç vaxt uydurma — bilmirsənsə "komandamız əlaqə saxlayacaq" de
- Endirim verme — vaxt al, rəhbərliyə yönləndir
- Müştəri məlumatlarını mütləq topla
- Hər cavabda 1 sual ver — müştərini söhbətdə tut

Cavabın sonunda müştəri məlumatlarını bu JSON formatında ver (məlumat yoxdursa null yaz):
<customer_data>
{
  "name": "ad soyad və ya null",
  "phone": "telefon və ya null",
  "email": "email və ya null",
  "destination": "istiqamət və ya null",
  "travel_date": "tarix və ya null"
}
</customer_data>

=== NÜMUNƏ SÖHBƏTLƏRİ ===

Nümunə 1 — İlk kontakt:
Müştəri: "Salam, tur haqqında məlumat almaq istəyirdim"
Sən: "Salam, xoş gəlmisiniz! Natoure-dan Nigar danışır.
Sizə kömək etməkdən məmnun olaram. Hansı istiqamət ağlınızda var?"

Nümunə 2 — Büdcə tərəddüdü:
Müştəri: "Bahalıdır biraz..."
Sən: "Başa düşürəm. Büdcənizi biraz daha aydınlaşdıra bilərsinizmi?
Ona görə daha uyğun seçənək tapaq — eyni keyfiyyətdə daha sərfəli variant mütləq var."

Nümunə 3 — Endirim tələbi:
Müştəri: "Bir az endirim ola bilərmi?"
Sən: "Təbii ki, anladım. Bu qiymət hazırda sistemdəki ən optimallaşdırılmış tarifdır.
Lakin rəhbərliyimizlə məsləhətləşib 24 saat ərzində Sizinlə əlaqə saxlayacağıq.
Bunun üçün əlaqə nömrənizi ala bilərəmmi?"

Nümunə 4 — Paket razılaşması:
Müştəri: "Bəli, bu variant mənə uyğundur"
Sən: "Əla! Rezervasiyanı təsdiqləmək üçün bir neçə məlumat lazımdır.
Adınız, soyadınız necədir?"

Nümunə 5 — Gizli paket (xüsusi təklif):
Müştəri: "Antalyaya bir şey varmı, büdcəm 800 AZN-dir"
Sən: "Sizin üçün xüsusi bir variant var — bu paket hər kəsə açıq deyil, seçilmiş müştərilərə təqdim edirik.

━━━━━━━━━━━━━━━━━━━
✈️ Antalya — Xüsusi Paket
━━━━━━━━━━━━━━━━━━━
🏨 Otel: Rixos Sungate ★★★★★
🛫 Uçuş: Bakı → Antalya (birbaşa)
📅 Müddət: 7 gecə

💰 Qiymət: 780 AZN (~$459)
✔️ Daxildir: Uçuş, otel, transfer
━━━━━━━━━━━━━━━━━━━

Büdcənizə tam uyğundur. Hansı tarixlər sizə əlverişlidir?"

Nümunə 6 — Upgrade təklifi:
Müştəri: "Antalya 7 gecəlik turunuzu götürürəm"
Sən: "Əla seçim! Bu tur həqiqətən çox yaxşıdır.

Bir şeyi də qeyd etmək istəyirəm — cəmi 150 AZN əlavə ilə 5 ulduzlu All Inclusive oteldə qalmaq imkanı var. Eyni uçuş, eyni transfer, sadəcə otel daha premium.
Maraqlanırsınız, yoxsa mövcud variantla davam edək?"`;


// Şəhər → SkyId mapping
const CITY_SKY_ID: Record<string, string> = {
  istanbul: "IST", türkiyə: "IST", turkey: "IST", antalya: "AYT",
  ankara: "ESB", izmir: "ADB", dubai: "DXB", əbu: "AUH",
  paris: "CDG", fransa: "CDG", london: "LHR", ingiltərə: "LHR",
  berlin: "BER", almaniya: "BER", moskva: "SVO", rusiya: "SVO",
  amsterdam: "AMS", roma: "FCO", italiya: "FCO", barselona: "BCN",
  madrid: "MAD", münhen: "MUC", prag: "PRG", varşava: "WAW",
  budapeşt: "BUD", tbilisi: "TBS", gürcüstan: "TBS",
  beijing: "PEK", çin: "PEK", tokyo: "NRT", yaponiya: "NRT",
  banqkok: "BKK", tailand: "BKK", bali: "DPS", indoneziya: "CGK",
  maldiv: "MLE", mısır: "CAI", misir: "CAI", qahirə: "CAI",
  şarm: "SSH", hurgada: "HRG",
};

function detectFlightIntent(
  msg: string,
  history: { role: string; content: string }[]
): { originSkyId: string; destinationSkyId: string; departureDate: string; returnDate?: string; adults: number } | null {
  const combined = [msg, ...history.slice(-4).map(h => h.content)].join(" ").toLowerCase();

  // Uçuş intent yoxla
  const flightKeywords = /uçuş|bilet|avia|flight|fly|gedib-qayıt|birbaşa uçuş|uçaq/i;
  if (!flightKeywords.test(combined)) return null;

  // Destinasiya tap
  let destSkyId = "";
  for (const [city, skyId] of Object.entries(CITY_SKY_ID)) {
    if (combined.includes(city)) { destSkyId = skyId; break; }
  }
  if (!destSkyId) return null;

  // Tarix tap — sadə: gələn 30 gün ərzində ən yaxın tarix
  const dateMatch = combined.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);
  let departureDate = "";
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3]) : new Date().getFullYear();
    departureDate = `${year}-${month}-${day}`;
  } else {
    // Default: 2 həftə sonra
    const d = new Date();
    d.setDate(d.getDate() + 14);
    departureDate = d.toISOString().split("T")[0];
  }

  // Qayıdış tarixi — default: 7 gün sonra
  const ret = new Date(departureDate);
  ret.setDate(ret.getDate() + 7);
  const returnDate = ret.toISOString().split("T")[0];

  // Nəfər sayı
  const personsMatch = combined.match(/(\d+)\s*(?:nəfər|adam|person|adult)/);
  const adults = personsMatch ? parseInt(personsMatch[1]) : 1;

  return { originSkyId: "GYD", destinationSkyId: destSkyId, departureDate, returnDate, adults };
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

export async function getAIResponse(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  media?: MediaInput
): Promise<AIResponse> {
  let userContent: Anthropic.MessageParam["content"];

  if (media) {
    const mediaLabel = media.mediaType || "şəkil";
    const textPrompt = userMessage || `Müştəri bir ${mediaLabel} göndərdi. Bu tur ilə əlaqəli ola bilər? Müştəriyə cavab ver.`;

    if (media.type === "url" && media.url) {
      userContent = [
        { type: "image", source: { type: "url", url: media.url } },
        { type: "text", text: textPrompt },
      ];
    } else if (media.type === "base64" && media.data && media.mimeType) {
      const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (supportedTypes.includes(media.mimeType)) {
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
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Mən ${mediaLabel} fayllarını oxuya bilmirəm. Müştəriyə mehriban şəkildə cavab ver: mətn yazaraq sualını bildirsin, kömək etməyə hazırsan.`;
      } else {
        userContent = `Müştəri bir ${mediaLabel} göndərdi. Bunu qeyd edib müştəriyə sualını mətnlə bildirməsini xahiş et.`;
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

  // Real tur məlumatlarını system prompt-a inject et (smart filter ilə)
  const msgText = typeof userContent === "string" ? userContent : userMessage;
  const toursContext = await getToursContext(msgText);
  const systemWithTours = SYSTEM_PROMPT.replace(
    "{TOURS_CONTEXT}",
    toursContext || "Hal-hazırda aktiv tur məlumatı yoxdur."
  );

  // Uçuş axtarışı intent-i
  let flightsContext = "Uçuş axtarışı tələb edilməyib.";
  try {
    const flightIntent = detectFlightIntent(msgText, conversationHistory);
    if (flightIntent) {
      const flights = await searchRoundtripFlights(flightIntent);
      if (flights.length > 0) {
        flightsContext = `Bakı (GYD) → ${flightIntent.destinationSkyId} üçün real uçuş qiymətləri (15% komissiya daxil):\n${formatFlightForAI(flights, "USD")}`;
      } else {
        flightsContext = "Bu istiqamət üçün uçuş tapılmadı.";
      }
    }
  } catch {
    // Uçuş API xətası cavabı bloklamasın
  }

  const systemWithFlights = systemWithTours.replace("{FLIGHTS_CONTEXT}", flightsContext);

  // Uğurlu satış nümunələrini əlavə et
  const destinationMatch = msgText.match(/antalya|dubai|bali|paris|rome|roma|istanbul|istanbul|maldiv|türkiy|ərəb|avropa/i);
  const detectedDest = destinationMatch ? destinationMatch[0] : null;
  const examples = await getExamples(detectedDest);
  const systemFinal = systemWithFlights + formatExamplesForPrompt(examples);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    thinking: {
      type: "enabled",
      budget_tokens: 5000,
    },
    system: systemFinal,
    messages,
  });

  // Thinking bloklarını keç, yalnız text blokunu al
  const textBlock = response.content.find((b) => b.type === "text");
  const fullText = textBlock?.type === "text" ? textBlock.text : "";

  // customer_data JSON-u çıxar
  const jsonMatch = fullText.match(
    /<customer_data>([\s\S]*?)<\/customer_data>/
  );
  let customerData: CustomerData = {
    name: null,
    phone: null,
    email: null,
    destination: null,
    travel_date: null,
  };

  if (jsonMatch) {
    try {
      customerData = JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Cavabdan customer_data hissəsini çıxar
  const message = fullText.replace(/<customer_data>[\s\S]*?<\/customer_data>/, "").trim();

  return { message, customerData };
}
