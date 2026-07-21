// lib/resilience.ts
// Faza 8 — Retry + circuit breaker for outbound provider calls.
//
// ⚠ SAFETY RULE — READ BEFORE USE:
// `withRetry` is for IDEMPOTENT reads only (searches, availability lookups,
// status polls). NEVER wrap a booking/payment write in it: a retry after a
// request that actually succeeded but timed out would double-book a room or
// issue a second ticket. Booking writes fail loudly and go through the saga's
// compensation path instead (lib/booking/orchestrator.ts).

export interface RetryOptions {
  /** Total attempts including the first. Default 3. */
  attempts?: number;
  /** First backoff delay; doubles each attempt. Default 300ms. */
  baseDelayMs?: number;
  /** Upper bound for a single backoff wait. Default 3000ms. */
  maxDelayMs?: number;
  /** Decide whether a given error is worth retrying. Default: retry everything. */
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an idempotent async read with exponential backoff and jitter.
 * Jitter matters: without it, many callers failing at once retry in lockstep
 * and hammer a recovering provider.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;
  const maxDelayMs = options.maxDelayMs ?? 3000;
  const isRetryable = options.isRetryable ?? (() => true);

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      const isLastAttempt = attempt === attempts;
      if (isLastAttempt || !isRetryable(error)) break;

      options.onRetry?.(attempt, error);

      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.random() * backoff * 0.3;
      await sleep(backoff + jitter);
    }
  }

  throw lastError;
}

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  /** Consecutive failures before the circuit opens. Default 5. */
  failureThreshold?: number;
  /** How long to stay open before allowing a trial call. Default 30s. */
  resetMs?: number;
  /** Used in the error message so logs identify the provider. */
  name?: string;
}

/**
 * Stops hammering a provider that is clearly down. After `failureThreshold`
 * consecutive failures the circuit opens and calls fail fast for `resetMs`,
 * then one trial call decides whether to close again.
 *
 * Intended for read paths. Keep one instance per provider (module scope).
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;

  private readonly failureThreshold: number;
  private readonly resetMs: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetMs = options.resetMs ?? 30_000;
    this.name = options.name ?? "provider";
  }

  get state(): CircuitState {
    if (this.openedAt === null) return "closed";
    return Date.now() - this.openedAt >= this.resetMs ? "half_open" : "open";
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      throw new Error(`${this.name} is temporarily unavailable (circuit open)`);
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error: unknown) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
    }
  }

  private reset(): void {
    this.failures = 0;
    this.openedAt = null;
  }
}

/** HTTP status codes worth retrying: transient server + rate-limit responses. */
export function isTransientHttpError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(408|429|500|502|503|504)\b/.test(message) || /timeout|ECONNRESET|fetch failed/i.test(message);
}
