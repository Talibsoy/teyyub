// lib/viator.ts
// Faza 5 — Viator (Tripadvisor) partner API client. Replaces lib/getyourguide.ts
// as the structured tour/experience provider for the US pivot.
//
// ⚠ VERIFY BEFORE GO-LIVE: the request body and response field mapping below follow
// the Viator Partner API v2 shape but have NOT been run against the live API yet
// (partner key pending). Parsing is deliberately defensive — anything unexpected
// degrades to "no options" rather than surfacing wrong data (Zero-Hallucination).

const VIATOR_BASE = "https://api.viator.com/partner";
const REQUEST_TIMEOUT_MS = 12_000;
const DEFAULT_RESULT_COUNT = 20;

export interface ViatorProduct {
  productCode: string;   // REAL Viator product code — required for booking
  title: string;
  description?: string;
  priceUsd: number;      // REAL "from" price returned by Viator
  durationMinutes?: number;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  productUrl?: string;
}

export function isViatorConfigured(): boolean {
  return Boolean(process.env.VIATOR_API_KEY);
}

function headers(): Record<string, string> {
  return {
    "exp-api-key": process.env.VIATOR_API_KEY ?? "",
    "Accept": "application/json;version=2.0",
    "Accept-Language": "en-US",
    "Content-Type": "application/json",
  };
}

/** Narrow an unknown value to a record so we can probe fields without `any`. */
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

/**
 * Maps one raw Viator search result into our own shape.
 * Returns null when the essentials (code + usable price) are missing — we never
 * invent a price to fill a gap.
 */
export function mapViatorProduct(raw: unknown): ViatorProduct | null {
  const p = asRecord(raw);
  if (!p) return null;

  const productCode = readString(p.productCode);
  const title = readString(p.title);
  if (!productCode || !title) return null;

  // pricing.summary.fromPrice — the "from" price in the requested currency
  const pricing = asRecord(p.pricing);
  const summary = pricing ? asRecord(pricing.summary) : null;
  const priceUsd = summary ? readNumber(summary.fromPrice) : undefined;
  if (priceUsd === undefined || priceUsd <= 0) return null;

  const reviews = asRecord(p.reviews);
  const images = Array.isArray(p.images) ? p.images : [];
  const firstImage = asRecord(images[0]);
  const variants = firstImage && Array.isArray(firstImage.variants) ? firstImage.variants : [];
  const lastVariant = asRecord(variants[variants.length - 1]);

  const duration = asRecord(p.duration);

  return {
    productCode,
    title,
    description: readString(p.description),
    priceUsd,
    durationMinutes: duration ? readNumber(duration.fixedDurationInMinutes) : undefined,
    rating: reviews ? readNumber(reviews.combinedAverageRating) : undefined,
    reviewCount: reviews ? readNumber(reviews.totalReviews) : undefined,
    photoUrl: lastVariant ? readString(lastVariant.url) : undefined,
    productUrl: readString(p.productUrl),
  };
}

/**
 * Free-text product search. Using free text avoids a separate destination-id
 * lookup, so a city name from the planner works directly.
 */
export async function searchViatorProducts(params: {
  destination: string;
  count?: number;
}): Promise<ViatorProduct[]> {
  if (!isViatorConfigured()) return [];

  const body = {
    searchTerm: params.destination,
    currency: "USD",
    searchTypes: [
      {
        searchType: "PRODUCTS",
        pagination: { start: 1, count: params.count ?? DEFAULT_RESULT_COUNT },
      },
    ],
  };

  const res = await fetch(`${VIATOR_BASE}/search/freetext`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Viator search failed (${res.status})`);
  }

  const data = asRecord(await res.json());
  const products = data ? asRecord(data.products) : null;
  const results = products && Array.isArray(products.results) ? products.results : [];

  return results
    .map(mapViatorProduct)
    .filter((p): p is ViatorProduct => p !== null);
}
