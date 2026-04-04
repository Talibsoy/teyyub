import { NextRequest, NextResponse } from "next/server";
import { getPendingSummaries, markSummarySent } from "@/lib/conversation-store";
import { sendConversationSummary } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await getPendingSummaries();

  for (const meta of pending) {
    await sendConversationSummary(meta);
    await markSummarySent(meta.metaKey);
  }

  return NextResponse.json({ sent: pending.length });
}
