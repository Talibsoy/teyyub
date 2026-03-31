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
  // Vercel Cron və ya manual token yoxlaması
  const authHeader = req.headers.get("authorization");
  const urlToken = new URL(req.url).searchParams.get("token");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}` && urlToken !== secret) {
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
      max_tokens: 1200,
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

    const title = (titleMatch?.[1]?.trim() || `${dest.country} — Turizm Məlumatı`)
      .replace(/\*\*/g, "").trim();
    const content = (contentMatch?.[1]?.trim() || raw)
      .replace(/\*\*/g, "").replace(/\*/g, "").trim();

    // Unsplash-dan şəkil tap
    let image_url: string | null = null;
    try {
      const query = encodeURIComponent(`${dest.country} travel`);
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
      console.log("[Unsplash] Key var:", !!unsplashKey, "Query:", query);
      const imgRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&orientation=landscape&per_page=5`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      );
      console.log("[Unsplash] Status:", imgRes.status);
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const results = imgData.results || [];
        console.log("[Unsplash] Nəticə sayı:", results.length);
        if (results.length > 0) {
          const pick = results[Math.floor(Math.random() * results.length)];
          image_url = pick.urls?.regular || null;
          console.log("[Unsplash] URL:", image_url);
        }
      } else {
        const errText = await imgRes.text();
        console.log("[Unsplash] Xəta:", errText);
      }
    } catch (e) {
      console.log("[Unsplash] Exception:", e);
      image_url = null;
    }

    await db.from("travel_posts").insert({
      country: dest.country,
      emoji: dest.emoji,
      title,
      content,
      image_query: `${dest.country} travel tourism`,
      image_url,
    });

    return NextResponse.json({ success: true, country: dest.country, title });
  } catch (err) {
    console.error("[Cron] Travel post xətası:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
