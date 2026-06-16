/**
 * RateHawk (ETG) Booking Flow
 * Prebook → Finish → Status (poll) → Order Info → Cancel
 * ETG v3 API: https://api.worldota.net/api/b2b/v3
 */

import https from "node:https";

function getRatehawkBase() {
  // Sandbox: birbaşa ETG sandbox-a get. Proxy production endpoint-inə yönəlir, ona görə
  // sandbox açarları proxy üzərindən "incorrect_credentials" verir — sandbox-da proxy keçilir.
  if (process.env.RATEHAWK_SANDBOX === "true") {
    return "https://api-sandbox.worldota.net/api/b2b/v3";
  }
  // Production: statik whitelist IP üçün proxy üzərindən
  if (process.env.RATEHAWK_PROXY_URL) return process.env.RATEHAWK_PROXY_URL;
  return "https://api.worldota.net/api/b2b/v3";
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

export interface TaxItem {
  name:     string;
  amount:   number;
  currency: string;
  included: boolean;   // included_by_supplier — qiymətə daxildir / üstünə əlavə olunur
}

export interface CancellationStep {
  end_at: string;   // ISO 8601 UTC — bu vaxtdan sonra bu cərimə tutulur
  charge: number;
}

export interface PrebookResult {
  ok:                    boolean;
  book_hash?:            string;
  price?:                number;        // ETG net məbləğ (payment_type.amount ilə eyni olmalıdır)
  currency?:             string;
  payment_type?:         string;        // ETG payment type ("deposit"/"now"/"hotel") — finish-də eyni göndərilməlidir
  cancellation_deadline?: string;   // "2026-05-10T23:59:00" UTC — bu tarixə qədər pulsuz ləğv
  cancellation_policies?: CancellationStep[];
  taxes?:                TaxItem[];
  non_refundable?:        boolean;
  error?:                string;
}

// ETG prebook cavabında rate (book_hash + payment_options) obyektinin tipi
interface EtgRate {
  book_hash?: string;
  payment_options?: {
    payment_types?: Array<{
      amount:        string;
      currency_code: string;
      type:          string;
      cancellation_penalties?: {
        free_cancellation_before?: string;
        policies?: Array<{ end_at: string; amount_charge: string }>;
      };
      tax_data?: {
        taxes?: Array<{
          name:                 string;
          amount:               string;
          currency_code:        string;
          included_by_supplier: boolean;
        }>;
      };
    }>;
  };
}

export async function prebook(hash: string): Promise<PrebookResult> {
  try {
    const res = await etgPost("/hotel/prebook/", { hash, language: "en" });

    if (res.status !== "ok" || !res.data) {
      return { ok: false, error: res.error || "prebook_failed" };
    }

    // ETG prebook book_hash-i data.hotels[0].rates[0]-də qaytarır (üst səviyyədə yox).
    // Köhnə kod d.book_hash (üst səviyyə) oxuyurdu → həmişə undefined → "no_book_hash".
    const data = res.data as { hotels?: Array<{ rates?: EtgRate[] }> } & EtgRate;
    const rate: EtgRate = data.hotels?.[0]?.rates?.[0] ?? data;
    const bookHash = rate.book_hash;

    if (!bookHash) {
      return { ok: false, error: "no_book_hash" };
    }

    const payType  = rate.payment_options?.payment_types?.[0];
    const cancel   = payType?.cancellation_penalties;
    const nonRefundable = !cancel?.free_cancellation_before &&
                          (cancel?.policies?.length ?? 0) > 0;

    const taxes: TaxItem[] = (payType?.tax_data?.taxes ?? []).map((t) => ({
      name:     t.name,
      amount:   parseFloat(t.amount || "0"),
      currency: t.currency_code || payType?.currency_code || "USD",
      included: !!t.included_by_supplier,
    }));

    const policies: CancellationStep[] = (cancel?.policies ?? []).map((p) => ({
      end_at: p.end_at,
      charge: parseFloat(p.amount_charge || "0"),
    }));

    return {
      ok:                    true,
      book_hash:             bookHash,
      price:                 parseFloat(payType?.amount || "0"),
      currency:              payType?.currency_code || "USD",
      payment_type:          payType?.type,
      cancellation_deadline: cancel?.free_cancellation_before,
      cancellation_policies: policies,
      taxes,
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
  book_hash:         string;
  email?:            string;
  phone:             string;
  comment?:          string;
  guests:            GuestInfo[];
  payment_type?:     string;   // prebook-dan gələn type (deposit/now/hotel)
  amount?:           number;   // prebook-dan gələn ETG net məbləğ — payment_type.amount ilə eyni olmalıdır
  currency_code?:    string;
  partner_order_id?: string;  // Sandbox test ssenariləri üçün
}

export interface BookingFinishResult {
  ok:          boolean;
  order_ids?:  string[];
  error?:      string;
  http_error?: boolean;
}

export async function bookingFinish(params: BookingParams): Promise<BookingFinishResult> {
  try {
    const partner_order_id = params.partner_order_id || `natoure_${Date.now()}`;

    // 1. Create booking process (booking/form)
    const formRes = await etgPost("/hotel/order/booking/form/", {
      partner_order_id,
      book_hash: params.book_hash,
      language: "en",
      user_ip: "127.0.0.1",
    });

    if (formRes.status !== "ok") {
      return { ok: false, error: formRes.error || "booking_form_failed" };
    }

    // 2. Start booking process (booking/finish)
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
      rooms: [
        {
          guests: params.guests.map((g) => ({
            first_name:  g.first_name,
            last_name:   g.last_name,
            citizenship: g.citizenship,
          })),
        }
      ],
      // ETG payment_type-da type + currency + DƏQİQ məbləğ tələb olunur. Məbləğ prebook-dakı
      // payment_type.amount ilə eyni olmalıdır, əks halda "incorrect_chosen_payment_type" xətası.
      payment_type: {
        type:          params.payment_type || "deposit",
        amount:        (params.amount ?? 0).toFixed(2),
        currency_code: params.currency_code || "USD",
      },
      partner: { partner_order_id },
    });

    if (res.http_status && res.http_status >= 500) {
      return { ok: false, error: "server_error", http_error: true };
    }

    if (res.status !== "ok") {
      return { ok: false, error: res.error || "booking_failed" };
    }

    return { ok: true };
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

export async function getBookingStatus(
  orderIds?: string[],
  partnerOrderId?: string
): Promise<BookingStatusResult> {
  try {
    const body: Record<string, unknown> = {};
    if (orderIds && orderIds.length > 0) {
      body.order_ids = orderIds;
    } else if (partnerOrderId) {
      body.partner_order_id = partnerOrderId;
    } else {
      return { ok: false, error: "no_identifiers_provided" };
    }

    const res = await etgPost("/hotel/order/booking/finish/status/", body);

    if (res.http_status && res.http_status >= 500) {
      return { ok: false, status: "server_error", error: "server_error" };
    }

    let finalStatus: BookingStatus = "processing";
    let orderId: string | undefined = undefined;

    if (partnerOrderId) {
      // Checked by partner_order_id (B2B v3 returns root-level status)
      const statusValue = res.status;
      if (statusValue === "ok") {
        finalStatus = "ok";
        // ETG tövsiyəsi (Anna #7): yekun status YALNIZ /finish/status/-dən gəlir.
        // order/info booking axınında İSTİFADƏ OLUNMUR (o, hesabın order tarixçəsidir).
        // order_id finish cavabındakı order_ids-dən, ya da partner_order_id-dən götürülür.
      } else if (statusValue === "error") {
        finalStatus = (res.error as BookingStatus) || "unknown";
      } else if (statusValue === "3ds") {
        finalStatus = "3ds";
      } else {
        finalStatus = "processing";
      }
    } else {
      // Checked by order_ids
      if (res.status !== "ok") {
        return { ok: false, error: res.error || "status_failed" };
      }
      const d = res.data as { orders?: Array<{ order_id: string; status: string }> };
      const order = d.orders?.[0];
      if (!order) return { ok: false, error: "no_order" };
      finalStatus = order.status as BookingStatus;
      orderId = order.order_id;
    }

    return {
      ok: finalStatus === "ok",
      status: finalStatus,
      order_id: orderId,
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Polling — continues polling every 5s up to 200s for "processing", "timeout", "unknown", or "server_error" (5xx)
export async function pollBookingStatus(
  orderIds?: string[],
  partnerOrderId?: string
): Promise<BookingStatusResult> {
  const INTERVAL_MS  = 5000;
  const MAX_ATTEMPTS = parseInt(process.env.ETG_POLLING_MAX || "40", 10); // default 200s (40×5s) — ETG booking timeout ilə eyni olmalıdır

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const result = await getBookingStatus(orderIds, partnerOrderId);

    // Stop polling only on success or terminal failures
    if (result.status === "ok") return result;

    const terminalFailures: BookingStatus[] = [
      "soldout", "book_limit", "block", "charge", "3ds", "not_allowed", "booking_finish_did_not_succeed", "provider"
    ];

    if (result.status && terminalFailures.includes(result.status)) {
      return result;
    }

    // For "processing", "timeout", "unknown", "server_error" (5xx), we continue polling!
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
        id?:                 string;
        order_id?:           number;
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
        order_id:           String(o.order_id || o.id || ""),
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
