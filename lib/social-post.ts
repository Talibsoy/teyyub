const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_TOKEN          || "";
const PAGE_ID           = process.env.META_PAGE_ID           || "393640733828497";
const IG_USER_ID        = process.env.META_IG_USER_ID        || "";
const BOT_TOKEN         = process.env.TELEGRAM_BOT_TOKEN     || "";
const CHANNEL_ID        = process.env.TELEGRAM_CHANNEL_ID    || process.env.TELEGRAM_CHAT_ID || "";
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL    || "https://www.natourefly.com";

export interface TourPostData {
  id: string;
  name: string;
  destination: string;
  price_azn: number;
  start_date?: string | null;
  end_date?:   string | null;
  description?: string | null;
  image_url?:  string | null;
}

function buildCaption(tour: TourPostData): string {
  const dateStr = tour.start_date
    ? `📅 ${new Date(tour.start_date).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })}`
    : "";
  const link = `${APP_URL}/turlar/${tour.id}`;

  return [
    `✈️ *${tour.name}*`,
    `📍 ${tour.destination}`,
    `💰 ${tour.price_azn} ₼`,
    dateStr,
    tour.description ? `\n${tour.description}` : "",
    `\n🔗 ${link}`,
    "\n#natourefly #tur #səyahət #Azərbaycan",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function postToInstagram(tour: TourPostData): Promise<void> {
  if (!PAGE_ACCESS_TOKEN || !IG_USER_ID) return;
  if (!tour.image_url) return; // Instagram photo post şəkil tələb edir

  try {
    // 1. Media container yarat
    const containerRes = await fetch(
      `https://graph.facebook.com/v20.0/${IG_USER_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: tour.image_url,
          caption:   buildCaption(tour).replace(/\*/g, ""), // Instagram markdown istəmir
          access_token: PAGE_ACCESS_TOKEN,
        }),
      }
    );
    const container = await containerRes.json();
    if (!container.id) {
      console.error("[SocialPost] Instagram container xətası:", container);
      return;
    }

    // 2. Publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id:  container.id,
          access_token: PAGE_ACCESS_TOKEN,
        }),
      }
    );
    const published = await publishRes.json();
    if (!published.id) {
      console.error("[SocialPost] Instagram publish xətası:", published);
    }
  } catch (err) {
    console.error("[SocialPost] Instagram xəta:", err);
  }
}

export async function postToFacebook(tour: TourPostData): Promise<void> {
  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) return;

  try {
    const endpoint = tour.image_url
      ? `https://graph.facebook.com/v20.0/${PAGE_ID}/photos`
      : `https://graph.facebook.com/v20.0/${PAGE_ID}/feed`;

    const body: Record<string, string> = {
      access_token: PAGE_ACCESS_TOKEN,
    };

    if (tour.image_url) {
      body.url     = tour.image_url;
      body.caption = buildCaption(tour).replace(/\*/g, "");
    } else {
      body.message = buildCaption(tour).replace(/\*/g, "");
      body.link    = `${APP_URL}/turlar/${tour.id}`;
    }

    const res  = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!result.id && !result.post_id) {
      console.error("[SocialPost] Facebook post xətası:", result);
    }
  } catch (err) {
    console.error("[SocialPost] Facebook xəta:", err);
  }
}

export async function postToTelegramChannel(tour: TourPostData): Promise<void> {
  if (!BOT_TOKEN || !CHANNEL_ID) return;

  const text = buildCaption(tour);

  try {
    if (tour.image_url) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    CHANNEL_ID,
          photo:      tour.image_url,
          caption:    text,
          parse_mode: "Markdown",
        }),
      });
    } else {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    CHANNEL_ID,
          text,
          parse_mode: "Markdown",
        }),
      });
    }
  } catch (err) {
    console.error("[SocialPost] Telegram xəta:", err);
  }
}

export async function publishTourToAllChannels(tour: TourPostData): Promise<void> {
  await Promise.allSettled([
    postToInstagram(tour),
    postToFacebook(tour),
    postToTelegramChannel(tour),
  ]);
}
