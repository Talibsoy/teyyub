// lib/experience-packages.ts
// Faza 3 — Experience Packages data layer.
//
// An experience package is the primary product: authored marketing + itinerary
// content for an outdoor trip. It never carries live bookable prices — those
// always come from the grounded planner at booking time. `base_price_usd` is a
// "from" figure for marketing only and is labelled as such in the UI.

import { getSupabaseAdmin } from "./supabase";

export interface ItineraryDayEntry {
  day: number;
  title: string;
  description?: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface ExperiencePackage {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;

  destination: string;
  destination_query: string | null;
  destination_iata: string | null;

  hero_image_url: string | null;
  gallery_urls: string[];
  summary: string | null;
  description: string | null;
  highlights: string[];
  included: string[];
  excluded: string[];

  duration_days: number;
  difficulty: string | null;
  max_group_size: number | null;
  best_season: string | null;
  recommended_months: string[];

  base_price_usd: number | null;

  itinerary: ItineraryDayEntry[];
  faq: FaqEntry[];

  seo_title: string | null;
  seo_description: string | null;

  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const TABLE = "experience_packages";

/** All published packages, ordered for listing pages. */
export async function getActiveExperiences(): Promise<ExperiencePackage[]> {
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[experience-packages] list failed:", error.message);
    return [];
  }
  return (data ?? []) as ExperiencePackage[];
}

/** A single published package by slug — the social-ad landing target. */
export async function getExperienceBySlug(slug: string): Promise<ExperiencePackage | null> {
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.warn("[experience-packages] fetch failed:", error.message);
    return null;
  }
  return (data as ExperiencePackage | null) ?? null;
}

/**
 * Columns an admin may write. Anything else in a request body is ignored, so a
 * client cannot inject arbitrary columns (id, created_at, …) through the API.
 */
export const WRITABLE_FIELDS = [
  "slug", "title", "subtitle",
  "destination", "destination_query", "destination_iata",
  "hero_image_url", "gallery_urls", "summary", "description",
  "highlights", "included", "excluded",
  "duration_days", "difficulty", "max_group_size", "best_season", "recommended_months",
  "base_price_usd", "itinerary", "faq",
  "seo_title", "seo_description",
  "is_active", "sort_order",
] as const;

export function pickWritable(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of WRITABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

/**
 * Builds the query string that carries a package's context into the planner,
 * so the booking wizard opens pre-filled from a landing page (Flow 1 → Flow 2).
 */
export function buildPlannerLink(pkg: ExperiencePackage): string {
  const params = new URLSearchParams();
  params.set("destination", pkg.destination_query || pkg.destination);
  if (pkg.destination_iata) params.set("iata", pkg.destination_iata);
  params.set("days", String(pkg.duration_days));
  params.set("experience", pkg.slug);
  return `/plan?${params.toString()}`;
}