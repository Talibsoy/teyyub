import crypto from "crypto";

const PUBLIC_KEY  = process.env.EPOINT_PUBLIC_KEY  || "";
const PRIVATE_KEY = process.env.EPOINT_PRIVATE_KEY || "";
const BASE_URL    = "https://epoint.az/api/1/request";
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || "https://www.natourefly.com";

function sign(data: string): string {
  // Epoint imza: base64( sha1(privateKey + data + privateKey) )
  const raw = crypto.createHash("sha1").update(PRIVATE_KEY + data + PRIVATE_KEY).digest();
  return raw.toString("base64");
}

function encode(payload: object): { data: string; signature: string } {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  return { data, signature: sign(data) };
}

export function verifyEpointWebhook(data: string, signature: string): boolean {
  if (!PRIVATE_KEY) return false;
  const expected = sign(data);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function decodeEpointData(data: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(data, "base64").toString("utf8"));
}

export interface EpointOrderResult {
  orderId: string;
  paymentUrl: string;
}

export async function createEpointOrder(params: {
  amount: number;
  bookingId: string;
  description?: string;
}): Promise<EpointOrderResult> {
  const orderId = `NAT-${params.bookingId}-${Date.now()}`;

  const payload = {
    public_key:           PUBLIC_KEY,
    amount:               params.amount.toFixed(2),
    currency:             "AZN",
    order_id:             orderId,
    description:          params.description || "Tur ödənişi — Natoure.az",
    success_redirect_url: `${APP_URL}/payment/success?orderId=${orderId}&bookingId=${params.bookingId}`,
    error_redirect_url:   `${APP_URL}/payment/error?orderId=${orderId}&bookingId=${params.bookingId}`,
    language:             "AZ",
  };

  const { data, signature } = encode(payload);

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, signature }),
  });

  const result = await res.json();

  if (result.status !== "success" || !result.redirect_url) {
    throw new Error(result.message || "Epoint ödəniş yaradıla bilmədi");
  }

  return { orderId, paymentUrl: result.redirect_url };
}

export async function checkEpointOrder(orderId: string): Promise<string> {
  const payload = { public_key: PUBLIC_KEY, order_id: orderId };
  const { data, signature } = encode(payload);

  const res = await fetch("https://epoint.az/api/1/get-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, signature }),
  });

  const result = await res.json();
  return result.transaction?.status || "unknown";
}
