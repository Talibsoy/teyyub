// tests/orchestrator.test.ts
// Run: npm test
//
// These tests cover what happens after the customer's money has moved, which is
// where mistakes are most expensive. The central rule under test: a booking that
// cannot be undone is never hidden — it is escalated.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  runBookingSaga,
  buildSagaSteps,
  validateSagaExecutable,
  DEFAULT_STEP_ORDER,
  type ExecutorMap,
  type SagaStep,
  type StepResult,
} from "../lib/booking/orchestrator.ts";

const SELECTIONS = [
  { service: "flight" as const, optionId: "off_A", priceUsd: 420 },
  { service: "hotel" as const, optionId: "h-1", priceUsd: 900 },
];

/** An executor that always succeeds, recording that it was called. */
function okExecutor(ref: string, calls: string[] = []) {
  return {
    async book() {
      calls.push(`book:${ref}`);
      return { ok: true as const, providerRef: ref };
    },
    async cancel() {
      calls.push(`cancel:${ref}`);
      return true;
    },
  };
}

describe("buildSagaSteps", () => {
  test("books the cheapest-to-undo service first", () => {
    const steps = buildSagaSteps(SELECTIONS);
    assert.deepEqual(steps.map((s) => s.service), ["hotel", "flight"]);
  });

  test("carries the reversibility of each service", () => {
    const steps = buildSagaSteps(SELECTIONS);
    const hotel = steps.find((s) => s.service === "hotel");
    const flight = steps.find((s) => s.service === "flight");

    assert.equal(hotel?.reversible, true, "hotels can be cancelled");
    assert.equal(flight?.reversible, false, "an issued ticket cannot be");
  });

  test("ignores services the traveller did not choose", () => {
    const steps = buildSagaSteps([SELECTIONS[0]]);
    assert.deepEqual(steps.map((s) => s.service), ["flight"]);
  });

  test("the declared order matches the services we can actually book", () => {
    assert.deepEqual(
      DEFAULT_STEP_ORDER.map((s) => s.service),
      ["hotel", "tour", "flight"],
    );
  });
});

describe("validateSagaExecutable", () => {
  test("names every service without a provider", () => {
    const steps = buildSagaSteps([
      ...SELECTIONS,
      { service: "tour" as const, optionId: "v-9", priceUsd: 150 },
    ]);
    const executors: ExecutorMap = { hotel: okExecutor("h"), flight: okExecutor("f") };

    assert.deepEqual(validateSagaExecutable(steps, executors), ["tour"]);
  });

  test("passes when every service is covered", () => {
    const steps = buildSagaSteps(SELECTIONS);
    const executors: ExecutorMap = { hotel: okExecutor("h"), flight: okExecutor("f") };

    assert.deepEqual(validateSagaExecutable(steps, executors), []);
  });
});

describe("runBookingSaga — happy path", () => {
  test("books every step and reports the real total", async () => {
    const steps = buildSagaSteps(SELECTIONS);
    const executors: ExecutorMap = {
      hotel: okExecutor("HOTEL_REF"),
      flight: okExecutor("FLIGHT_REF"),
    };

    const result = await runBookingSaga(steps, executors);

    assert.equal(result.status, "completed");
    assert.equal(result.bookedTotalUsd, 1320);
    assert.deepEqual(result.steps.map((s) => s.status), ["confirmed", "confirmed"]);
    assert.equal(result.steps[0].providerRef, "HOTEL_REF");
  });
});

describe("runBookingSaga — failure with a reversible step booked", () => {
  test("cancels what it can and reports a clean rollback", async () => {
    const calls: string[] = [];
    const steps = buildSagaSteps(SELECTIONS);
    const executors: ExecutorMap = {
      hotel: okExecutor("HOTEL_REF", calls),
      flight: {
        async book() {
          calls.push("book:flight");
          return { ok: false as const, reason: "Fare no longer available" };
        },
      },
    };

    const result = await runBookingSaga(steps, executors);

    assert.equal(result.status, "rolled_back");
    assert.equal(result.failedService, "flight");
    assert.deepEqual(calls, ["book:HOTEL_REF", "book:flight", "cancel:HOTEL_REF"]);

    const hotel = result.steps.find((s) => s.service === "hotel");
    assert.equal(hotel?.status, "compensated");
    assert.equal(result.bookedTotalUsd, 0, "nothing is left standing");
  });
});

describe("runBookingSaga — failure with an irreversible step booked", () => {
  test("escalates instead of silently leaving a ticket behind", async () => {
    // Flight first (irreversible), then a tour that fails.
    const steps: SagaStep[] = [
      { service: "flight", optionId: "off_A", priceUsd: 420, reversible: false },
      { service: "tour", optionId: "v-9", priceUsd: 150, reversible: true },
    ];

    let escalated: StepResult[] | null = null;
    const executors: ExecutorMap = {
      flight: { async book() { return { ok: true as const, providerRef: "TICKET_123" }; } },
      tour: { async book() { return { ok: false as const, reason: "Sold out" }; } },
    };

    const result = await runBookingSaga(steps, executors, {
      onManualInterventionRequired(results) { escalated = results; },
    });

    assert.equal(result.status, "needs_attention");

    const flight = result.steps.find((s) => s.service === "flight");
    assert.equal(flight?.status, "manual_intervention");
    assert.equal(flight?.providerRef, "TICKET_123", "the reference is kept so staff can act");

    assert.ok(escalated, "staff must be told");
    assert.equal(
      result.bookedTotalUsd,
      420,
      "the ticket still exists, so it still counts as booked",
    );
  });

  test("a failed cancellation also escalates rather than being swallowed", async () => {
    const steps = buildSagaSteps(SELECTIONS);
    const executors: ExecutorMap = {
      hotel: {
        async book() { return { ok: true as const, providerRef: "HOTEL_REF" }; },
        async cancel() { return false; }, // provider refused the cancellation
      },
      flight: { async book() { return { ok: false as const, reason: "Fare gone" }; } },
    };

    const result = await runBookingSaga(steps, executors);

    assert.equal(result.status, "needs_attention");
    const hotel = result.steps.find((s) => s.service === "hotel");
    assert.equal(hotel?.status, "manual_intervention");
  });
});

describe("runBookingSaga — provider errors", () => {
  test("a thrown error is a clean step failure, not a crash", async () => {
    const steps = buildSagaSteps([SELECTIONS[1]]); // hotel only
    const executors: ExecutorMap = {
      hotel: { async book() { throw new Error("socket hang up"); } },
    };

    const result = await runBookingSaga(steps, executors);

    assert.equal(result.status, "rolled_back");
    assert.equal(result.steps[0].status, "failed");
    assert.match(result.steps[0].reason ?? "", /socket hang up/);
  });

  test("a missing provider stops the run before booking anything", async () => {
    const steps = buildSagaSteps(SELECTIONS);
    const result = await runBookingSaga(steps, {}); // no executors at all

    assert.equal(result.status, "rolled_back");
    assert.equal(result.steps[0].status, "failed");
    assert.equal(result.bookedTotalUsd, 0);
  });
});
