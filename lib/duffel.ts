const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || "";
const DUFFEL_BASE = "https://api.duffel.com";
const COMMISSION = 1.17; // 17%

// Ehtiyat kurslar (CBAR cavab verməsə istifadə olunur)
const FALLBACK_AZN: Record<string, number> = {
  USD: 1.70, EUR: 1.87, GBP: 2.16, AED: 0.463,
  TRY: 0.052, RUB: 0.019, GEL: 0.62,
};

// In-memory cache — 1 saat etibarlıdır
let rateCache: { rates: Record<string, number>; fetchedAt: number } | null = null;

async function getAznRates(): Promise<Record<string, number>> {
  const ONE_HOUR = 60 * 60 * 1000;
  if (rateCache && Date.now() - rateCache.fetchedAt < ONE_HOUR) {
    return rateCache.rates;
  }

  try {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const url = `https://www.cbar.az/currencies/${dd}.${mm}.${yyyy}.xml`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error("CBAR cavab vermədi");

    const xml = await res.text();
    const rates: Record<string, number> = {};

    // <Valute Code="GBP">...<Value>2.2500</Value>
    const matches = xml.matchAll(/<Valute Code="([A-Z]+)"[^>]*>[\s\S]*?<Value>([\d.]+)<\/Value>/g);
    for (const m of matches) {
      rates[m[1]] = parseFloat(m[2]);
    }

    if (Object.keys(rates).length > 0) {
      rateCache = { rates, fetchedAt: Date.now() };
      console.log(`[CBAR] Məzənnələr yeniləndi: GBP=${rates.GBP} USD=${rates.USD} EUR=${rates.EUR}`);
      return rates;
    }
  } catch (e) {
    console.warn("[CBAR] Məzənnə alınmadı, ehtiyat kurslar istifadə olunur:", e);
  }

  return FALLBACK_AZN;
}

const headers = () => ({
  Authorization: `Bearer ${DUFFEL_API_KEY}`,
  "Duffel-Version": "v2",
  "Content-Type": "application/json",
  Accept: "application/json",
});

function toAzn(amount: number, currency: string, rates: Record<string, number>): number {
  // Əvvəl canlı kurs, sonra ehtiyat kurs (valyutaya uyğun), son çarə USD ehtiyatı
  const rate = rates[currency] ?? FALLBACK_AZN[currency] ?? FALLBACK_AZN["USD"];
  return Math.ceil(amount * rate);
}

export interface FlightOffer {
  offer_id: string;
  airline: string;
  price_usd: number;
  price_azn: number;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  cabin_baggage: number;
  checked_baggage: number;
  extra_bag_kg: number;
  extra_bag_azn: number;
  is_round_trip: boolean;
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  return_date?: string; // varsa → gediş-dönüş
  passengers?: number;
}

// Bir offer üçün available_services-dən ən ucuz bagaj xidmətini çək
async function fetchBaggageService(
  offerId: string,
  rates: Record<string, number>
): Promise<{ kg: number; azn: number }> {
  try {
    const res = await fetch(
      `${DUFFEL_BASE}/air/offers/${offerId}/available_services`,
      { headers: headers(), signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { kg: 0, azn: 0 };

    const data = await res.json();
    const services: Record<string, unknown>[] = data?.data ?? [];

    const baggageServices = services.filter(s => s.type === "baggage");
    if (!baggageServices.length) return { kg: 0, azn: 0 };

    const cheapest = baggageServices.sort(
      (a, b) =>
        parseFloat(a.total_amount as string) -
        parseFloat(b.total_amount as string)
    )[0];

    const kg = (cheapest.maximum_weight_kg as number) || 0;
    const amount = parseFloat(cheapest.total_amount as string) || 0;
    const currency = (cheapest.total_currency as string) || "USD";
    const azn = toAzn(amount * COMMISSION, currency, rates);

    return { kg, azn };
  } catch {
    return { kg: 0, azn: 0 };
  }
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  if (!DUFFEL_API_KEY) throw new Error("DUFFEL_API_KEY tapılmadı");

  const passengerCount = params.passengers || 1;

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        slices: [
          {
            origin: params.origin,
            destination: params.destination,
            departure_date: params.date,
          },
          ...(params.return_date ? [{
            origin: params.destination,
            destination: params.origin,
            departure_date: params.return_date,
          }] : []),
        ],
        passengers: Array.from({ length: passengerCount }, () => ({ type: "adult" })),
        cabin_class: "economy",
      },
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Duffel API xətası ${res.status}: ${err}`);
  }

  const data = await res.json();
  const offers = data?.data?.offers || [];

  // CBAR-dan real valyuta kurslarını al
  const aznRates = await getAznRates();

  // Bütün offerləri logla — portal vs API fərqini görmək üçün
  console.log(`[OFFERS] Cəmi ${offers.length} offer. İlk 5:`);
  offers.slice(0, 5).forEach((o: Record<string, unknown>, i: number) => {
    console.log(`  #${i+1} id=${o.id} amount=${o.total_amount} ${o.total_currency}`);
  });

  // AZN-ə çevirib sırala — valyutadan asılı düzgün müqayisə
  const sorted = [...offers].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aAzn = toAzn(parseFloat(a.total_amount as string), (a.total_currency as string) || "USD", aznRates);
    const bAzn = toAzn(parseFloat(b.total_amount as string), (b.total_currency as string) || "USD", aznRates);
    return aAzn - bAzn;
  });
  const top3 = sorted.slice(0, 3);

  // Hər offer üçün available_services-i parallel çək
  const baggageMap = await Promise.all(
    top3.map((o: Record<string, unknown>) =>
      fetchBaggageService(o.id as string, aznRates)
    )
  );

  return top3.map((offer: Record<string, unknown>, idx: number) => {
    const slices = (offer.slices as Record<string, unknown>[]) || [];
    const firstSlice = slices[0] || {};
    const segments = (firstSlice.segments as Record<string, unknown>[]) || [];
    const firstSeg = segments[0] || {};
    const lastSeg = segments[segments.length - 1] || {};
    const carrier = (firstSeg.operating_carrier as Record<string, unknown>) || {};

    const rawPrice = parseFloat(offer.total_amount as string) || 0;
    const currency = (offer.total_currency as string) || "USD";
    const priceAzn = toAzn(rawPrice * COMMISSION, currency, aznRates);
    const priceWithComm = Math.ceil(rawPrice * COMMISSION); // USD, markup daxil

    const depTime = (firstSeg.departing_at as string) || "";
    const arrTime = (lastSeg.arriving_at as string) || "";
    const durRaw = (firstSlice.duration as string) || "";
    const durHMatch = durRaw.match(/(\d+)H/);
    const durMMatch = durRaw.match(/(\d+)M/);
    const durationMin = (parseInt(durHMatch?.[1] || "0") * 60) + parseInt(durMMatch?.[1] || "0");

    // Daxil olan bagaj
    const passengers = (offer.passengers as Record<string, unknown>[]) || [];
    const baggages = (passengers[0]?.baggages as Record<string, unknown>[]) || [];
    const cabinBag = baggages
      .filter(b => b.type === "carry_on")
      .reduce((s, b) => s + ((b.quantity as number) || 0), 0);
    const checkedBag = baggages
      .filter(b => b.type === "checked")
      .reduce((s, b) => s + ((b.quantity as number) || 0), 0);

    const { kg: extraKg, azn: extraAzn } = baggageMap[idx];

    console.log(`[PRICE] ${carrier.name} | raw=${rawPrice} ${currency} | ×${aznRates[currency] ?? 1.70}(AZN rate) ×${COMMISSION}(comm) = ${priceAzn} AZN`);

    return {
      offer_id: offer.id as string,
      airline: (carrier.name as string) || "Naməlum",
      price_usd: priceWithComm,
      price_azn: priceAzn,
      departure_time: depTime,
      arrival_time: arrTime,
      duration_minutes: durationMin,
      stops: segments.length - 1,
      cabin_baggage: cabinBag,
      checked_baggage: checkedBag,
      extra_bag_kg: extraKg,
      extra_bag_azn: extraAzn,
      is_round_trip: !!params.return_date,
    };
  });
}

export async function createOrder(params: {
  offer_id: string;
  given_name: string;
  family_name: string;
  born_on: string;
  email: string;
  phone?: string;
}): Promise<{ order_id: string; booking_ref: string }> {
  const res = await fetch(`${DUFFEL_BASE}/air/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        selected_offers: [params.offer_id],
        passengers: [{
          type: "adult",
          given_name: params.given_name,
          family_name: params.family_name,
          born_on: params.born_on,
          email: params.email,
          phone_number: params.phone || undefined,
        }],
        payments: [{
          type: "balance",
          currency: "USD",
          amount: "0",
        }],
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Duffel booking xətası ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    order_id: data?.data?.id || "",
    booking_ref: data?.data?.booking_reference || "",
  };
}

export function formatOffersForAI(offers: FlightOffer[]): string {
  if (!offers.length) return "Uçuş tapılmadı.";
  return offers.map((o, i) => {
    // Duffel vaxtları UTC-dir ("Z"). Göstərmək üçün formatlanmış string saxlanılır.
    // Müştəriyə "Bakı vaxtı ilə" qeyd olunur ki anlaşılmazlıq olmasın.
    const fmtTime = (iso: string) => {
      try { return new Date(iso).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku" }); }
      catch { return iso.slice(11, 16); }
    };
    const dep = o.departure_time ? fmtTime(o.departure_time) : "";
    const arr = o.arrival_time   ? fmtTime(o.arrival_time)   : "";
    const dur = o.duration_minutes
      ? `${Math.floor(o.duration_minutes / 60)}s ${o.duration_minutes % 60}d`
      : "";
    const stops = o.stops === 0 ? "Birbaşa" : `${o.stops} dayanacaq`;
    const tripType = o.is_round_trip ? "Gediş-dönüş" : "Birtərəfli";

    const includedBag = [
      o.cabin_baggage > 0 ? `${o.cabin_baggage} əl bagajı` : null,
      o.checked_baggage > 0 ? `${o.checked_baggage} yük bagajı` : null,
    ].filter(Boolean).join(" + ") || "bagaj daxil deyil";

    const extraBag = o.extra_bag_kg > 0
      ? `əlavə ${o.extra_bag_kg}kq: +${o.extra_bag_azn}₼`
      : "əlavə bagaj yoxdur";

    return `[FLIGHT_ID:${o.offer_id}] ${i + 1}. ${o.airline} [${tripType}] — ${o.price_azn} ₼ CƏMİ (bütün nəfərlər daxil, markup daxil) | ${dep}–${arr} | ${dur} | ${stops} | ${includedBag} | ${extraBag}`;
  }).join("\n");
}
