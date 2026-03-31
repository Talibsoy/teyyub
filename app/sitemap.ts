import { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.natourefly.com";

  // Static pages
  const static_pages = [
    { url: base, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${base}/turlar`, priority: 0.9, changeFrequency: "daily" as const },
    { url: `${base}/melumatlar`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${base}/haqqimizda`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${base}/elaqe`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${base}/privacy-policy`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${base}/terms-of-service`, priority: 0.3, changeFrequency: "yearly" as const },
  ];

  // Dynamic tour pages (if any)
  let tour_pages: MetadataRoute.Sitemap = [];
  try {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("tours")
      .select("id, updated_at")
      .eq("is_active", true);
    if (data) {
      tour_pages = data.map(t => ({
        url: `${base}/turlar/${t.id}`,
        lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
        priority: 0.8,
        changeFrequency: "weekly" as const,
      }));
    }
  } catch {
    // sitemap hələ də işləyəcək
  }

  // Travel posts
  let post_pages: MetadataRoute.Sitemap = [];
  try {
    const db2 = getSupabaseAdmin();
    const { data: posts } = await db2
      .from("travel_posts")
      .select("id, created_at")
      .order("created_at", { ascending: false });
    if (posts) {
      post_pages = posts.map(p => ({
        url: `${base}/melumatlar/${p.id}`,
        lastModified: new Date(p.created_at),
        priority: 0.7,
        changeFrequency: "monthly" as const,
      }));
    }
  } catch {}

  return [
    ...static_pages.map(p => ({ ...p, lastModified: new Date() })),
    ...tour_pages,
    ...post_pages,
  ];
}
