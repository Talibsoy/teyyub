import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export async function GET() {
  if (!redis) return NextResponse.json([]);

  // Son 24 saatda aktiv olan chat sesssiyaları
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [next, batch] = await (redis as Redis).scan(cursor, { match: "chat:*", count: 100 });
    cursor = Number(next);
    keys.push(...(batch as string[]));
  } while (cursor !== 0);

  const sessions = await Promise.all(
    keys.map(async (key) => {
      const history = await redis!.get<{ role: string; content: string }[]>(key);
      if (!history || history.length === 0) return null;
      const sessionId = key.replace("chat:", "");
      const lastMsg = history[history.length - 1];
      const userMsgs = history.filter(m => m.role === "user");
      const adminActive = await redis!.exists(`admin_active:${sessionId}`);
      return {
        sessionId,
        lastMessage: lastMsg.content.slice(0, 80),
        lastRole: lastMsg.role,
        messageCount: history.length,
        userMessageCount: userMsgs.length,
        adminActive: adminActive === 1,
      };
    })
  );

  return NextResponse.json(sessions.filter(Boolean).reverse());
}
