import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai-agent";

export async function GET() {
  const start = Date.now();
  try {
    const result = await getAIResponse(
      "Dubai da may 15-22 arasinda 2 nefer ucun otel qiymetleri",
      []
    );
    return NextResponse.json({ reply: result.message, ms: Date.now() - start });
  } catch (e) {
    return NextResponse.json({ error: String(e), ms: Date.now() - start });
  }
}
