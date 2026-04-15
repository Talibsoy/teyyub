/**
 * RateHawk (ETG) Booking Flow
 * Prebook → Finish → Status (poll) → Order Info → Cancel
 * ETG v3 API: https://api.worldota.net/api/b2b/v3
 */

import https from "node:https";

function getRatehawkBase() {
  if (process.env.RATEHAWK_PROXY_URL) return process.env.RATEHAWK_PROXY_URL;
  return process.env.RATEHAWK_SANDBOX === "true"
    ? "https://api-sandbox.worldota.net/api/b2b/v3"
    : "https://api.worldota.net/api/b2b/v3";
}

function getAuth(): string {
  const key    = process.env.RATEHAWK_API_KEY!;
  const secret = process.env.RATEHAWK_SECRET!;
  return Buffer.from(`${key}:${secret}`).toString("base64");
}

// Generic POST — 5xx-ı error kimi qaytarır (atmır)
function etgPost(endpoint: string, body: object): Promise<EtgResponse> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const url      = new URL(`${getRatehawkBase()}${endpoint}`);
    const isSandbox = process.env.RATEHAWK_SANDBOX === "true";

    const req = https.request(
      {
        hostname: url.hostname,
        path:     url.pathname,
        method:   "POST",
        headers:  {
          Authorization:    `Basic ${getAuth()}`,
          "Content-Type":   "application/json",
          "Content-Length": Buffer.byteLength(postData),
          ...(process.env.RATEHAWK_PROXY_SECRET
            ? { "x-proxy-secret": process.env.RATEHAWK_PROXY_SECRET }
            : {}),
        },
        rejectUnauthorized: !isSandbox && !process.env.RATEHAWK_PROXY_URL,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 500) {
            // 5xx → ETG özü də retry tələb edir, xüsusi flag ilə qaytarırıq
            resolve({ status: "error", error: "server_error", http_status: res.statusCode });
            return;
          }
          try   { resolve(JSON.parse(data) as EtgResponse); }
          catch { reject(new Error(`ETG JSON parse: ${data.slice(0, 100)}`)); }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

interface EtgResponse {
  status:      string;
  data?:       Record<string, unknown>;
  error?:      string;
  http_status?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PREBOOK
// ─────────────────────────────────────────────────────────────────────────────

export interface PrebookResult {
  ok:                    boolean;
  book_hash?:            string;
  price?:                number;
  currency?:             string;
  cancellation_deadline?: string;   // "2026-05-10T23:59:00" — bu tarixə qədər pulsuz ləğv
  non_refundable?:        boolean;
  error?:                string;
}

export async function prebook(hash: string): Promise<PrebookResult> {
  try {
    const res = await etgPost("/hotel/prebook/", { hash, language: "en" });

    if (res.status !== "ok" || !res.data) {
      return { ok: false, error: res.error || "prebook_failed" };
    }

    const d = res.data as {
      book_hash: string;
      payment_options?: {
        payment_types?: Array<{
          amount:       string;
          currency_code: string;
          type:         string;
          cancellation_penalties?: {
            free_cancellation_before?: string;
            policies?: Array<{ end_at: string; amount_charge: string }>;
          };
        }>;
      };
    };

    const payType  = d.payment_options?.payment_types?.[0];
    const cancel   = payType?.cancellation_penalties;
    const nonRefundable = !cancel?.free_cancellation_before &&
                          (cancel?.policies?.length ?? 0) > 0;

    return {
      ok:                    true,
      book_hash:             d.book_hash,
      price:                 parseFloat(payType?.amount || "0"),
      currency:              payType?.currency_code || "USD",
      cancellation_deadline: cancel?.free_cancellation_before,
      non_refundable:        nonRefundable,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BOOKING FINISH
// ─────────────────────────────────────────────────────────────────────────────

export interface GuestInfo {
  first_name:  string;
  last_name:   string;
  citizenship: string;   // ISO 2-letter: "AZ", "RU", "TR", ...
}

export interface BookingParams {
  book_hash:    string;
  email?:       string;
  phone:        string;
  comment?:     string;
  guests:       GuestInfo[];
  payment_type?: "deposit" | "now" | "hotel";
}

export interface BookingFinishResult {
  ok:          boolean;
  order_ids?:  string[];
  error?:      string;
  http_error?: boolean;
}

export async function bookingFinish(params: BookingParams): Promise<BookingFinishResult> {
  try {
    const res = await etgPost("/hotel/order/booking/finish/", {
      book_hash: params.book_hash,
      language:  "en",
      user: {
        email:   params.email || process.env.BOOKING_EMAIL || "booking@natourefly.com",
        phone:   params.phone,
        comment: params.comment || "",
      },
      guests: params.guests.map((g) => ({
        first_name:  g.first_name,
        last_name:   g.last_name,
        citizenship: g.citizenship,
      })),
      payment: { type: params.payment_type || "deposit" },
    });

    if (res.http_status && res.http_status >= 500) {
      return { ok: false, error: "server_error", http_error: true };
    }

    if (res.status !== "ok") {
      return { ok: false, error: res.error || "booking_failed" };
    }

    const d = res.data as { order_ids?: string[] };
    if (!d.order_ids?.length) {
      return { ok: false, error: "no_order_ids" };
    }

    return { ok: true, order_ids: d.order_ids };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BOOKING STATUS
// ─────────────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "ok"
  | "processing"
  | "timeout"
  | "unknown"
  | "soldout"
  | "book_limit"
  | "provider"
  | "charge"
  | "block"
  | "3ds"
  | "not_allowed"
  | "booking_finish_did_not_succeed"
  | "server_error";

export interface BookingStatusResult {
  ok:        boolean;
  status?:   BookingStatus;
  order_id?: string;
  error?:    string;
}

export async function getBookingStatus(orderIds: string[]): Promise<BookingStatusResult> {
  try {
    const res = await etgPost("/hotel/order/booking/finish/status/", { order_ids: orderIds });

    if (res.http_status && res.http_status >= 500) {
      return { ok: false, status: "server_error", error: "server_error" };
    }

    if (res.status !== "ok") {
      return { ok: false, error: res.error || "status_failed" };
    }

    const d = res.data as { orders?: Array<{ order_id: string; status: string }> };
    const order = d.orders?.[0];
    if (!order) return { ok: false, error: "no_order" };

    return {
      ok:       order.status === "ok",
      status:   order.status as BookingStatus,
      order_id: order.order_id,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Polling — "processing" olanda hər 5 san yoxla, max 60 san
export async function pollBookingStatus(orderIds: string[]): Promise<BookingStatusResult> {
  const INTERVAL_MS  = 5000;
  const MAX_ATTEMPTS = 12;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = await getBookingStatus(orderIds);

    if (result.status !== "processing") return result;

    if (i < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  }

  return { ok: false, status: "timeout", error: "polling_timeout" };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ORDER INFO
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderInfo {
  order_id:           string;
  status:             string;
  hotel_name:         string;
  checkin:            string;
  checkout:           string;
  room_name:          string;
  guests:             GuestInfo[];
  voucher_url?:       string;
  cancellation_info?: string;
  price?:             number;
  currency?:          string;
}

export interface OrderInfoResult {
  ok:     boolean;
  order?: OrderInfo;
  error?: string;
}

export async function getOrderInfo(orderIds: string[]): Promise<OrderInfoResult> {
  try {
    const res = await etgPost("/hotel/order/info/", {
      order_ids: orderIds,
      language:  "en",
    });

    if (res.status !== "ok") {
      return { ok: false, error: res.error || "info_failed" };
    }

    const d = res.data as {
      orders?: Array<{
        id:                  string;
        status:              string;
        hotel?:              { name?: string };
        checkin?:            string;
        checkout?:           string;
        room_name?:          string;
        guests?:             GuestInfo[];
        voucher_download_url?: string;
        cancellation_info?:  { type?: string; deadline?: string };
        payment_info?:       { amount?: number; currency_code?: string };
      }>;
    };

    const o = d.orders?.[0];
    if (!o) return { ok: false, error: "no_order" };

    const ci = o.cancellation_info;
    const cancelText = ci?.deadline
      ? `${ci.deadline} tarixinə qədər pulsuz ləğv`
      : ci?.type === "non_refundable"
      ? "Geri qaytarılmır"
      : undefined;

    return {
      ok: true,
      order: {
        order_id:           o.id,
        status:             o.status,
        hotel_name:         o.hotel?.name || "",
        checkin:            o.checkin     || "",
        checkout:           o.checkout    || "",
        room_name:          o.room_name   || "",
        guests:             o.guests      || [],
        voucher_url:        o.voucher_download_url,
        cancellation_info:  cancelText,
        price:              o.payment_info?.amount,
        currency:           o.payment_info?.currency_code,
      },
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CANCEL BOOKING
// ─────────────────────────────────────────────────────────────────────────────

export interface CancelResult {
  ok:     boolean;
  error?: string;
}

export async function cancelBooking(orderId: string): Promise<CancelResult> {
  try {
    const res = await etgPost("/hotel/order/cancel/", {
      order_id: orderId,
      language: "en",
    });

    return {
      ok:    res.status === "ok",
      error: res.status !== "ok" ? (res.error || "cancel_failed") : undefined,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
