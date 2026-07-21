// lib/loyalty.ts
// Faza 7 — Loyalty, referrals and badges.
//
// IMPORTANT: points live in the app's EXISTING `loyalty_transactions` table
// (surfaced by /panel/rewards via lib/panel-context). This module deliberately
// writes there rather than to a second ledger — two competing balances would be
// worse than none. Referral codes likewise stay on `customer_profiles.referral_code`.
//
// Genuinely new here: referral relationship tracking (`referrals`) and badges.
//
// Rules:
//   • Points are only ever granted server-side (service-role).
//   • Every credit carries a `source_id`; a unique index makes re-crediting the
//     same trip a no-op instead of silently doubling someone's balance.

import { getSupabaseAdmin } from "./supabase";

/** 1 point per whole USD spent. */
export const POINTS_PER_USD = 1;
/** Points for the referrer once their invitee completes a paid trip. */
export const REFERRAL_BONUS_POINTS = 500;

/** Matches the existing loyalty_transactions.type values. */
export type LoyaltyType = "earn" | "redeem" | "bonus" | "referral";

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  amount_points: number;
  type: LoyaltyType;
  description: string;
  source_id: string | null;
  booking_id: string | null;
  created_at: string;
}

export function pointsForUsd(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.floor(usd * POINTS_PER_USD);
}

/**
 * Appends a points entry. Safe to call twice for the same `sourceId`: the unique
 * index turns the duplicate into a no-op rather than double-crediting.
 */
export async function recordPoints(params: {
  userId: string;
  points: number;
  type: LoyaltyType;
  description: string;
  sourceId?: string;
  bookingId?: string;
}): Promise<boolean> {
  if (params.points === 0) return true;

  const { error } = await getSupabaseAdmin().from("loyalty_transactions").insert([{
    user_id: params.userId,
    amount_points: Math.abs(params.points),
    type: params.type,
    description: params.description,
    source_id: params.sourceId ?? null,
    booking_id: params.bookingId ?? null,
  }]);

  if (error) {
    // 23505 = duplicate source → already credited, which is the desired outcome.
    if (error.code === "23505") return true;
    console.warn("[loyalty] recordPoints failed:", error.message);
    return false;
  }
  return true;
}

/** Credits points for a completed, paid trip. */
export async function awardBookingPoints(params: {
  userId: string;
  sagaId: string;
  usdAmount: number;
}): Promise<boolean> {
  return recordPoints({
    userId: params.userId,
    points: pointsForUsd(params.usdAmount),
    type: "earn",
    description: `Trip booking — $${Math.round(params.usdAmount)}`,
    sourceId: `saga:${params.sagaId}`,
  });
}

/**
 * Reverses points when a trip is refunded. Recorded as a "redeem" row because
 * that is how the existing balance calculation subtracts points.
 */
export async function reverseBookingPoints(params: {
  userId: string;
  sagaId: string;
  usdAmount: number;
}): Promise<boolean> {
  return recordPoints({
    userId: params.userId,
    points: pointsForUsd(params.usdAmount),
    type: "redeem",
    description: `Refund reversal — $${Math.round(params.usdAmount)}`,
    sourceId: `saga-refund:${params.sagaId}`,
  });
}

/** Current balance, using the same earn/redeem rule as the rewards page. */
export async function getBalance(userId: string): Promise<number> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_transactions")
    .select("amount_points, type")
    .eq("user_id", userId);

  if (error || !data) return 0;

  const total = data.reduce(
    (sum, t) => (t.type === "redeem" ? sum - t.amount_points : sum + t.amount_points),
    0,
  );
  return Math.max(0, total);
}

export async function getHistory(userId: string, limit = 50): Promise<LoyaltyTransaction[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[loyalty] getHistory failed:", error.message);
    return [];
  }
  return (data ?? []) as LoyaltyTransaction[];
}

// ─── Referrals ───────────────────────────────────────────────────────────────

/** Ambiguous characters (O/0, I/1) excluded so codes survive being read aloud. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Returns the user's referral code from customer_profiles, creating one on first
 * call. This is the same field /panel/rewards already displays.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from("customer_profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.referral_code) return profile.referral_code as string;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const { error } = await admin
      .from("customer_profiles")
      .update({ referral_code: code })
      .eq("id", userId);

    if (!error) return code;
    if (error.code !== "23505") {
      console.warn("[loyalty] referral code creation failed:", error.message);
      return null;
    }
  }
  return null;
}

/** Links a new traveller to whoever referred them. Self-referral is blocked by the DB. */
export async function claimReferral(params: {
  code: string;
  referredUserId: string;
}): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const code = params.code.toUpperCase();

  const { data: owner } = await admin
    .from("customer_profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  if (!owner?.id) return false;

  const { error } = await admin.from("referrals").insert([{
    referrer_id: owner.id,
    referred_id: params.referredUserId,
    code,
  }]);

  if (error) {
    // Already referred, or a self-referral rejected by the check constraint.
    if (error.code === "23505" || error.code === "23514") return false;
    console.warn("[loyalty] claimReferral failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Called once a referred traveller completes a paid trip: marks the referral
 * qualified and credits the referrer.
 */
export async function qualifyReferral(referredUserId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();

  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", referredUserId)
    .maybeSingle();

  if (!referral || referral.status === "qualified") return false;

  const { error } = await admin
    .from("referrals")
    .update({ status: "qualified", qualified_at: new Date().toISOString() })
    .eq("id", referral.id);

  if (error) {
    console.warn("[loyalty] qualifyReferral failed:", error.message);
    return false;
  }

  await recordPoints({
    userId: referral.referrer_id as string,
    points: REFERRAL_BONUS_POINTS,
    type: "referral",
    description: "Referral bonus — a friend completed their first trip",
    sourceId: `referral:${referral.id}`,
  });

  await awardBadge(referral.referrer_id as string, "friend-guide");
  return true;
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export async function awardBadge(userId: string, badgeSlug: string): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from("user_badges")
    .insert([{ user_id: userId, badge_slug: badgeSlug }]);

  if (error) {
    if (error.code === "23505") return true; // already awarded
    console.warn("[loyalty] awardBadge failed:", error.message);
    return false;
  }
  return true;
}

export async function getUserBadges(userId: string): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("user_badges")
    .select("badge_slug")
    .eq("user_id", userId);

  if (error) return [];
  return (data ?? []).map((r) => r.badge_slug as string);
}
