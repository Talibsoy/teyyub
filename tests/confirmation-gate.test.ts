// tests/confirmation-gate.test.ts
// Run: npm test
//
// These tests pin down the guarantees the booking flow relies on. If one of them
// fails, a customer can reach payment for something they never really chose.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  buildSession,
  bookingReducer,
  getActiveGate,
  getConfirmedSelections,
  getTotalUsd,
  allGatesResolved,
  BOOKABLE_SERVICES,
  type BookingSession,
  type GateOption,
} from "../lib/booking/confirmation-gate.ts";

const FLIGHT_A: GateOption = { id: "off_A", label: "Alaska Air · Nonstop", priceUsd: 420 };
const FLIGHT_B: GateOption = { id: "off_B", label: "Delta · 1 stop", priceUsd: 380 };
const HOTEL_A: GateOption = { id: "h-123", label: "Lakeside Lodge", priceUsd: 900 };

/** Drives a gate from locked → results with the given options. */
function openGate(session: BookingSession, service: "flight" | "hotel" | "tour", options: GateOption[]) {
  let next = bookingReducer(session, { type: "CONFIRM_PARAMS", service, params: { x: 1 } });
  next = bookingReducer(next, { type: "LOAD_OPTIONS", service, options });
  return next;
}

describe("buildSession", () => {
  test("locks bookable services and marks the rest unavailable", () => {
    const session = buildSession();

    for (const gate of session.gates) {
      const expected = BOOKABLE_SERVICES.includes(gate.service) ? "locked" : "unavailable";
      assert.equal(gate.status, expected, `${gate.service} should be ${expected}`);
    }
    assert.equal(session.stage, "planning");
    assert.equal(session.activeIndex, -1, "no gate is active before the plan is approved");
  });
});

describe("plan approval", () => {
  test("nothing can be booked before the plan is approved", () => {
    const session = buildSession();
    const attempted = bookingReducer(session, {
      type: "CONFIRM_PARAMS",
      service: "flight",
      params: {},
    });
    assert.deepEqual(attempted, session, "a locked gate ignores param confirmation");
  });

  test("approving the plan activates the first bookable gate", () => {
    const session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    const active = getActiveGate(session);

    assert.equal(session.stage, "gates");
    assert.equal(active?.service, "flight");
    assert.equal(active?.status, "params");
  });
});

describe("selection integrity", () => {
  test("rejects an option id that was never loaded", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    session = openGate(session, "flight", [FLIGHT_A, FLIGHT_B]);

    const tampered = bookingReducer(session, {
      type: "SELECT_OPTION",
      service: "flight",
      optionId: "off_DOES_NOT_EXIST",
    });

    assert.equal(getActiveGate(tampered)?.selectedId, null, "an invented id must not be selectable");
  });

  test("accepts an option that really came back from the provider", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    session = openGate(session, "flight", [FLIGHT_A, FLIGHT_B]);
    session = bookingReducer(session, { type: "SELECT_OPTION", service: "flight", optionId: "off_B" });

    assert.equal(getActiveGate(session)?.selectedId, "off_B");
  });

  test("cannot confirm a gate with nothing selected", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    session = openGate(session, "flight", [FLIGHT_A]);

    const confirmed = bookingReducer(session, { type: "CONFIRM_SELECTION", service: "flight" });
    assert.equal(getActiveGate(confirmed)?.status, "results", "gate stays open without a selection");
  });
});

describe("gate ordering", () => {
  test("confirming one gate unlocks the next, and only the next", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    session = openGate(session, "flight", [FLIGHT_A]);
    session = bookingReducer(session, { type: "SELECT_OPTION", service: "flight", optionId: "off_A" });
    session = bookingReducer(session, { type: "CONFIRM_SELECTION", service: "flight" });

    const active = getActiveGate(session);
    assert.equal(active?.service, "hotel", "hotel is next in the canonical order");
    assert.equal(active?.status, "params");

    const tour = session.gates.find((g) => g.service === "tour");
    assert.equal(tour?.status, "locked", "later gates stay locked");
  });
});

describe("skipping", () => {
  test("required services cannot be skipped", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    const skipped = bookingReducer(session, { type: "SKIP_SERVICE", service: "flight" });

    assert.deepEqual(skipped, session, "flight is required, so the skip is a no-op");
  });

  test("optional services can be skipped and move the flow on", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });

    // flight
    session = openGate(session, "flight", [FLIGHT_A]);
    session = bookingReducer(session, { type: "SELECT_OPTION", service: "flight", optionId: "off_A" });
    session = bookingReducer(session, { type: "CONFIRM_SELECTION", service: "flight" });
    // hotel
    session = openGate(session, "hotel", [HOTEL_A]);
    session = bookingReducer(session, { type: "SELECT_OPTION", service: "hotel", optionId: "h-123" });
    session = bookingReducer(session, { type: "CONFIRM_SELECTION", service: "hotel" });
    // tour is optional
    session = bookingReducer(session, { type: "SKIP_SERVICE", service: "tour" });

    const tour = session.gates.find((g) => g.service === "tour");
    assert.equal(tour?.status, "skipped");
    assert.equal(getActiveGate(session), null, "no bookable gates remain");
    assert.ok(allGatesResolved(session));
  });
});

describe("totals and review", () => {
  test("totals only count confirmed selections", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    session = openGate(session, "flight", [FLIGHT_A]);
    session = bookingReducer(session, { type: "SELECT_OPTION", service: "flight", optionId: "off_A" });

    assert.equal(getTotalUsd(session), 0, "a selection that is not confirmed is not owed");

    session = bookingReducer(session, { type: "CONFIRM_SELECTION", service: "flight" });
    assert.equal(getTotalUsd(session), 420);

    session = openGate(session, "hotel", [HOTEL_A]);
    session = bookingReducer(session, { type: "SELECT_OPTION", service: "hotel", optionId: "h-123" });
    session = bookingReducer(session, { type: "CONFIRM_SELECTION", service: "hotel" });

    assert.equal(getTotalUsd(session), 1320);
    assert.deepEqual(
      getConfirmedSelections(session).map((s) => s.service),
      ["flight", "hotel"],
    );
  });

  test("review cannot be reached with nothing confirmed", () => {
    const session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    const reviewed = bookingReducer(session, { type: "GO_TO_REVIEW" });

    assert.equal(reviewed.stage, "gates", "an empty basket never reaches payment");
  });

  test("payment is only reachable through review", () => {
    let session = bookingReducer(buildSession(), { type: "APPROVE_PLAN" });
    session = openGate(session, "flight", [FLIGHT_A]);
    session = bookingReducer(session, { type: "SELECT_OPTION", service: "flight", optionId: "off_A" });
    session = bookingReducer(session, { type: "CONFIRM_SELECTION", service: "flight" });

    const jumped = bookingReducer(session, { type: "CONFIRM_REVIEW" });
    assert.equal(jumped.stage, "gates", "cannot jump straight to payment");

    const reviewed = bookingReducer(session, { type: "GO_TO_REVIEW" });
    assert.equal(reviewed.stage, "review");
    assert.equal(bookingReducer(reviewed, { type: "CONFIRM_REVIEW" }).stage, "payment");
  });
});
