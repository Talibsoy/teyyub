import { NextRequest, NextResponse }          from "next/server";
import { searchFlights, formatOffersForAI }   from "@/lib/duffel";
import { requireAuth, isAuthError }           from "@/lib/require-auth";

const IATA_RE   = /^[A-Z]{3}$/;
const DATE_RE   = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  let body: { origin?: string; destination?: string; date?: string; return_date?: string; passengers?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış JSON formatı" }, { status: 400 });
  }

  const { origin, destination, date, return_date, passengers } = body;

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: "origin, destination və date tələb olunur" }, { status: 400 });
  }
  if (!IATA_RE.test(origin.toUpperCase())) {
    return NextResponse.json({ error: "origin düzgün IATA kodu deyil (məs. GYD)" }, { status: 400 });
  }
  if (!IATA_RE.test(destination.toUpperCase())) {
    return NextResponse.json({ error: "destination düzgün IATA kodu deyil (məs. AYT)" }, { status: 400 });
  }
  if (!DATE_RE.test(date) || new Date(date) <= new Date()) {
    return NextResponse.json({ error: "date gələcək tarix olmalıdır (YYYY-MM-DD)" }, { status: 400 });
  }
  if (return_date && (!DATE_RE.test(return_date) || return_date <= date)) {
    return NextResponse.json({ error: "return_date, date-dən sonra olmalıdır" }, { status: 400 });
  }
  if (passengers !== undefined && (typeof passengers !== "number" || passengers < 1 || passengers > 9)) {
    return NextResponse.json({ error: "passengers 1–9 arası olmalıdır" }, { status: 400 });
  }

  try {
    const offers = await searchFlights({
      origin:       origin.toUpperCase(),
      destination:  destination.toUpperCase(),
      date,
      return_date,
      passengers,
    });

    return NextResponse.json({
      offers,
      formatted: formatOffersForAI(offers),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Flights/Search]", msg);
    return NextResponse.json({ error: "Uçuş axtarışı zamanı xəta baş verdi" }, { status: 500 });
  }
}
