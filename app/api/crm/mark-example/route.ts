import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/conversation-store";
import { saveExample } from "@/lib/ai-memory";

export async function POST(req: NextRequest) {
  try {
    const { platform, senderId, destination } = await req.json();

    if (!platform || !senderId) {
      return NextResponse.json({ error: "platform və senderId tələb olunur" }, { status: 400 });
    }

    const historyKey = `${platform}_${senderId}`;
    const history = await getHistory(historyKey);

    if (history.length < 2) {
      return NextResponse.json({ error: "Söhbət tarixi tapılmadı" }, { status: 404 });
    }

    await saveExample(platform, senderId, history, "manual", destination);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
