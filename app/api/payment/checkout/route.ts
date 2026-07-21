import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/require-auth";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import {
  savePendingBooking,
  isPendingStoreAvailable,
  type PendingBooking,
  type PendingSelection,
} from "@/lib/pending-booking";
import { buildSagaSteps, validateSagaExecutable } from "@/lib/booking/orchestrator";
import { buildExecutors } from "@/lib/booking/executors";

// Faza 1/4 — Starts the single payment via Stripe hosted Checkout.
//
// The critical guard lives here, BEFORE any money moves: if any confirmed
// service has no working booking provider, we refuse to take payment at all.

const MAX_TOTAL_USD = 100_000;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not enabled yet." }, { status: 503 });
  }
  if (!isPendingStoreAvailable()) {
    // Without shared storage the traveller's details would be lost on return
    // from Stripe — refuse rather than risk a paid booking we cannot fulfil.
    return NextResponse.json(
      { error: "Booking storage is unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  let body: Partial<PendingBooking>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const selections: PendingSelection[] = Array.isArray(body.selections) ? body.selections : [];
  if (selections.length === 0) {
    return NextResponse.json({ error: "No confirmed services to pay for" }, { status: 400 });
  }
  if (!body.phone) {
    return NextResponse.json({ error: "A contact phone number is required" }, { status: 400 });
  }

  for (const s of selections) {
    if (!s.service || typeof s.optionId !== "string" || !s.optionId) {
      return NextResponse.json({ error: "Each selection needs a service and optionId" }, { status: 400 });
    }
    if (typeof s.priceUsd !== "number" || !Number.isFinite(s.priceUsd) || s.priceUsd <= 0) {
      return NextResponse.json({ error: "Each selection needs a positive price" }, { status: 400 });
    }
  }

  const total = selections.reduce((sum, s) => sum + s.priceUsd, 0);
  if (total <= 0 || total > MAX_TOTAL_USD) {
    return NextResponse.json({ error: "Trip total is out of range" }, { status: 400 });
  }

  // ── Refuse to charge for anything we cannot actually book ─────────────────
  const steps = buildSagaSteps(selections);
  const executors = buildExecutors({
    passengers: body.passengers ?? [],
    hotel: {
      guests: body.guests ?? [],
      phone: body.phone,
      email: process.env.BOOKING_EMAIL,
    },
  });

  const unbookable = validateSagaExecutable(steps, executors);
  if (unbookable.length > 0) {
    return NextResponse.json(
      {
        error: `We cannot book these services online yet: ${unbookable.join(", ")}. Remove them to continue.`,
        unbookable,
      },
      { status: 409 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000";

  try {
    const session = await createCheckoutSession({
      amountUsd: total,
      productName: body.experienceSlug
        ? `Natoure trip — ${body.experienceSlug}`
        : "Natoure trip",
      successUrl: `${origin}/booking/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/plan?checkout=cancelled`,
      customerEmail: body.email,
      metadata: {
        user_id: auth.userId,
        experience_slug: body.experienceSlug ?? "",
      },
    });

    const stored = await savePendingBooking(session.id, {
      userId: auth.userId,
      selections,
      passengers: body.passengers ?? [],
      guests: body.guests ?? [],
      phone: body.phone,
      email: body.email,
      experienceSlug: body.experienceSlug,
    });

    if (!stored) {
      return NextResponse.json(
        { error: "Could not save your booking details. Please try again." },
        { status: 503 },
      );
    }

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err: unknown) {
    console.error("[Payment/Checkout]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
