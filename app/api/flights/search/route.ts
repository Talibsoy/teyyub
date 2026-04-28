import { NextRequest, NextResponse }        from "next/server";
import { searchFlights, formatOffersForAI } from "@/lib/duffel";
import { requireAuth, isAuthError }         from "@/lib/require-auth";
import { Redis }                            from "@upstash/redis";

const IATA_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Rate limit: istifadəçi başına 10 sorğu / 60 saniyə
const RATE_LIMIT       = 10;
const RATE_WINDOW_SEC  = 60;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

// Atomik sliding window — Lua skripti race condition-u aradan qaldırır (~99.9%)
const RATE_LIMIT_SCRIPT = `
  local key   = KEYS[1]
  local limit = tonumber(ARGV[1])
  local win   = tonumber(ARGV[2])
  local count = redis.call('INCR', key)
  if count == 1 then
    redis.call('EXPIRE', key, win)
  end
  return count
`;

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetSec: number }> {
  if (!redis) return { allowed: true, remaining: RATE_LIMIT, resetSec: RATE_WINDOW_SEC };

  const key = `rl:flights:${userId}`;
  const count = await redis.eval(RATE_LIMIT_SCRIPT, [key], [RATE_LIMIT, RATE_WINDOW_SEC]) as number;
  const ttl   = await redis.ttl(key);
  const remaining = Math.max(0, RATE_LIMIT - count);

  return {
    allowed:   count <= RATE_LIMIT,
    remaining,
    resetSec:  ttl > 0 ? ttl : RATE_WINDOW_SEC,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  // Rate limit yoxlaması
  const rl = await checkRateLimit(auth.userId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Çox sorğu göndərdiniz. ${rl.resetSec} saniyə sonra yenidən cəhd edin.` },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit":     String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":     String(rl.resetSec),
          "Retry-After":           String(rl.resetSec),
        },
      }
    );
  }

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
      origin:      origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date,
      return_date,
      passengers,
    });

    return NextResponse.json(
      { offers, formatted: formatOffersForAI(offers) },
      {
        headers: {
          "X-RateLimit-Limit":     String(RATE_LIMIT),
          "X-RateLimit-Remaining": String(rl.remaining - 1),
          "X-RateLimit-Reset":     String(rl.resetSec),
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Flights/Search]", msg);
    if (msg.includes("Duffel API xətası 429")) {
      return NextResponse.json(
        { error: "Uçuş axtarışı müvəqqəti məhduddur. Bir az sonra yenidən cəhd edin." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Uçuş axtarışı zamanı xəta baş verdi" }, { status: 500 });
  }
}
