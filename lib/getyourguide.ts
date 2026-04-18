// GetYourGuide Partner API
// Credentials needed: GETYOURGUIDE_API_KEY (Vercel env)
// Docs: https://partner.getyourguide.com/api

const GYG_BASE = "https://api.getyourguide.com/1";
const AZN_RATE = 1.70;

function getKey(): string {
  const key = process.env.GETYOURGUIDE_API_KEY;
  if (!key) throw new Error("GETYOURGUIDE_API_KEY env var lazımdır");
  return key;
}

export interface ActivityOffer {
  activity_id:  number;
  title:        string;
  description:  string;
  price_azn:    number;
  price_usd:    number;
  currency:     string;
  duration:     string;
  rating:       number;
  review_count: number;
  category:     string;
  image_url:    string;
  booking_url:  string;
}

interface GYGActivity {
  activity_id:     number;
  title:           string;
  abstract:        string;
  price:           { amount: number; currency: string };
  duration:        { min_duration: number; unit: string };
  rating:          number;
  number_of_reviews: number;
  categories:      Array<{ name: string }>;
  pictures:        Array<{ url: string }>;
  url:             string;
}

function formatDuration(min: number, unit: string): string {
  if (unit === "HOUR")   return `${min} saat`;
  if (unit === "MINUTE") return `${min} dəqiqə`;
  if (unit === "DAY")    return `${min} gün`;
  return `${min} ${unit}`;
}

function toAzn(amount: number, currency: string): number {
  const rates: Record<string, number> = {
    USD: 1.70, EUR: 1.87, GBP: 2.16, AED: 0.463,
  };
  const rate = rates[currency] ?? AZN_RATE;
  return Math.round(amount * rate);
}

export async function searchActivities(
  destination: string,
  date: string,
  guests: number = 2,
  limit: number = 8,
): Promise<ActivityOffer[]> {
  const params = new URLSearchParams({
    q:        destination,
    date,
    adults:   String(guests),
    limit:    String(limit),
    currency: "USD",
    lang:     "az",
  });

  const res = await fetch(`${GYG_BASE}/activities?${params}`, {
    headers: {
      "X-API-Key":      getKey(),
      "Accept":         "application/json",
      "Accept-Language": "az",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GetYourGuide API xətası: ${res.status} — ${err.slice(0, 200)}`);
  }

  const data = await res.json() as { data: { activities: GYGActivity[] } };
  const activities = data?.data?.activities ?? [];

  return activities.map((a): ActivityOffer => ({
    activity_id:  a.activity_id,
    title:        a.title,
    description:  a.abstract ?? "",
    price_usd:    a.price?.amount ?? 0,
    price_azn:    toAzn(a.price?.amount ?? 0, a.price?.currency ?? "USD"),
    currency:     a.price?.currency ?? "USD",
    duration:     formatDuration(a.duration?.min_duration ?? 0, a.duration?.unit ?? "HOUR"),
    rating:       a.rating ?? 0,
    review_count: a.number_of_reviews ?? 0,
    category:     a.categories?.[0]?.name ?? "Fəaliyyət",
    image_url:    a.pictures?.[0]?.url ?? "",
    booking_url:  a.url ?? "",
  }));
}

export async function getActivityById(activityId: number): Promise<ActivityOffer | null> {
  const res = await fetch(`${GYG_BASE}/activities/${activityId}`, {
    headers: { "X-API-Key": getKey(), "Accept": "application/json" },
    next: { revalidate: 7200 },
  });

  if (!res.ok) return null;

  const data = await res.json() as { data: { activity: GYGActivity } };
  const a = data?.data?.activity;
  if (!a) return null;

  return {
    activity_id:  a.activity_id,
    title:        a.title,
    description:  a.abstract ?? "",
    price_usd:    a.price?.amount ?? 0,
    price_azn:    toAzn(a.price?.amount ?? 0, a.price?.currency ?? "USD"),
    currency:     a.price?.currency ?? "USD",
    duration:     formatDuration(a.duration?.min_duration ?? 0, a.duration?.unit ?? "HOUR"),
    rating:       a.rating ?? 0,
    review_count: a.number_of_reviews ?? 0,
    category:     a.categories?.[0]?.name ?? "Fəaliyyət",
    image_url:    a.pictures?.[0]?.url ?? "",
    booking_url:  a.url ?? "",
  };
}
