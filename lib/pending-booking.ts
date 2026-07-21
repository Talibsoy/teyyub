// lib/pending-booking.ts
// Holds the traveller details + confirmed selections while the customer is away
// on Stripe's hosted checkout page.
//
// This MUST be shared storage (Redis), not process memory: on Vercel the request
// that returns from Stripe almost certainly hits a different instance than the
// one that started checkout. If Redis is unavailable we fail loudly rather than
// silently losing a paid customer's booking details.

import { Redis } from "@upstash/redis";
import type { ServiceType } from "./booking/confirmation-gate";
import type { OrderPassenger } from "./duffel";
import type { GuestInfo } from "./ratehawk-booking";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/** Long enough to finish checkout (incl. 3-D Secure), short enough to expire abandoned carts. */
const TTL_SEC = 2 * 60 * 60;

export interface PendingSelection {
  service: ServiceType;
  optionId: string;
  priceUsd: number;
}

export interface PendingBooking {
  userId: string;
  selections: PendingSelection[];
  passengers: OrderPassenger[];
  guests: GuestInfo[];
  phone: string;
  email?: string;
  experienceSlug?: string;
}

export function isPendingStoreAvailable(): boolean {
  return redis !== null;
}

function key(sessionId: string): string {
  return `pending_booking:${sessionId}`;
}

export async function savePendingBooking(
  sessionId: string,
  payload: PendingBooking,
): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.set(key(sessionId), JSON.stringify(payload), { ex: TTL_SEC });
    return true;
  } catch (error: unknown) {
    console.error("[pending-booking] save failed:", error);
    return false;
  }
}

export async function loadPendingBooking(sessionId: string): Promise<PendingBooking | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key(sessionId));
    if (!raw) return null;
    // Upstash may return an already-parsed object or a JSON string.
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as PendingBooking;
  } catch (error: unknown) {
    console.error("[pending-booking] load failed:", error);
    return null;
  }
}

export async function clearPendingBooking(sessionId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key(sessionId));
  } catch {
    // A leftover key expires on its own — never fail the booking over cleanup.
  }
}
