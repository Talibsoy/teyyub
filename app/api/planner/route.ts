import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildGroundedPlan, type GroundedPlanInput } from "@/lib/grounded-planner";

// Faza 2 — Grounded planner endpoint.
// Returns only real, provider-sourced options (Duffel / RateHawk). Services with
// no live inventory come back as `available: false` with an honest reason —
// this endpoint never invents flights, hotels, prices or availability.

const IATA_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// One call fans out to multiple providers, so keep this tighter than plain search.
const RATE_LIMIT = 5;
const RATE_WINDOW_SEC = 60;

export async function POST(req: NextRequest) {
  // Planning is public — organic (Flow 2) visitors plan before creating an account.
  // Signed-in users are limited per account, guests per IP.
  const auth = await requireAuth(req);
  const rateKey = isAuthError(auth)
    ? `planner:guest:${req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"}`
    : `planner:${auth.userId}`;

  const allowed = await checkRateLimit(rateKey, RATE_LIMIT, RATE_WINDOW_SEC);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many planning requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(RATE_WINDOW_SEC) } },
    );
  }

  let body: Partial<GroundedPlanInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { origin, destination, departDate, returnDate, checkin, checkout, travelers } = body;

  if (!destination || typeof destination !== "string" || !destination.trim()) {
    return NextResponse.json({ error: "destination is required" }, { status: 400 });
  }
  if (!departDate || !DATE_RE.test(departDate)) {
    return NextResponse.json({ error: "departDate must be a date in YYYY-MM-DD format" }, { status: 400 });
  }
  if (new Date(departDate) <= new Date()) {
    return NextResponse.json({ error: "departDate must be in the future" }, { status: 400 });
  }
  if (returnDate && (!DATE_RE.test(returnDate) || returnDate <= departDate)) {
    return NextResponse.json({ error: "returnDate must be after departDate" }, { status: 400 });
  }
  if (origin && !IATA_RE.test(origin.toUpperCase())) {
    return NextResponse.json({ error: "origin must be a 3-letter IATA code (e.g. AUS)" }, { status: 400 });
  }
  if (checkin && !DATE_RE.test(checkin)) {
    return NextResponse.json({ error: "checkin must be a date in YYYY-MM-DD format" }, { status: 400 });
  }
  if (checkout && (!DATE_RE.test(checkout) || (checkin ? checkout <= checkin : false))) {
    return NextResponse.json({ error: "checkout must be after checkin" }, { status: 400 });
  }
  if (travelers !== undefined && (typeof travelers !== "number" || travelers < 1 || travelers > 9)) {
    return NextResponse.json({ error: "travelers must be between 1 and 9" }, { status: 400 });
  }

  try {
    const plan = await buildGroundedPlan({
      origin: origin ? origin.toUpperCase() : undefined,
      destination: destination.trim(),
      departDate,
      returnDate,
      checkin,
      checkout,
      travelers,
    });

    return NextResponse.json(plan);
  } catch (err: unknown) {
    console.error("[Planner]", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Could not build a plan right now. Please try again." },
      { status: 500 },
    );
  }
}