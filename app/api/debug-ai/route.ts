import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const result = await getAIResponse(message || "İstanbul uçuş biletinin qiyməti nədir?", []);
    return NextResponse.json({ message: result.message });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
