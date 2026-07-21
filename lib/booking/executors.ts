// lib/booking/executors.ts
// Faza 4 — Real provider adapters for the booking saga.
//
// These are the only places that actually issue a booking. They are injected
// into runBookingSaga() so the saga engine itself stays pure and testable.
//
// Reversibility (drives DEFAULT_STEP_ORDER in orchestrator.ts):
//   • Hotel  — cancellable via ETG /hotel/order/cancel/  → reversible
//   • Flight — ticket is issued immediately, no cancel endpoint wired → NOT reversible
//   • Tour   — Viator booking API is not implemented yet, so no executor is
//              registered on purpose; validateSagaExecutable() will refuse to
//              charge for a tour rather than fail after taking money.

import { createOrder, type OrderPassenger } from "../duffel";
import {
  prebook,
  bookingFinish,
  pollBookingStatus,
  cancelBooking,
  type GuestInfo,
} from "../ratehawk-booking";
import type { BookOutcome, ExecutorMap, SagaStep, StepExecutor } from "./orchestrator";

// ─── Flights (Duffel) ────────────────────────────────────────────────────────

export function createFlightExecutor(passengers: OrderPassenger[]): StepExecutor {
  return {
    async book(step: SagaStep): Promise<BookOutcome> {
      if (!passengers.length) {
        return { ok: false, reason: "Passenger details are required before tickets can be issued." };
      }

      // createOrder re-fetches the real price server-side and throws on failure;
      // the saga runner turns a throw into a clean step failure.
      const order = await createOrder({
        offer_id: step.optionId, // REAL Duffel offer id confirmed by the traveller
        passengers,
      });

      return { ok: true, providerRef: order.order_id };
    },
    // No cancel(): Duffel order cancellation is not wired. Flights are therefore
    // declared irreversible and escalate to a human instead of silently failing.
  };
}

// ─── Hotels (RateHawk / ETG) ─────────────────────────────────────────────────

export interface HotelBookingContext {
  guests: GuestInfo[];
  phone: string;
  /** ETG always receives the corporate booking address, never the guest's own. */
  email?: string;
  partnerOrderId?: string;
}

export function createHotelExecutor(ctx: HotelBookingContext): StepExecutor {
  return {
    async book(step: SagaStep): Promise<BookOutcome> {
      if (!ctx.guests.length) {
        return { ok: false, reason: "Guest details are required to book a room." };
      }

      // 1) Prebook the search hash to obtain the bookable `p-` hash.
      const pre = await prebook(step.optionId);
      if (!pre.ok || !pre.book_hash) {
        return { ok: false, reason: `Room is no longer available (${pre.error ?? "prebook failed"}).` };
      }

      // 2) Start the booking.
      const finish = await bookingFinish({
        book_hash: pre.book_hash,
        guests: ctx.guests,
        phone: ctx.phone,
        email: ctx.email,
        partner_order_id: ctx.partnerOrderId,
      });
      if (!finish.ok) {
        return { ok: false, reason: finish.error ?? "Hotel booking could not be started." };
      }

      // 3) Poll until ETG reports a terminal state (up to ETG_POLLING_MAX × 5s).
      const status = await pollBookingStatus(finish.order_ids, ctx.partnerOrderId);
      if (!status.ok) {
        return {
          ok: false,
          reason: status.error ?? status.status ?? "Hotel booking did not confirm in time.",
        };
      }

      const providerRef = status.order_id ?? finish.order_ids?.[0];
      if (!providerRef) {
        // Confirmed but unreferenced — treat as needing a human rather than
        // pretending it is clean.
        return { ok: false, reason: "Hotel confirmed but returned no order reference." };
      }

      return { ok: true, providerRef };
    },

    async cancel(_step: SagaStep, providerRef: string): Promise<boolean> {
      const res = await cancelBooking(providerRef);
      return res.ok;
    },
  };
}

// ─── Assembly ────────────────────────────────────────────────────────────────

export interface ExecutorContext {
  passengers: OrderPassenger[];
  hotel: HotelBookingContext;
}

/**
 * Builds the provider map for a saga run. Services without an entry here cannot
 * be booked — validateSagaExecutable() must be called BEFORE taking payment.
 */
export function buildExecutors(ctx: ExecutorContext): ExecutorMap {
  return {
    flight: createFlightExecutor(ctx.passengers),
    hotel: createHotelExecutor(ctx.hotel),
    // tour: intentionally absent until Viator booking is implemented.
  };
}
