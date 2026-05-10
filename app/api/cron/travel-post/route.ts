import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DESTINATIONS = [
  { country: "Türkiyə", emoji: "🇹🇷", query: "Turkey travel Istanbul Antalya" },
  { country: "Dubay", emoji: "🇦🇪", query: "Dubai travel UAE skyline" },
  { country: "Misir", emoji: "🇪🇬", query: "Egypt pyramids travel Cairo" },
  { country: "Maldiv adaları", emoji: "🇲🇻", query: "Maldives island travel ocean" },
  { country: "İtaliya", emoji: "🇮🇹", query: "Italy Rome Venice travel" },
  { country: "Yunanıstan", emoji: "🇬🇷", query: "Greece Santorini travel" },
  { country: "Tailand", emoji: "🇹🇭", query: "Thailand Bangkok travel" },
  { country: "İspaniya", emoji: "🇪🇸", query: "Spain Barcelona travel" },
  { country: "Fransa", emoji: "🇫🇷", query: "France Paris Eiffel Tower travel" },
  { country: "Marokko", emoji: "🇲🇦", query: "Morocco Marrakech travel" },
  { country: "Bali", emoji: "🇮🇩", query: "Bali Indonesia travel temple" },
  { country: "Portuqaliya", emoji: "🇵🇹", query: "Portugal Lisbon travel" },
  { country: "Çexiya", emoji: "🇨🇿", query: "Czech Republic Prague travel" },
  { country: "Avstriya", emoji: "🇦🇹", query: "Austria Vienna travel" },
  { country: "İsveçrə", emoji: "🇨🇭", query: "Switzerland Alps travel" },
  { country: "Sinqapur", emoji: "🇸🇬", query: "Singapore city travel" },
  { country: "Yaponiya", emoji: "🇯🇵", query: "Japan Tokyo travel cherry blossom" },
  { country: "Səudiyyə Ərəbistanı", emoji: "🇸🇦", query: "Saudi Arabia Riyadh travel" },
  { country: "Qətər", emoji: "🇶🇦", query: "Qatar Doha travel skyline" },
];

export async function GET(req: NextRequest) {
  // Vercel Cron və ya manual token yoxlaması
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret = process.env.CRON_SECRET;
  if (!secret || (authHeader !== `Bearer ${secret}` && querySecret !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();

    // 30 gündən köhnə qeydləri sil
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    await db.from("travel_posts").delete().lt("created_at", fifteenDaysAgo);

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
      const query = encodeURIComponent(dest.query);
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

    const caption = `${dest.emoji} ${title}\n\n${content}\n\n🌐 natourefly.com`;

    // ── Instagram-a paylaş ──────────────────────────────────────────────────
    let ig_post_id: string | null = null;
    let ig_error: string | null = null;
    const igToken = process.env.FB_PAGE_TOKEN;
    const igUserId = process.env.IG_USER_ID || process.env.META_IG_USER_ID;

    if (!igToken || !igUserId) {
      ig_error = !igToken ? "FB_PAGE_TOKEN yoxdur" : "IG_USER_ID / META_IG_USER_ID env var yoxdur";
    } else if (!image_url) {
      ig_error = "Şəkil yoxdur, Instagram post atılmadı";
    } else {
      try {
        const containerRes = await fetch(
          `https://graph.facebook.com/v20.0/${igUserId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url,
              caption,
              media_type: "IMAGE",
              access_token: igToken,
            }),
          }
        );
        const containerData = await containerRes.json() as { id?: string; error?: { message: string } };

        if (containerData.id) {
          const publishRes = await fetch(
            `https://graph.facebook.com/v20.0/${igUserId}/media_publish`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: igToken,
              }),
            }
          );
          const publishData = await publishRes.json() as { id?: string; error?: { message: string } };
          if (publishData.id) {
            ig_post_id = publishData.id;
            console.log("[IG] Post uğurlu:", ig_post_id);
          } else {
            ig_error = publishData.error?.message || "Publish xəta";
            console.error("[IG] Publish xəta:", ig_error);
          }
        } else {
          ig_error = containerData.error?.message || "Container xəta";
          console.error("[IG] Container xəta:", ig_error);
        }
      } catch (e) {
        ig_error = String(e);
        console.error("[IG] Exception:", e);
      }
    }

    return NextResponse.json({ success: true, country: dest.country, title, ig_post_id, ig_error });
  } catch (err) {
    console.error("[Cron] Travel post xətası:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
