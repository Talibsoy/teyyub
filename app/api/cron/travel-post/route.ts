import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DESTINATIONS = [
  { country: "Turkey", emoji: "🇹🇷", query: "Turkey travel Istanbul Antalya" },
  { country: "Dubai", emoji: "🇦🇪", query: "Dubai travel UAE skyline" },
  { country: "Egypt", emoji: "🇪🇬", query: "Egypt pyramids travel Cairo" },
  { country: "Maldives", emoji: "🇲🇻", query: "Maldives island travel ocean" },
  { country: "Italy", emoji: "🇮🇹", query: "Italy Rome Venice travel" },
  { country: "Greece", emoji: "🇬🇷", query: "Greece Santorini travel" },
  { country: "Thailand", emoji: "🇹🇭", query: "Thailand Bangkok travel" },
  { country: "Spain", emoji: "🇪🇸", query: "Spain Barcelona travel" },
  { country: "France", emoji: "🇫🇷", query: "France Paris Eiffel Tower travel" },
  { country: "Morocco", emoji: "🇲🇦", query: "Morocco Marrakech travel" },
  { country: "Bali", emoji: "🇮🇩", query: "Bali Indonesia travel temple" },
  { country: "Portugal", emoji: "🇵🇹", query: "Portugal Lisbon travel" },
  { country: "Czech Republic", emoji: "🇨🇿", query: "Czech Republic Prague travel" },
  { country: "Austria", emoji: "🇦🇹", query: "Austria Vienna travel" },
  { country: "Switzerland", emoji: "🇨🇭", query: "Switzerland Alps travel" },
  { country: "Singapore", emoji: "🇸🇬", query: "Singapore city travel" },
  { country: "Japan", emoji: "🇯🇵", query: "Japan Tokyo travel cherry blossom" },
  { country: "Saudi Arabia", emoji: "🇸🇦", query: "Saudi Arabia Riyadh travel" },
  { country: "Qatar", emoji: "🇶🇦", query: "Qatar Doha travel skyline" },
];

export async function GET(req: NextRequest) {
  // Vercel Cron və ya manual token yoxlaması
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret = process.env.HOTELS_CRONSECRET;
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isAuthorizedSecret = secret && (authHeader === `Bearer ${secret}` || querySecret === secret);

  if (!isVercelCron && !isAuthorizedSecret) {
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
          content: `Write engaging travel tourism information about ${dest.country}. Format:

TITLE: (engaging, 8-12 words)
CONTENT: (3-4 paragraphs, 2-3 sentences each. Must cover highlights, local cuisine, best travel season, and practical tips. End with a recommendation to travel with NatoureFly via natourefly.com.)

Only write in English. Use emojis.`,
        },
      ],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const titleMatch = raw.match(/TITLE:\s*(.+)/i);
    const contentMatch = raw.match(/CONTENT:\s*([\s\S]+)/i);

    const title = (titleMatch?.[1]?.trim() || `${dest.country} — Travel Guide`)
      .replace(/\*\*/g, "").trim();
    const content = (contentMatch?.[1]?.trim() || raw)
      .replace(/\*\*/g, "").replace(/\*/g, "").trim();

    // Unsplash-dan şəkil tap
    let image_url: string | null = null;
    try {
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
      
      const fetchImages = async (searchQuery: string) => {
        const imgRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${searchQuery}&orientation=landscape&per_page=5`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } }
        );
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          return imgData.results || [];
        }
        return [];
      };

      let query = encodeURIComponent(dest.query);
      console.log("[Unsplash] Key var:", !!unsplashKey, "İlkin Query:", query);
      
      let results = await fetchImages(query);
      console.log("[Unsplash] İlkin Nəticə sayı:", results.length);
      
      if (results.length === 0) {
        // Fallback: Təkcə ölkə adını və ya "travel" sözünü axtar
        query = encodeURIComponent(`${dest.country} landscape`);
        console.log("[Unsplash] Fallback Query:", query);
        results = await fetchImages(query);
        console.log("[Unsplash] Fallback Nəticə sayı:", results.length);
      }

      if (results.length > 0) {
        const pick = results[Math.floor(Math.random() * results.length)];
        image_url = pick.urls?.regular || null;
        console.log("[Unsplash] URL:", image_url);
      } else {
        console.log("[Unsplash] Xəta: Heç bir şəkil tapılmadı.");
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

    const caption = `${dest.emoji} ${title}\n\n${content}\n\n🌐 natourefly.com\n\n#natourefly #travel #tourism #azerbaijan`;

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
          // Instagram şəkli emal etməsi üçün gözlə, sonra status yoxla
          const containerId = containerData.id;
          let ready = false;
          for (let attempt = 0; attempt < 6; attempt++) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await fetch(
              `https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${igToken}`
            );
            const statusData = await statusRes.json() as { status_code?: string };
            if (statusData.status_code === "FINISHED") { ready = true; break; }
            if (statusData.status_code === "ERROR") { ig_error = "Container emal xətası"; break; }
          }

          if (ready) {
            const publishRes = await fetch(
              `https://graph.facebook.com/v20.0/${igUserId}/media_publish`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  creation_id: containerId,
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
          } else if (!ig_error) {
            ig_error = "Container 30 saniyədə hazır olmadı";
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
