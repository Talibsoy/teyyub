// lib/profile-cache.ts
// NatoureFly Personalization Engine — Redis-based User Profile Cache

import { Redis } from "@upstash/redis";
import type { UserProfileScores } from "./quiz-processor";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const PROFILE_TTL  = 300;   // 5 dəqiqə — aktiv session cache
const EVENT_COUNT_TTL = 86400; // 24 saat — event counter

function profileKey(userId: string) { return `persona:profile:${userId}`; }
function eventCountKey(userId: string) { return `persona:events:${userId}`; }

// ─── Profile Cache ──────────────────────────────────────────────────────────

export async function getCachedProfile(
  userId: string
): Promise<UserProfileScores | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<UserProfileScores>(profileKey(userId));
    return data ?? null;
  } catch {
    return null;
  }
}

export async function setCachedProfile(
  userId: string,
  profile: UserProfileScores
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(profileKey(userId), profile, { ex: PROFILE_TTL });
  } catch {
    // Silent fail
  }
}

export async function invalidateProfile(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(profileKey(userId));
  } catch {
    // Silent fail
  }
}

// ─── Behavioral Event Counter ────────────────────────────────────────────────
// Hər 20 eventdən sonra arxetip yenidən qiymətləndirilir

export async function incrementEventCount(userId: string): Promise<number> {
  if (!redis) return 0;
  try {
    const key = eventCountKey(userId);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, EVENT_COUNT_TTL);
    }
    return count;
  } catch {
    return 0;
  }
}

export async function resetEventCount(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(eventCountKey(userId));
  } catch {
    // Silent fail
  }
}

// ─── Scored Results Cache ────────────────────────────────────────────────────
// Axtarış nəticələrini qısa müddət cache-lər

const SEARCH_TTL = 600; // 10 dəqiqə

export async function getCachedSearchResults<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(`persona:search:${key}`);
  } catch {
    return null;
  }
}

export async function setCachedSearchResults<T>(
  key: string,
  results: T
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`persona:search:${key}`, results, { ex: SEARCH_TTL });
  } catch {
    // Silent fail
  }
}
