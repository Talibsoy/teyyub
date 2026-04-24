import { getSupabaseAdmin } from "./supabase";

// ─── 1. TUR MÖVCUDLUĞu ────────────────────────────────────────────────────────
export async function checkTourAvailability(
  destination?: string,
  month?: string
): Promise<string> {
  try {
    const admin = getSupabaseAdmin();
    let query = admin
      .from("tours")
      .select("id, name, price_azn, start_date, end_date, destination, max_seats, booked_seats, hotel")
      .eq("is_active", true)
      .order("start_date", { ascending: true })
      .limit(6);

    if (destination) {
      query = query.ilike("destination", `%${destination}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return destination
        ? `${destination} istiqaməti üçün hal-hazırda aktiv tur tapılmadı.`
        : "Hal-hazırda aktiv tur yoxdur.";
    }

    // Month filter client-side
    let filtered = data;
    if (month) {
      const monthMap: Record<string, number> = {
        yanvar: 1, fevral: 2, mart: 3, aprel: 4, may: 5, iyun: 6,
        iyul: 7, avqust: 8, sentyabr: 9, oktyabr: 10, noyabr: 11, dekabr: 12,
        january: 1, february: 2, march: 3, april: 4, june: 6, july: 7,
        august: 8, september: 9, october: 10, november: 11, december: 12,
      };
      const mNum = monthMap[month.toLowerCase()];
      if (mNum) {
        filtered = data.filter(t => {
          if (!t.start_date) return true;
          return new Date(t.start_date).getMonth() + 1 === mNum;
        });
      }
    }

    if (filtered.length === 0) return `${month || destination} üçün uyğun tur tapılmadı.`;

    return filtered.map(t => {
      const seatsLeft = (t.max_seats ?? 0) - (t.booked_seats ?? 0);
      const dates = t.start_date
        ? `${t.start_date}${t.end_date ? " – " + t.end_date : ""}`
        : "tarix açıq";
      const hotel = t.hotel ? ` | ${t.hotel}` : "";
      return `[TUR_ID:${t.id}] ${t.name} | ${t.price_azn} AZN${hotel} | ${dates} | ${seatsLeft} yer`;
    }).join("\n");
  } catch (e) {
    return `Tur məlumatı alınarkən xəta: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// ─── 2. HAVA PROQNOZU ─────────────────────────────────────────────────────────
export async function getWeatherForecast(city: string, date?: string): Promise<string> {
  try {
    // wttr.in — API key tələb etmir
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t,+%h+rütubət,+%w+külək&lang=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = (await res.text()).trim();

    // Aylıq orta temperatur məlumatı da əlavə et
    const monthInfo = getMonthlyClimate(city, date);
    return `${city}: ${text}${monthInfo ? "\n" + monthInfo : ""}`;
  } catch {
    // Fallback — statik məlumat
    return getStaticClimate(city, date);
  }
}

function getMonthlyClimate(city: string, date?: string): string {
  if (!date) return "";
  const month = new Date(date).getMonth() + 1;
  const c = city.toLowerCase();

  if (c.includes("antalya") || c.includes("turkey") || c.includes("istanbul")) {
    const temps: Record<number, string> = {
      6: "İyun: orta 28°C, dəniz 24°C — ideal çimər vaxtı",
      7: "İyul: orta 33°C, dəniz 26°C — çox isti",
      8: "Avqust: orta 33°C, dəniz 27°C — ən isti ay",
      9: "Sentyabr: orta 27°C, dəniz 25°C — mükəmməl hava",
    };
    return temps[month] || "";
  }
  if (c.includes("dubai")) {
    const temps: Record<number, string> = {
      5: "May: orta 37°C — çox isti, günəş kremi şərt",
      6: "İyun: orta 40°C — ekstremal istilik",
      11: "Noyabr: orta 28°C — ideal mövsüm",
      12: "Dekabr: orta 23°C — ən yaxşı vaxt",
    };
    return temps[month] || "";
  }
  return "";
}

function getStaticClimate(city: string, date?: string): string {
  const c = city.toLowerCase();
  const month = date ? new Date(date).getMonth() + 1 : null;

  if (c.includes("antalya")) return month && month >= 5 && month <= 10
    ? "Antalya: isti və günəşli (25-35°C), dəniz çiməri üçün ideal mövsüm"
    : "Antalya: mülayim hava (15-20°C), dəniz çiməri üçün erkən/gec mövsüm";

  if (c.includes("dubai")) return month && (month >= 11 || month <= 4)
    ? "Dubai: ideal hava (22-28°C), turist mövsümü"
    : "Dubai: ekstremal istilik (38-45°C), açıq havada olmaq tövsiyə edilmir";

  if (c.includes("bali")) return "Bali: tropik, isti (27-32°C). Quru mövsüm: may-oktyabr";

  if (c.includes("maldiv") || c.includes("male")) return "Maldiv: isti (28-31°C), dəniz 29°C. İl boyu gözəl hava";

  return `${city} üçün hava məlumatı hazırda əlçatan deyil.`;
}

// ─── 3. VALYUTA MƏZƏNNƏSİ ────────────────────────────────────────────────────
export async function getExchangeRate(): Promise<string> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=AZN,EUR,GBP,TRY",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const azn = data.rates?.AZN?.toFixed(2) ?? "1.70";
    const eur = data.rates?.EUR?.toFixed(3) ?? "0.92";
    const eurAzn = data.rates?.AZN && data.rates?.EUR
      ? (data.rates.AZN / data.rates.EUR).toFixed(2)
      : "1.85";

    return [
      `Cari məzənnə (Frankfurt):`,
      `• $1 = ${azn} AZN`,
      `• €1 = ${eurAzn} AZN`,
      `• £1 = ${data.rates?.GBP ? (data.rates.AZN / data.rates.GBP).toFixed(2) : "2.15"} AZN`,
    ].join("\n");
  } catch {
    return "$1 = 1.70 AZN | €1 = 1.85 AZN (təxmini məzənnə)";
  }
}

// ─── 4. PAKET QİYMƏT HESABLAMA ───────────────────────────────────────────────
export function calculatePackage(params: {
  flight_price_usd: number;
  hotel_price_usd_per_night: number;
  nights: number;
  passengers: number;
  include_transfer?: boolean;
}): string {
  const { flight_price_usd, hotel_price_usd_per_night, nights, passengers, include_transfer } = params;
  const COMMISSION = 1.15;
  const AZN_RATE = 1.70;

  const flightTotal = flight_price_usd * passengers;
  const hotelTotal = hotel_price_usd_per_night * nights;
  const transferUsd = include_transfer ? 30 * passengers : 0;
  const subtotalUsd = flightTotal + hotelTotal + transferUsd;
  const totalUsd = Math.ceil(subtotalUsd * COMMISSION);
  const totalAzn = Math.ceil(totalUsd * AZN_RATE);
  const perPersonUsd = Math.ceil(totalUsd / passengers);
  const perPersonAzn = Math.ceil(perPersonUsd * AZN_RATE);

  return [
    `Paket hesablaması (${passengers} nəfər, ${nights} gecə):`,
    `• Uçuş: $${flightTotal} (${passengers} nəfər)`,
    `• Otel: $${hotelTotal} (${nights} gecə × $${hotel_price_usd_per_night})`,
    include_transfer ? `• Transfer: $${transferUsd}` : null,
    `• Komissiya (15%): $${Math.ceil(subtotalUsd * 0.15)}`,
    `─────────────────`,
    `💰 Cəmi: ${totalAzn} AZN (~$${totalUsd})`,
    `💰 Nəfər başına: ${perPersonAzn} AZN (~$${perPersonUsd})`,
  ].filter(Boolean).join("\n");
}

// ─── 5. CRM-Ə LEAD SAXLA ─────────────────────────────────────────────────────
export async function saveLeadToCRM(params: {
  name?: string;
  phone?: string;
  email?: string;
  destination?: string;
  travel_date?: string;
  budget?: string;
  notes?: string;
}): Promise<string> {
  try {
    if (!params.phone && !params.email && !params.name) {
      return "Ən azı ad, telefon və ya email lazımdır.";
    }

    const admin = getSupabaseAdmin();
    const senderId = params.phone || params.email || `ai_${Date.now()}`;

    const { error } = await admin.from("leads").upsert({
      sender_id: senderId,
      platform: "chatbot_ai",
      name: params.name || null,
      phone: params.phone || null,
      email: params.email || null,
      destination: params.destination || null,
      travel_date: params.travel_date || null,
      status: "new",
      notes: [
        params.budget ? `Büdcə: ${params.budget}` : null,
        params.notes || null,
      ].filter(Boolean).join(" | ") || null,
      created_at: new Date().toISOString(),
    }, { onConflict: "sender_id,platform" });

    if (error) throw error;
    return `✅ Müştəri məlumatları CRM-ə qeyd edildi. Komandamız ${params.phone || params.email || "müştəri"} ilə əlaqə saxlayacaq.`;
  } catch (e) {
    return `CRM qeyd xətası: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// ─── 6. VİZA MƏLUMATI ────────────────────────────────────────────────────────
export function getVisaInfo(destination: string): string {
  const d = destination.toLowerCase();

  if (d.includes("turk") || d.includes("istanbul") || d.includes("antalya") || d.includes("ankara")) {
    return "Türkiyə: Azərbaycan vətəndaşları üçün VİZA LAZIM DEYİL. Şəxsiyyət vəsiqəsi kifayətdir.";
  }
  if (d.includes("dubai") || d.includes("uae") || d.includes("abu dhabi")) {
    return "BƏƏ (Dubai): E-viza lazımdır. Biz visa işlərini həll edirik — ~30$ + 3 iş günü.";
  }
  if (d.includes("schengen") || d.includes("paris") || d.includes("berlin") || d.includes("amsterdam") || d.includes("roma") || d.includes("barselona") || d.includes("madrid") || d.includes("prag") || d.includes("varşava") || d.includes("budapes") || d.includes("munhen")) {
    return "Şengen: Viza tələb olunur. Biz visa dəstəyi göstəririk — sənədləşmə, müraciət. Orta müddət 10-15 iş günü.";
  }
  if (d.includes("georgia") || d.includes("gürcüstan") || d.includes("tbilisi")) {
    return "Gürcüstan: VİZA LAZIM DEYİL. Şəxsiyyət vəsiqəsi ilə daxil olmaq mümkündür.";
  }
  if (d.includes("maldiv") || d.includes("male")) {
    return "Maldiv: Azərbaycan pasportu ilə ON ARRIVAL viza (30 gün, pulsuz).";
  }
  if (d.includes("thai") || d.includes("bangkok") || d.includes("bali") || d.includes("indonez")) {
    return d.includes("bali") || d.includes("indonez")
      ? "İndoneziya (Bali): On Arrival viza mövcuddur — $35, 30 gün."
      : "Tailand: Azərbaycan vətəndaşları üçün 30 gün vizasız.";
  }
  if (d.includes("qatar") || d.includes("doha")) {
    return "Qətər: E-viza tələb olunur. Biz həll edirik — ~25$, 1-2 iş günü.";
  }
  if (d.includes("egypt") || d.includes("misir") || d.includes("şarm") || d.includes("hurgada") || d.includes("qahire")) {
    return "Misir: On Arrival viza — $25, aeroportda alınır. Biz əvvəlcədən e-viza da düzəldirik.";
  }

  return `${destination} üçün viza məlumatı: Komandamız ətraflı məlumat verəcək. Pasportunuzun etibarlılıq müddəti 6 aydan çox olmalıdır.`;
}
