import { NextResponse } from "next/server";
import { searchHotelsForAI } from "@/lib/ratehawk";

export async function GET() {
  const start = Date.now();
  try {
    const result = await searchHotelsForAI({
      destination: "Dubai",
      checkin: "2026-05-15",
      checkout: "2026-05-22",
      guests: 2,
    });
    return NextResponse.json({ result, ms: Date.now() - start });
  } catch (e) {
    return NextResponse.json({ error: String(e), ms: Date.now() - start });
  }
}
