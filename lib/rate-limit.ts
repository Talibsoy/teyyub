import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export async function checkRateLimit(
  key: string,
  limit = 20,
  windowSec = 60
): Promise<boolean> {
  if (!redis) return true; // Redis yoxdursa, keç

  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }
  return count <= limit;
}
