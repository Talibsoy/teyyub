import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DESTINATIONS = [
  { country: "Türkiyə", emoji: "🇹🇷" },
  { country: "Dubay", emoji: "🇦🇪" },
  { country: "Misir", emoji: "🇪🇬" },
  { country: "Maldiv adaları", emoji: "🇲🇻" },
  { country: "İtaliya", emoji: "🇮🇹" },
  { country: "Yunanıstan", emoji: "🇬🇷" },
  { country: "Tailand", emoji: "🇹🇭" },
  { country: "İspaniya", emoji: "🇪🇸" },
  { country: "Fransa", emoji: "🇫🇷" },
  { country: "Marokko", emoji: "🇲🇦" },
  { country: "Bali", emoji: "🇮🇩" },
  { country: "Maldiv adaları", emoji: "🇲🇻" },
  { country: "Portuqaliya", emoji: "🇵🇹" },
  { country: "Çexiya", emoji: "🇨🇿" },
  { country: "Avstriya", emoji: "🇦🇹" },
  { country: "İsveçrə", emoji: "🇨🇭" },
  { country: "Sinqapur", emoji: "🇸🇬" },
  { country: "Yaponiya", emoji: "🇯🇵" },
  { country: "Səudiyyə Ərəbistanı", emoji: "🇸🇦" },
  { country: "Qətər", emoji: "🇶🇦" },
];

export async function GET(req: NextRequest) {
  // Vercel Cron yoxlaması
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();

    // Bu həftə hansı ölkələr yazılıb — dublikat olmasın
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await db
      .from("travel_posts")
      .select("country")
      .gte("created_at", weekAgo);

    const recentCountries = (recent || []).map((r) => r.country);
    const available = DESTINATIONS.filter((d) => !recentCountries.includes(d.country));
    const dest = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];

    // Claude ilə məlumat yaz
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `${dest.country} haqqında turizm məlumatı yaz. Format:

BAŞLIQ: (cəlbedici, 8-12 söz)
MƏZMUN: (3-4 abzas, hər biri 2-3 cümlə. Görməli yerlər, mətbəx, ən yaxşı mövsüm, praktik məlumatlar. Azərbaycanlı turist perspektivindən. Natoure.az vasitəsilə getmək tövsiyəsi ilə bitir.)

Yalnız Azərbaycan dilində yaz. Emoji istifadə et.`,
        },
      ],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const titleMatch = raw.match(/BAŞLIQ:\s*(.+)/);
    const contentMatch = raw.match(/MƏZMUN:\s*([\s\S]+)/);

    const title = titleMatch?.[1]?.trim() || `${dest.country} — Turizm Məlumatı`;
    const content = contentMatch?.[1]?.trim() || raw;

    await db.from("travel_posts").insert({
      country: dest.country,
      emoji: dest.emoji,
      title,
      content,
      image_query: `${dest.country} travel tourism`,
    });

    return NextResponse.json({ success: true, country: dest.country, title });
  } catch (err) {
    console.error("[Cron] Travel post xətası:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
