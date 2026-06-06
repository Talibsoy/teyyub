import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Amerika qitəsi: bütün 50 ABŞ ştatı + Havaii adaları + ABŞ əraziləri + Kanada,
// Meksika, Mərkəzi Amerika, Karib adaları, Braziliya və Cənubi Amerika.
// `country` sahəsi dublikat yoxlaması üçün açardır, ona görə hər biri unikaldır.
const DESTINATIONS = [
  // ── ABŞ — 50 ŞTAT ──────────────────────────────────────────────
  { country: "Gulf Shores, Alabama", emoji: "🏖️", query: "Gulf Shores Alabama beach" },
  { country: "Denali & Glaciers, Alaska", emoji: "🐻", query: "Alaska Denali glacier wildlife" },
  { country: "Grand Canyon, Arizona", emoji: "🏜️", query: "Grand Canyon Arizona desert" },
  { country: "Hot Springs, Arkansas", emoji: "♨️", query: "Hot Springs National Park Arkansas" },
  { country: "Yosemite & Coast, California", emoji: "🏞️", query: "Yosemite California Golden Gate coast" },
  { country: "Rocky Mountains, Colorado", emoji: "⛰️", query: "Rocky Mountains Colorado Denver" },
  { country: "Coastal New England, Connecticut", emoji: "🍁", query: "Connecticut New England autumn coast" },
  { country: "Rehoboth Beach, Delaware", emoji: "🏖️", query: "Delaware Rehoboth Beach coast" },
  { country: "Miami & Everglades, Florida", emoji: "🏖️", query: "Florida Miami beach Everglades" },
  { country: "Savannah, Georgia", emoji: "🌳", query: "Savannah Georgia historic district" },
  { country: "Volcanoes & Beaches, Hawaii", emoji: "🌺", query: "Hawaii beach volcano island" },
  { country: "Sawtooth Mountains, Idaho", emoji: "🏔️", query: "Idaho Sawtooth mountains lake" },
  { country: "Chicago, Illinois", emoji: "🌆", query: "Chicago Illinois skyline river" },
  { country: "Indianapolis, Indiana", emoji: "🏁", query: "Indianapolis Indiana speedway downtown" },
  { country: "Heartland Plains, Iowa", emoji: "🌾", query: "Iowa countryside fields barn" },
  { country: "Tallgrass Prairie, Kansas", emoji: "🌻", query: "Kansas prairie plains sunflower" },
  { country: "Bluegrass Country, Kentucky", emoji: "🐎", query: "Kentucky bluegrass horses Louisville" },
  { country: "New Orleans, Louisiana", emoji: "🎷", query: "New Orleans Louisiana French Quarter" },
  { country: "Acadia Coast, Maine", emoji: "🦞", query: "Maine Acadia coast lighthouse" },
  { country: "Chesapeake Bay, Maryland", emoji: "🦀", query: "Maryland Baltimore Chesapeake Bay" },
  { country: "Boston, Massachusetts", emoji: "📜", query: "Boston Massachusetts Freedom Trail" },
  { country: "Great Lakes, Michigan", emoji: "🌊", query: "Michigan Great Lakes Mackinac" },
  { country: "Land of Lakes, Minnesota", emoji: "🛶", query: "Minnesota lakes Boundary Waters" },
  { country: "Mississippi River Delta", emoji: "🎶", query: "Mississippi River delta blues" },
  { country: "Gateway Arch, Missouri", emoji: "🌉", query: "St Louis Missouri Gateway Arch" },
  { country: "Glacier National Park, Montana", emoji: "🏔️", query: "Glacier National Park Montana" },
  { country: "Sandhills, Nebraska", emoji: "🌾", query: "Nebraska sandhills plains" },
  { country: "Las Vegas, Nevada", emoji: "🎰", query: "Las Vegas Nevada Strip night" },
  { country: "White Mountains, New Hampshire", emoji: "🍁", query: "New Hampshire White Mountains autumn" },
  { country: "Atlantic City, New Jersey", emoji: "🎡", query: "New Jersey Atlantic City boardwalk" },
  { country: "Santa Fe, New Mexico", emoji: "🎈", query: "Santa Fe New Mexico desert balloon" },
  { country: "New York City, New York", emoji: "🗽", query: "New York City skyline Statue of Liberty" },
  { country: "Blue Ridge Mountains, North Carolina", emoji: "🏔️", query: "North Carolina Blue Ridge Smoky Mountains" },
  { country: "Badlands, North Dakota", emoji: "🦬", query: "North Dakota Theodore Roosevelt badlands" },
  { country: "Cleveland & Lake Erie, Ohio", emoji: "🎸", query: "Cleveland Ohio rock hall lake" },
  { country: "Route 66, Oklahoma", emoji: "🤠", query: "Oklahoma route 66 plains" },
  { country: "Crater Lake & Coast, Oregon", emoji: "🌲", query: "Oregon Crater Lake coast forest" },
  { country: "Philadelphia, Pennsylvania", emoji: "🔔", query: "Philadelphia Pennsylvania Liberty Bell" },
  { country: "Newport, Rhode Island", emoji: "⛵", query: "Rhode Island Newport mansions coast" },
  { country: "Charleston, South Carolina", emoji: "🌴", query: "Charleston South Carolina historic" },
  { country: "Mount Rushmore, South Dakota", emoji: "🗿", query: "Mount Rushmore South Dakota monument" },
  { country: "Smoky Mountains & Nashville, Tennessee", emoji: "🎸", query: "Nashville Tennessee Smoky Mountains" },
  { country: "San Antonio, Texas", emoji: "🤠", query: "San Antonio Texas Alamo River Walk" },
  { country: "Zion & Bryce Canyon, Utah", emoji: "🪨", query: "Zion Bryce Canyon Utah" },
  { country: "Green Mountains, Vermont", emoji: "🍁", query: "Vermont Green Mountains autumn" },
  { country: "Shenandoah, Virginia", emoji: "🏛️", query: "Virginia Shenandoah Williamsburg" },
  { country: "Seattle & Mount Rainier, Washington", emoji: "🗻", query: "Seattle Washington Space Needle Mount Rainier" },
  { country: "New River Gorge, West Virginia", emoji: "🚣", query: "West Virginia New River Gorge" },
  { country: "Wisconsin Dells", emoji: "🧀", query: "Wisconsin Dells lakes" },
  { country: "Yellowstone & Grand Teton, Wyoming", emoji: "🌋", query: "Yellowstone Grand Teton Wyoming" },

  // ── ABŞ FEDERAL & ƏRAZİLƏR ────────────────────────────────────
  { country: "Washington, D.C.", emoji: "🏛️", query: "Washington DC monuments Capitol" },
  { country: "Puerto Rico", emoji: "🏝️", query: "Puerto Rico San Juan beach old town" },
  { country: "U.S. Virgin Islands", emoji: "🐠", query: "US Virgin Islands St Thomas beach" },

  // ── HAVAİİ ADALARI ────────────────────────────────────────────
  { country: "Oahu, Hawaii", emoji: "🏝️", query: "Oahu Hawaii Waikiki Diamond Head" },
  { country: "Maui, Hawaii", emoji: "🌅", query: "Maui Hawaii road to Hana beach" },
  { country: "Kauai, Hawaii", emoji: "🏞️", query: "Kauai Hawaii Na Pali coast" },
  { country: "Big Island, Hawaii", emoji: "🌋", query: "Big Island Hawaii volcano Kilauea" },

  // ── KANADA ────────────────────────────────────────────────────
  { country: "Toronto, Canada", emoji: "🏙️", query: "Toronto Canada CN Tower skyline" },
  { country: "Vancouver, Canada", emoji: "🌲", query: "Vancouver Canada mountains harbor" },
  { country: "Banff National Park, Canada", emoji: "🏔️", query: "Banff National Park Canada lake" },
  { country: "Quebec City, Canada", emoji: "🏰", query: "Quebec City Canada old town castle" },
  { country: "Montreal, Canada", emoji: "⛪", query: "Montreal Canada old city" },

  // ── MEKSİKA ───────────────────────────────────────────────────
  { country: "Cancún, Mexico", emoji: "🏖️", query: "Cancun Mexico beach Caribbean" },
  { country: "Mexico City, Mexico", emoji: "🏛️", query: "Mexico City Zocalo historic" },
  { country: "Tulum, Mexico", emoji: "🏝️", query: "Tulum Mexico Mayan ruins beach" },
  { country: "Chichén Itzá, Mexico", emoji: "🛕", query: "Chichen Itza Mexico pyramid Mayan" },
  { country: "Cabo San Lucas, Mexico", emoji: "🌊", query: "Cabo San Lucas Mexico beach arch" },

  // ── MƏRKƏZİ AMERİKA ──────────────────────────────────────────
  { country: "Costa Rica", emoji: "🦥", query: "Costa Rica rainforest beach volcano" },
  { country: "Panama Canal & City", emoji: "🚢", query: "Panama Canal city skyline" },
  { country: "Tikal & Antigua, Guatemala", emoji: "🛕", query: "Guatemala Tikal Antigua ruins" },

  // ── KARİB ADALARI ────────────────────────────────────────────
  { country: "Bahamas", emoji: "🏝️", query: "Bahamas beach turquoise water" },
  { country: "Jamaica", emoji: "🌴", query: "Jamaica beach waterfall" },
  { country: "Dominican Republic", emoji: "🏖️", query: "Dominican Republic Punta Cana beach" },
  { country: "Havana, Cuba", emoji: "🚗", query: "Cuba Havana old town classic car" },
  { country: "Aruba", emoji: "🌊", query: "Aruba beach Caribbean" },
  { country: "Barbados", emoji: "🐢", query: "Barbados beach Caribbean" },

  // ── BRAZİLİYA ─────────────────────────────────────────────────
  { country: "Rio de Janeiro, Brazil", emoji: "🎉", query: "Rio de Janeiro Brazil Christ Redeemer beach" },
  { country: "Amazon Rainforest, Brazil", emoji: "🌳", query: "Amazon rainforest Brazil river" },
  { country: "Iguaçu Falls, Brazil", emoji: "💦", query: "Iguazu Falls Brazil waterfall" },
  { country: "Salvador, Brazil", emoji: "🥁", query: "Salvador Bahia Brazil colorful" },

  // ── CƏNUBİ AMERİKA ───────────────────────────────────────────
  { country: "Machu Picchu, Peru", emoji: "🏔️", query: "Machu Picchu Peru Inca ruins" },
  { country: "Patagonia, Argentina", emoji: "🏔️", query: "Patagonia Argentina mountains glacier" },
  { country: "Buenos Aires, Argentina", emoji: "💃", query: "Buenos Aires Argentina tango city" },
  { country: "Galápagos Islands, Ecuador", emoji: "🐢", query: "Galapagos Islands Ecuador wildlife" },
  { country: "Cartagena, Colombia", emoji: "🌴", query: "Cartagena Colombia colorful old town" },
  { country: "Atacama Desert, Chile", emoji: "🌵", query: "Atacama Desert Chile landscape" },
  { country: "Torres del Paine, Chile", emoji: "🗻", query: "Torres del Paine Chile Patagonia" },
  { country: "Uyuni Salt Flats, Bolivia", emoji: "🧂", query: "Uyuni Salt Flats Bolivia mirror" },
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

    // 3 dildə məlumat yaz (AZ, EN, TR)
    const LANG_PROMPTS = [
      {
        code: "az",
        instruction: "Yalnız Azərbaycan dilində yaz. Rəsmi Azərbaycan dili istifadə et.",
        fallback: `${dest.country} — Səyahət Bələdçisi`,
      },
      {
        code: "en",
        instruction: "Only write in English.",
        fallback: `${dest.country} — Travel Guide`,
      },
      {
        code: "tr",
        instruction: "Yalnızca Türkçe yaz. Resmi Türkçe kullan.",
        fallback: `${dest.country} — Seyahat Rehberi`,
      },
    ];

    const langResults: { code: string; title: string; content: string }[] = [];

    for (const lang of LANG_PROMPTS) {
      try {
        const msg = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          messages: [
            {
              role: "user",
              content: `Write engaging travel tourism information about ${dest.country}, a destination in the Americas (North, Central, South America or the Caribbean).

Respond in EXACTLY this format, starting the first line with "TITLE:" and the body with "CONTENT:":
TITLE: (engaging, 8-12 words)
CONTENT: (3-4 paragraphs, 2-3 sentences each. Must cover the top places to visit, historical & cultural landmarks and monuments, and the natural / geographic beauty of the area, plus the best travel season and one practical tip. End with a recommendation to travel with NatoureFly via natourefly.com.)

Plain text only — do NOT use markdown headings (#), bold (**) or any markdown symbols. ${lang.instruction} Use emojis.`,
            },
          ],
        });
        const raw = msg.content[0].type === "text" ? msg.content[0].text : "";

        // Başlıq: əvvəl "TITLE:" etiketi, olmasa ilk markdown başlığı (# ...), olmasa fallback
        const labeledTitle = raw.match(/TITLE:\s*(.+)/i)?.[1]?.trim();
        const headingMatch = raw.match(/^\s*#{1,6}\s*(.+)$/m);
        const title = (labeledTitle || headingMatch?.[1] || lang.fallback)
          .replace(/[#*_`]/g, "").trim();

        // Kontent: "CONTENT:"-dən sonrası, olmasa bütün mətn; markdown işarələrini təmizlə
        let body = raw.match(/CONTENT:\s*([\s\S]+)/i)?.[1] ?? raw;
        // Model başlığı markdown kimi yazıbsa, həmin sətri kontentdən çıxar (title olaraq götürüldü)
        if (!labeledTitle && headingMatch) body = body.replace(headingMatch[0], "");
        const content = body
          .replace(/^\s*#{1,6}\s*/gm, "")   // sətir başı # işarələri
          .replace(/[*_`]/g, "")            // **bold**, *italic*, `code`
          .trim();

        langResults.push({ code: lang.code, title, content });
      } catch (e) {
        console.error(`[Cron] ${lang.code} yazma xətası:`, e);
      }
    }

    // EN nəticəni caption üçün saxla
    const enResult = langResults.find(r => r.code === "en") || langResults[0];
    const title   = enResult?.title   || `${dest.country} — Travel Guide`;
    const content = enResult?.content || "";

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

    // Hər dil üçün ayrıca sıra daxil et
    for (const lr of langResults) {
      await db.from("travel_posts").insert({
        country: dest.country,
        emoji: dest.emoji,
        title: lr.title,
        content: lr.content,
        language: lr.code,
        image_query: `${dest.country} travel tourism`,
        image_url,
      });
    }

    const caption = `${dest.emoji} ${title}\n\n${content}\n\n🌐 natourefly.com\n\n#natourefly #travel #tourism #americas #usa #canada #mexico #southamerica #caribbean`;

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
