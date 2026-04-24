import { NextRequest, NextResponse } from "next/server";
import { runWorkflows, TriggerEvent } from "@/lib/workflow-engine";
import { requireStaff, isAuthError } from "@/lib/require-auth";

export async function POST(req: NextRequest) {
  const auth = await requireStaff(req);
  if (isAuthError(auth)) return auth;

  try {
    const { event, data } = await req.json();
    if (!event) return NextResponse.json({ ok: false }, { status: 400 });
    await runWorkflows(event as TriggerEvent, data || {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
