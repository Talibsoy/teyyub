// lib/booking/orchestrator.ts
// Faza 4 — Post-payment booking orchestration (saga).
//
// The customer pays ONCE, then each service is booked sequentially against its
// provider. Real-world constraint that shapes this design: some bookings are
// irreversible the moment they succeed (an issued airline ticket), while others
// can be cancelled cleanly (most hotel rates). So "rollback" is best-effort:
//
//   • Reversible completed steps are compensated in reverse order.
//   • Irreversible completed steps are NEVER silently swapped or hidden — they
//     are flagged for a human operator, and the customer is told the truth.
//
// Provider calls are injected as executors so this module stays pure, testable,
// and safe to import anywhere (no side effects, no provider imports at load).

import type { ServiceType } from "./confirmation-gate";

export interface SagaStep {
  service: ServiceType;
  /** REAL provider id confirmed by the user in the booking gates. */
  optionId: string;
  priceUsd: number;
  /**
   * Whether a successful booking can be cancelled programmatically.
   * Flights: false (ticket issued). Hotels: usually true (free-cancel rates).
   */
  reversible: boolean;
}

export type StepStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "compensated"              // successfully rolled back
  | "manual_intervention";     // succeeded but cannot be rolled back automatically

export interface StepResult {
  service: ServiceType;
  status: StepStatus;
  providerRef?: string;
  reason?: string;
}

export type BookOutcome =
  | { ok: true; providerRef: string }
  | { ok: false; reason: string };

/** One provider adapter. `cancel` is only meaningful for reversible services. */
export interface StepExecutor {
  book(step: SagaStep): Promise<BookOutcome>;
  cancel?(step: SagaStep, providerRef: string): Promise<boolean>;
}

export type ExecutorMap = Partial<Record<ServiceType, StepExecutor>>;

export interface SagaHooks {
  onStepStart?: (step: SagaStep) => Promise<void> | void;
  onStepResult?: (result: StepResult) => Promise<void> | void;
  /** Fired when a booking succeeded but could not be undone — needs a human. */
  onManualInterventionRequired?: (results: StepResult[]) => Promise<void> | void;
}

export type SagaStatus =
  | "completed"        // every step confirmed
  | "rolled_back"      // a step failed; everything before it was undone cleanly
  | "needs_attention"; // a step failed and something irreversible remains booked

export interface SagaResult {
  status: SagaStatus;
  steps: StepResult[];
  failedService?: ServiceType;
  /** Total actually confirmed and still standing, in USD. */
  bookedTotalUsd: number;
}

function bookedTotal(steps: SagaStep[], results: StepResult[]): number {
  return results.reduce((sum, r) => {
    if (r.status !== "confirmed" && r.status !== "manual_intervention") return sum;
    const step = steps.find((s) => s.service === r.service);
    return sum + (step?.priceUsd ?? 0);
  }, 0);
}

/**
 * Books each step in order. Stops at the first failure and compensates what it can.
 * Never books an alternative on the customer's behalf — a failure is reported, not
 * papered over.
 */
export async function runBookingSaga(
  steps: SagaStep[],
  executors: ExecutorMap,
  hooks: SagaHooks = {},
): Promise<SagaResult> {
  const results: StepResult[] = [];

  for (const step of steps) {
    await hooks.onStepStart?.(step);

    const executor = executors[step.service];
    if (!executor) {
      const result: StepResult = {
        service: step.service,
        status: "failed",
        reason: `No booking provider configured for ${step.service}.`,
      };
      results.push(result);
      await hooks.onStepResult?.(result);
      return finalize(steps, results, executors, hooks, step.service);
    }

    let outcome: BookOutcome;
    try {
      outcome = await executor.book(step);
    } catch (error: unknown) {
      outcome = {
        ok: false,
        reason: error instanceof Error ? error.message : "Unexpected provider error",
      };
    }

    if (!outcome.ok) {
      const result: StepResult = {
        service: step.service,
        status: "failed",
        reason: outcome.reason,
      };
      results.push(result);
      await hooks.onStepResult?.(result);
      return finalize(steps, results, executors, hooks, step.service);
    }

    const result: StepResult = {
      service: step.service,
      status: "confirmed",
      providerRef: outcome.providerRef,
    };
    results.push(result);
    await hooks.onStepResult?.(result);
  }

  return {
    status: "completed",
    steps: results,
    bookedTotalUsd: bookedTotal(steps, results),
  };
}

/**
 * Compensation pass: undo confirmed steps in reverse order where possible,
 * and escalate the ones that cannot be undone.
 */
async function finalize(
  steps: SagaStep[],
  results: StepResult[],
  executors: ExecutorMap,
  hooks: SagaHooks,
  failedService: ServiceType,
): Promise<SagaResult> {
  let needsAttention = false;

  // Reverse order so the most recent booking is undone first.
  for (let i = results.length - 1; i >= 0; i--) {
    const result = results[i];
    if (result.status !== "confirmed") continue;

    const step = steps.find((s) => s.service === result.service);
    const executor = executors[result.service];

    const canCancel = Boolean(step?.reversible && executor?.cancel && result.providerRef);
    if (!canCancel) {
      results[i] = {
        ...result,
        status: "manual_intervention",
        reason: "Booked successfully but cannot be cancelled automatically.",
      };
      needsAttention = true;
      await hooks.onStepResult?.(results[i]);
      continue;
    }

    let cancelled = false;
    try {
      cancelled = await executor!.cancel!(step!, result.providerRef!);
    } catch {
      cancelled = false;
    }

    results[i] = cancelled
      ? { ...result, status: "compensated" }
      : {
          ...result,
          status: "manual_intervention",
          reason: "Cancellation request failed — needs manual review.",
        };
    if (!cancelled) needsAttention = true;
    await hooks.onStepResult?.(results[i]);
  }

  if (needsAttention) {
    await hooks.onManualInterventionRequired?.(results);
  }

  return {
    status: needsAttention ? "needs_attention" : "rolled_back",
    steps: results,
    failedService,
    bookedTotalUsd: bookedTotal(steps, results),
  };
}

/**
 * Default ordering + reversibility for the services we can book today.
 * Hotels first: they are the cheapest failure to undo, so a hotel problem is
 * discovered before an irreversible ticket is issued.
 */
export const DEFAULT_STEP_ORDER: { service: ServiceType; reversible: boolean }[] = [
  { service: "hotel", reversible: true },
  { service: "tour", reversible: true },
  { service: "flight", reversible: false },
];

/**
 * Guard that MUST run before taking payment: returns the services that have no
 * booking provider wired. Charging a customer for something we cannot actually
 * book is the one failure mode no amount of compensation can fix.
 */
export function validateSagaExecutable(
  steps: SagaStep[],
  executors: ExecutorMap,
): ServiceType[] {
  return steps.filter((s) => !executors[s.service]).map((s) => s.service);
}

/** Builds saga steps from the user's confirmed gate selections, in safe order. */
export function buildSagaSteps(
  selections: { service: ServiceType; optionId: string; priceUsd: number }[],
): SagaStep[] {
  const steps: SagaStep[] = [];
  for (const { service, reversible } of DEFAULT_STEP_ORDER) {
    const match = selections.find((s) => s.service === service);
    if (match) {
      steps.push({ ...match, reversible });
    }
  }
  return steps;
}
