// tests/security.test.ts
// Run: npm test
//
// Covers the two pure guards that protect money and stability:
//   • Stripe webhook signature verification (forged webhook = fake "paid")
//   • Retry policy (a wrong retry on a booking write would double-book)

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { verifyWebhookSignature } from "../lib/stripe.ts";
import { withRetry, isTransientHttpError, CircuitBreaker } from "../lib/resilience.ts";

const SECRET = "whsec_test_secret";

function signedHeader(payload: string, secret = SECRET, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("Stripe webhook signature", () => {
  const payload = JSON.stringify({ type: "checkout.session.completed", id: "cs_123" });

  test("accepts a correctly signed payload", () => {
    assert.equal(
      verifyWebhookSignature({ rawBody: payload, signatureHeader: signedHeader(payload), secret: SECRET }),
      true,
    );
  });

  test("rejects a payload that was altered after signing", () => {
    const header = signedHeader(payload);
    const tampered = JSON.stringify({ type: "checkout.session.completed", id: "cs_ATTACKER" });

    assert.equal(
      verifyWebhookSignature({ rawBody: tampered, signatureHeader: header, secret: SECRET }),
      false,
    );
  });

  test("rejects a signature made with the wrong secret", () => {
    const header = signedHeader(payload, "whsec_wrong_secret");
    assert.equal(
      verifyWebhookSignature({ rawBody: payload, signatureHeader: header, secret: SECRET }),
      false,
    );
  });

  test("rejects a replayed old signature", () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 3600; // an hour ago
    const header = signedHeader(payload, SECRET, oldTimestamp);

    assert.equal(
      verifyWebhookSignature({ rawBody: payload, signatureHeader: header, secret: SECRET }),
      false,
    );
  });

  test("rejects a missing or malformed header", () => {
    assert.equal(verifyWebhookSignature({ rawBody: payload, signatureHeader: null, secret: SECRET }), false);
    assert.equal(verifyWebhookSignature({ rawBody: payload, signatureHeader: "garbage", secret: SECRET }), false);
    assert.equal(verifyWebhookSignature({ rawBody: payload, signatureHeader: "t=123", secret: SECRET }), false);
  });

  test("rejects everything when no secret is configured", () => {
    assert.equal(
      verifyWebhookSignature({ rawBody: payload, signatureHeader: signedHeader(payload), secret: "" }),
      false,
    );
  });
});

describe("withRetry", () => {
  test("returns the first success without retrying", async () => {
    let calls = 0;
    const result = await withRetry(async () => { calls++; return "ok"; });

    assert.equal(result, "ok");
    assert.equal(calls, 1);
  });

  test("retries a transient failure and then succeeds", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new Error("503 service unavailable");
        return "recovered";
      },
      { attempts: 3, baseDelayMs: 1 },
    );

    assert.equal(result, "recovered");
    assert.equal(calls, 3);
  });

  test("gives up after the attempt budget and rethrows the last error", async () => {
    let calls = 0;
    await assert.rejects(
      () => withRetry(async () => { calls++; throw new Error("always down"); }, { attempts: 2, baseDelayMs: 1 }),
      /always down/,
    );
    assert.equal(calls, 2);
  });

  test("does not retry an error the policy rejects", async () => {
    let calls = 0;
    await assert.rejects(
      () => withRetry(
        async () => { calls++; throw new Error("400 bad request"); },
        { attempts: 5, baseDelayMs: 1, isRetryable: isTransientHttpError },
      ),
      /400 bad request/,
    );
    assert.equal(calls, 1, "a client error must not be retried");
  });
});

describe("isTransientHttpError", () => {
  test("treats server and rate-limit errors as transient", () => {
    for (const message of ["429 too many requests", "500 server error", "502", "503", "504", "request timeout", "fetch failed"]) {
      assert.equal(isTransientHttpError(new Error(message)), true, message);
    }
  });

  test("treats client errors as permanent", () => {
    for (const message of ["400 bad request", "401 unauthorized", "404 not found", "incorrect_credentials"]) {
      assert.equal(isTransientHttpError(new Error(message)), false, message);
    }
  });
});

describe("CircuitBreaker", () => {
  test("opens after the failure threshold and then fails fast", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetMs: 10_000, name: "test-provider" });
    const failing = async () => { throw new Error("down"); };

    await assert.rejects(() => breaker.run(failing));
    assert.equal(breaker.state, "closed");

    await assert.rejects(() => breaker.run(failing));
    assert.equal(breaker.state, "open");

    let reached = false;
    await assert.rejects(
      () => breaker.run(async () => { reached = true; return "x"; }),
      /circuit open/,
    );
    assert.equal(reached, false, "an open circuit must not call the provider");
  });

  test("a success resets the failure count", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2 });

    await assert.rejects(() => breaker.run(async () => { throw new Error("down"); }));
    await breaker.run(async () => "ok");
    await assert.rejects(() => breaker.run(async () => { throw new Error("down"); }));

    assert.equal(breaker.state, "closed", "the earlier failure should not still count");
  });
});
