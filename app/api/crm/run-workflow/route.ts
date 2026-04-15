import { NextRequest, NextResponse } from "next/server";
import { runWorkflows, TriggerEvent } from "@/lib/workflow-engine";

export async function POST(req: NextRequest) {
  try {
    const { event, data } = await req.json();
    if (!event) return NextResponse.json({ ok: false }, { status: 400 });
    await runWorkflows(event as TriggerEvent, data || {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
