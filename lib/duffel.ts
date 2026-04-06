const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || "";
const DUFFEL_BASE = "https://api.duffel.com";
const COMMISSION = 1.15; // 15%

// Valyutadan AZN-ə çevirmə cədvəli (təxmini sabit kurs)
const TO_AZN: Record<string, number> = {
  USD: 1.70,
  EUR: 1.87,
  GBP: 2.16,
  AED: 0.463,
  TRY: 0.052,
  RUB: 0.019,
  GEL: 0.62,
};

const headers = () => ({
  Authorization: `Bearer ${DUFFEL_API_KEY}`,
  "Duffel-Version": "v2",
  "Content-Type": "application/json",
  Accept: "application/json",
});

export interface FlightOffer {
  offer_id: string;
  airline: string;
  price_usd: number;
  price_azn: number;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  cabin_baggage: number;   // əl bagajı (ədəd)
  checked_baggage: number; // yükləmə bagajı (ədəd)
}

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
  passengers?: number;
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  if (!DUFFEL_API_KEY) throw new Error("DUFFEL_API_KEY tapılmadı");

  const passengerCount = params.passengers || 1;

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests?return_offers=true`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        slices: [{
          origin: params.origin,
          destination: params.destination,
          departure_date: params.date,
        }],
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

  // Ucuz 3-ü seç
  const sorted = [...offers].sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
    parseFloat(a.total_amount as string) - parseFloat(b.total_amount as string)
  );

  return sorted.slice(0, 3).map((offer: Record<string, unknown>) => {
    const slices = (offer.slices as Record<string, unknown>[]) || [];
    const firstSlice = slices[0] || {};
    const segments = (firstSlice.segments as Record<string, unknown>[]) || [];
    const firstSeg = segments[0] || {};
    const lastSeg = segments[segments.length - 1] || {};
    const carrier = (firstSeg.operating_carrier as Record<string, unknown>) || {};

    const rawPrice = parseFloat(offer.total_amount as string) || 0;
    const currency = (offer.total_currency as string) || "USD";
    const aznRate = TO_AZN[currency] ?? TO_AZN["USD"];
    const priceAzn = Math.ceil(rawPrice * aznRate * COMMISSION);
    // USD ekvivalenti (göstərmək üçün)
    const priceWithComm = Math.ceil(priceAzn / TO_AZN["USD"]);

    const depTime = (firstSeg.departing_at as string) || "";
    const arrTime = (lastSeg.arriving_at as string) || "";
    // duration "PT3H5M" formatında gəlir
    const durRaw = (firstSlice.duration as string) || "";
    const durHMatch = durRaw.match(/(\d+)H/);
    const durMMatch = durRaw.match(/(\d+)M/);
    const durationMin = (parseInt(durHMatch?.[1] || "0") * 60) + parseInt(durMMatch?.[1] || "0");

    // Bagaj məlumatı — offer.passengers[0].baggages[]
    const passengers = (offer.passengers as Record<string, unknown>[]) || [];
    const baggages = (passengers[0]?.baggages as Record<string, unknown>[]) || [];
    const cabinBag = baggages.filter(b => b.type === "carry_on").reduce((s, b) => s + ((b.quantity as number) || 0), 0);
    const checkedBag = baggages.filter(b => b.type === "checked").reduce((s, b) => s + ((b.quantity as number) || 0), 0);

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
    const dep = o.departure_time ? new Date(o.departure_time).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : "";
    const arr = o.arrival_time ? new Date(o.arrival_time).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : "";
    const dur = o.duration_minutes ? `${Math.floor(o.duration_minutes / 60)}s ${o.duration_minutes % 60}d` : "";
    const stops = o.stops === 0 ? "Birbaşa" : `${o.stops} dayanacaq`;
    const bagInfo = [
      o.cabin_baggage > 0 ? `${o.cabin_baggage} əl bagajı` : "əl bagajı yoxdur",
      o.checked_baggage > 0 ? `${o.checked_baggage} yük bagajı` : "yük bagajı yoxdur",
    ].join(", ");
    return `${i + 1}. ${o.airline} — ${o.price_azn} ₼ (~$${o.price_usd}) | ${dep}–${arr} | ${dur} | ${stops} | ${bagInfo} | ID: ${o.offer_id}`;
  }).join("\n");
}
