import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { requireStaff, isAuthError } from "@/lib/require-auth";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

export async function GET(req: NextRequest) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  if (!redis) return NextResponse.json([]);

  // Son 50 aktiv sessiya — ən yeni əvvəldə
  const members = await redis.zrange("active_chat_sessions", 0, 49, { rev: true });
  if (!members || members.length === 0) return NextResponse.json([]);

  const sessions = await Promise.all(
    (members as string[]).map(async (sessionId) => {
      const history = await redis!.get<{ role: string; content: string }[]>(`chat:${sessionId}`);
      const meta    = await redis!.hgetall(`chat_meta:${sessionId}`);
      const adminActive = await redis!.exists(`admin_active:${sessionId}`);

      if (!history || history.length === 0) return null;

      const userMsgs = history.filter(m => m.role === "user");
      const lastMsg  = history[history.length - 1];

      return {
        sessionId,
        lastMessage: String(meta?.lastMessage || lastMsg.content).slice(0, 80),
        lastRole: lastMsg.role,
        messageCount: history.length,
        userMessageCount: userMsgs.length,
        adminActive: adminActive === 1,
        updatedAt: meta?.updatedAt ? Number(meta.updatedAt) : 0,
      };
    })
  );

  return NextResponse.json(sessions.filter(Boolean));
}
