import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Redis olmadıqda in-memory fallback (warm instance-daxili)
const memCounters = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  limit = 20,
  windowSec = 60
): Promise<boolean> {
  if (redis) {
    const redisKey = `rl:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSec);
    return count <= limit;
  }

  // Redis yoxdursa — in-memory counter (cold start-dan sonra sıfırlanır, qəbul edilir)
  const now = Date.now();
  const entry = memCounters.get(key);
  if (!entry || now > entry.resetAt) {
    memCounters.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
