import { Redis } from "@upstash/redis";

type Message = { role: "user" | "assistant"; content: string };

// Redis varsa istifadə et, yoxsa in-memory fallback
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const memoryStore = new Map<string, Message[]>();

const TTL = 60 * 60 * 24; // 24 saat

export async function getHistory(key: string): Promise<Message[]> {
  if (redis) {
    const data = await redis.get<Message[]>(key);
    return data || [];
  }
  return memoryStore.get(key) || [];
}

export async function saveHistory(key: string, history: Message[]): Promise<void> {
  if (history.length > 20) history.splice(0, 2);
  if (redis) {
    await redis.set(key, history, { ex: TTL });
  } else {
    memoryStore.set(key, history);
  }
}
