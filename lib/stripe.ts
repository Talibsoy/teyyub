// lib/stripe.ts
// Faza 1 — Stripe payments (replaces lib/epoint.ts for the US pivot).
//
// Implemented against Stripe's REST API with `fetch` rather than the SDK, so the
// project gains no new dependency. Stripe expects form-encoded bodies and
// integer minor units (cents).
//
// Security rules carried over from the Epoint flow:
//   • The charged amount is decided server-side and read back from Stripe —
//     never trusted from a client body.
//   • Webhooks are verified with a constant-time signature comparison.

import { createHmac, timingSafeEqual } from "crypto";

const STRIPE_BASE = "https://api.stripe.com/v1";
const REQUEST_TIMEOUT_MS = 15_000;
/** Reject webhooks older than this to blunt replay attacks. */
const WEBHOOK_TOLERANCE_SEC = 300;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return key;
}

function encodeForm(data: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

function centsToUsd(cents: number): number {
  return Math.round(cents) / 100;
}

async function stripePost(path: string, body: Record<string, string | number | undefined>) {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeForm(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message ?? `Stripe request failed (${res.status})`;
    throw new Error(message);
  }
  return json;
}

async function stripeGet(path: string) {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message ?? `Stripe request failed (${res.status})`;
    throw new Error(message);
  }
  return json;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  amountUsd: number;
  status: string;
}

/**
 * Creates a PaymentIntent. Apple Pay / Google Pay ride on the same intent via
 * Stripe's automatic payment methods, so no separate widget flow is needed.
 */
export async function createPaymentIntent(params: {
  amountUsd: number;
  metadata?: Record<string, string>;
  description?: string;
  receiptEmail?: string;
}): Promise<PaymentIntentResult> {
  if (!Number.isFinite(params.amountUsd) || params.amountUsd <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const body: Record<string, string | number | undefined> = {
    amount: usdToCents(params.amountUsd),
    currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    description: params.description,
    receipt_email: params.receiptEmail,
  };

  for (const [key, value] of Object.entries(params.metadata ?? {})) {
    body[`metadata[${key}]`] = value;
  }

  const intent = await stripePost("/payment_intents", body);

  return {
    id: intent.id,
    clientSecret: intent.client_secret,
    amountUsd: centsToUsd(intent.amount),
    status: intent.status,
  };
}

/**
 * Reads an intent back from Stripe. This is the authoritative source for how
 * much was actually paid — never trust an amount sent by the browser.
 */
export async function retrievePaymentIntent(id: string): Promise<PaymentIntentResult & {
  metadata: Record<string, string>;
}> {
  const intent = await stripeGet(`/payment_intents/${encodeURIComponent(id)}`);
  return {
    id: intent.id,
    clientSecret: intent.client_secret ?? "",
    amountUsd: centsToUsd(intent.amount),
    status: intent.status,
    metadata: intent.metadata ?? {},
  };
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

/**
 * Creates a hosted Stripe Checkout session. Preferred over Elements here because
 * card details never touch our domain (smaller PCI surface) and it needs no
 * client-side Stripe SDK. Apple Pay / Google Pay appear automatically.
 */
export async function createCheckoutSession(params: {
  amountUsd: number;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
}): Promise<CheckoutSessionResult> {
  if (!Number.isFinite(params.amountUsd) || params.amountUsd <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const body: Record<string, string | number | undefined> = {
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": usdToCents(params.amountUsd),
    "line_items[0][price_data][product_data][name]": params.productName,
  };

  for (const [key, value] of Object.entries(params.metadata ?? {})) {
    body[`metadata[${key}]`] = value;
    // Mirrored onto the PaymentIntent so the booking step can verify ownership.
    body[`payment_intent_data[metadata][${key}]`] = value;
  }

  const session = await stripePost("/checkout/sessions", body);
  return { id: session.id, url: session.url };
}

export interface CheckoutSessionStatus {
  id: string;
  paymentStatus: string;   // "paid" once settled
  paymentIntentId: string | null;
  amountUsd: number;
  customerEmail: string | null;
  metadata: Record<string, string>;
}

export async function retrieveCheckoutSession(id: string): Promise<CheckoutSessionStatus> {
  const session = await stripeGet(`/checkout/sessions/${encodeURIComponent(id)}`);
  return {
    id: session.id,
    paymentStatus: session.payment_status,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    amountUsd: centsToUsd(session.amount_total ?? 0),
    customerEmail: session.customer_email ?? session.customer_details?.email ?? null,
    metadata: session.metadata ?? {},
  };
}

export async function refundPaymentIntent(params: {
  paymentIntentId: string;
  amountUsd?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}): Promise<{ id: string; status: string }> {
  const refund = await stripePost("/refunds", {
    payment_intent: params.paymentIntentId,
    amount: params.amountUsd !== undefined ? usdToCents(params.amountUsd) : undefined,
    reason: params.reason,
  });
  return { id: refund.id, status: refund.status };
}

/**
 * Verifies a `Stripe-Signature` header against the raw request body.
 * Must be given the RAW body string — parsing and re-serialising the JSON
 * changes the bytes and the signature will never match.
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  secret?: string;
}): boolean {
  const secret = params.secret ?? process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !params.signatureHeader) return false;

  let timestamp = "";
  const signatures: string[] = [];

  for (const part of params.signatureHeader.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key?.trim() === "t") timestamp = value?.trim() ?? "";
    if (key?.trim() === "v1" && value) signatures.push(value.trim());
  }

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > WEBHOOK_TOLERANCE_SEC) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${params.rawBody}`, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate, "hex");
    if (candidateBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(candidateBuffer, expectedBuffer);
  });
}
