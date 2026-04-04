import { Redis } from "@upstash/redis";
import { CustomerData } from "@/lib/ai-agent";

type Message = { role: "user" | "assistant"; content: string };

export interface ConvMeta {
  platform: string;
  senderId: string;
  lastActivity: number;   // Unix ms
  startTime: number;      // Unix ms — söhbətin başlanğıcı
  customerData: Partial<CustomerData>;
  messageCount: number;
  lastUserMessage: string;
  summarySent: boolean;
}

// Redis varsa istifadə et, yoxsa in-memory fallback
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const memoryStore = new Map<string, Message[]>();

const TTL = 60 * 60 * 24 * 365; // 1 il
const META_TTL = 60 * 60 * 48;  // 48 saat

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

export async function saveConvMeta(
  key: string,
  update: { platform: string; senderId: string; customerData: Partial<CustomerData>; messageCount: number; lastUserMessage: string }
): Promise<void> {
  if (!redis) return;
  const metaKey = `conv_meta:${key}`;
  const existing = await redis.get<ConvMeta>(metaKey);
  const now = Date.now();

  const meta: ConvMeta = {
    platform: update.platform,
    senderId: update.senderId,
    lastActivity: now,
    startTime: existing?.startTime || now,
    customerData: { ...(existing?.customerData || {}), ...filterNull(update.customerData) },
    messageCount: update.messageCount,
    lastUserMessage: update.lastUserMessage,
    summarySent: false,  // yeni mesaj gəldi — özət yenidən göndərilməlidir
  };

  await redis.set(metaKey, meta, { ex: META_TTL });
}

export async function getConvMeta(key: string): Promise<ConvMeta | null> {
  if (!redis) return null;
  return redis.get<ConvMeta>(`conv_meta:${key}`);
}

export async function getPendingSummaries(): Promise<(ConvMeta & { metaKey: string })[]> {
  if (!redis) return [];

  const keys: string[] = [];
  let cursor = 0;
  do {
    const [next, batch] = await (redis as Redis).scan(cursor, { match: "conv_meta:*", count: 100 });
    cursor = Number(next);
    keys.push(...(batch as string[]));
  } while (cursor !== 0);

  const INACTIVE_MS = 30 * 60 * 1000; // 30 dəqiqə
  const now = Date.now();
  const pending: (ConvMeta & { metaKey: string })[] = [];

  for (const metaKey of keys) {
    const meta = await redis.get<ConvMeta>(metaKey);
    if (meta && !meta.summarySent && now - meta.lastActivity >= INACTIVE_MS) {
      pending.push({ ...meta, metaKey });
    }
  }

  return pending;
}

export async function markSummarySent(metaKey: string): Promise<void> {
  if (!redis) return;
  const meta = await redis.get<ConvMeta>(metaKey);
  if (meta) {
    await redis.set(metaKey, { ...meta, summarySent: true }, { ex: META_TTL });
  }
}

function filterNull(obj: Partial<CustomerData>): Partial<CustomerData> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  ) as Partial<CustomerData>;
}
