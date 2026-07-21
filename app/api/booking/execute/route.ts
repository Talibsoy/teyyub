import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/require-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { loadPendingBooking, clearPendingBooking } from "@/lib/pending-booking";
import {
  runBookingSaga,
  buildSagaSteps,
  validateSagaExecutable,
  type StepResult,
} from "@/lib/booking/orchestrator";
import { buildExecutors } from "@/lib/booking/executors";
import { awardBookingPoints, qualifyReferral } from "@/lib/loyalty";
import { sendOperatorAlert } from "@/lib/telegram";

// Faza 4 — Runs the booking saga after Stripe confirms payment.
//
// Nothing here is taken from the browser except the session id. The amount comes
// from Stripe and the selections come from the server-side pending record, so a
// customer cannot alter what they bought after paying.
//
// Guarantees, in order:
//   1. Payment verified with Stripe and tied to this account.
//   2. Services we cannot book are rejected before anything is booked.
//   3. Every provider call is persisted — a partial failure is auditable.
//   4. Irreversible leftovers escalate to staff instead of being hidden.

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not enabled yet." }, { status: 503 });
  }

  let body: { checkoutSessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = body.checkoutSessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "checkoutSessionId is required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // ── 1. Verify the payment with Stripe ─────────────────────────────────────
  let paidTotalUsd: number;
  let paymentRef: string;
  let contactEmail: string | null;
  try {
    const session = await retrieveCheckoutSession(sessionId);

    if (session.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: `Payment is not complete (status: ${session.paymentStatus}).` },
        { status: 402 },
      );
    }
    if (session.metadata.user_id && session.metadata.user_id !== auth.userId) {
      return NextResponse.json({ error: "This payment belongs to another account." }, { status: 403 });
    }

    paidTotalUsd = session.amountUsd;          // authoritative — from Stripe
    paymentRef = session.paymentIntentId ?? session.id;
    contactEmail = session.customerEmail;
  } catch (err: unknown) {
    console.error("[Booking/Execute] payment check failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Could not verify payment." }, { status: 502 });
  }

  // Idempotency: the same payment must never run the saga twice, even if the
  // customer refreshes the return page.
  const { data: existing } = await admin
    .from("booking_sagas")
    .select("id, status")
    .eq("payment_ref", paymentRef)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { sagaId: existing.id, status: existing.status, alreadyProcessed: true },
      { status: 200 },
    );
  }

  // ── 2. Recover the booking details saved before checkout ──────────────────
  const pending = await loadPendingBooking(sessionId);
  if (!pending) {
    await sendOperatorAlert(
      `⚠️ Paid booking with no pending record\nSession: ${sessionId}\nPaid: $${paidTotalUsd}\nUser: ${auth.userId}`,
    ).catch(() => { /* alerting must not mask the response */ });

    return NextResponse.json(
      { error: "We received your payment but lost the booking details. Our team has been alerted and will contact you." },
      { status: 500 },
    );
  }
  if (pending.userId !== auth.userId) {
    return NextResponse.json({ error: "This booking belongs to another account." }, { status: 403 });
  }

  // ── 3. Refuse anything we cannot actually book ────────────────────────────
  const steps = buildSagaSteps(pending.selections);
  const executors = buildExecutors({
    passengers: pending.passengers,
    hotel: {
      guests: pending.guests,
      phone: pending.phone,
      email: process.env.BOOKING_EMAIL || pending.email,
      partnerOrderId: `natoure_${sessionId.slice(-16)}`,
    },
  });

  const unbookable = validateSagaExecutable(steps, executors);
  if (unbookable.length > 0) {
    await sendOperatorAlert(
      `⚠️ Paid for unbookable services\nSession: ${sessionId}\nPaid: $${paidTotalUsd}\nServices: ${unbookable.join(", ")}`,
    ).catch(() => {});
    return NextResponse.json(
      { error: `We cannot book: ${unbookable.join(", ")}. Our team has been alerted and will refund you.` },
      { status: 409 },
    );
  }

  // ── 4. Open the saga record ───────────────────────────────────────────────
  const { data: saga, error: sagaError } = await admin
    .from("booking_sagas")
    .insert([{
      user_id: auth.userId,
      experience_slug: pending.experienceSlug ?? null,
      payment_ref: paymentRef,
      paid_total_usd: paidTotalUsd,
      status: "running",
      contact_email: contactEmail ?? pending.email ?? null,
    }])
    .select("id")
    .single();

  if (sagaError || !saga) {
    console.error("[Booking/Execute] could not open saga:", sagaError?.message);
    return NextResponse.json({ error: "Could not start booking." }, { status: 500 });
  }

  const sagaId = saga.id as string;
  const stepOrder = new Map(steps.map((s, i) => [s.service, i]));

  // ── 5. Run it, persisting every step ──────────────────────────────────────
  const result = await runBookingSaga(steps, executors, {
    async onStepStart(step) {
      await admin.from("booking_saga_steps").insert([{
        saga_id: sagaId,
        service: step.service,
        step_order: stepOrder.get(step.service) ?? 0,
        option_id: step.optionId,
        price_usd: step.priceUsd,
        reversible: step.reversible,
        status: "pending",
      }]);
    },
    async onStepResult(stepResult: StepResult) {
      await admin
        .from("booking_saga_steps")
        .update({
          status: stepResult.status,
          provider_ref: stepResult.providerRef ?? null,
          reason: stepResult.reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("saga_id", sagaId)
        .eq("service", stepResult.service);
    },
    async onManualInterventionRequired(results) {
      const stuck = results
        .filter((r) => r.status === "manual_intervention")
        .map((r) => `${r.service} (${r.providerRef ?? "no ref"})`)
        .join(", ");
      await sendOperatorAlert(
        `⚠️ Booking needs manual review\nSaga: ${sagaId}\nPaid: $${paidTotalUsd}\nStuck: ${stuck}`,
      ).catch(() => {});
    },
  });

  // ── 6. Close the saga ─────────────────────────────────────────────────────
  await admin
    .from("booking_sagas")
    .update({
      status: result.status,
      failed_service: result.failedService ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sagaId);

  await clearPendingBooking(sessionId);

  // ── 7. Loyalty — only for trips that actually completed ───────────────────
  if (result.status === "completed") {
    await awardBookingPoints({ userId: auth.userId, sagaId, usdAmount: paidTotalUsd });
    await qualifyReferral(auth.userId).catch(() => {});
  }

  return NextResponse.json(
    {
      sagaId,
      status: result.status,
      failedService: result.failedService ?? null,
      steps: result.steps,
      bookedTotalUsd: result.bookedTotalUsd,
      paidTotalUsd,
    },
    { status: result.status === "completed" ? 200 : 207 },
  );
}
