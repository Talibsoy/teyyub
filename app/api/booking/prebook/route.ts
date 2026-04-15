import { NextRequest, NextResponse } from "next/server";
import { prebook } from "@/lib/ratehawk-booking";

export async function POST(req: NextRequest) {
  try {
    const { hash } = await req.json();
    if (!hash) return NextResponse.json({ error: "hash lazımdır" }, { status: 400 });

    const result = await prebook(hash);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Prebook]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
