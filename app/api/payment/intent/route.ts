import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/require-auth";
import { createPaymentIntent, isStripeConfigured } from "@/lib/stripe";
import type { ServiceType } from "@/lib/booking/confirmation-gate";

// Faza 1/4 — Creates the single payment for a confirmed trip.
// An account is required before paying (master spec), so the traveller always
// has somewhere for their booking, documents and points to land.

interface SelectionInput {
  service: ServiceType;
  optionId: string;
  priceUsd: number;
}

const MAX_TOTAL_USD = 100_000; // sanity ceiling; anything above is a bug or abuse

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not enabled yet." },
      { status: 503 },
    );
  }

  let body: { selections?: SelectionInput[]; experienceSlug?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const selections = Array.isArray(body.selections) ? body.selections : [];
  if (selections.length === 0) {
    return NextResponse.json({ error: "No confirmed services to pay for" }, { status: 400 });
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

  try {
    // The selections are recorded in metadata so /api/booking/execute can prove
    // the intent it is given belongs to this user and this set of services.
    const intent = await createPaymentIntent({
      amountUsd: total,
      description: body.experienceSlug
        ? `Natoure trip — ${body.experienceSlug}`
        : "Natoure trip",
      receiptEmail: body.email,
      metadata: {
        user_id: auth.userId,
        experience_slug: body.experienceSlug ?? "",
        services: selections.map((s) => s.service).join(","),
        option_ids: selections.map((s) => s.optionId).join(","),
      },
    });

    return NextResponse.json({
      paymentIntentId: intent.id,
      clientSecret: intent.clientSecret,
      amountUsd: intent.amountUsd,
    });
  } catch (err: unknown) {
    console.error("[Payment/Intent]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Could not start payment." }, { status: 500 });
  }
}
