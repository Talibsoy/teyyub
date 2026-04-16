// lib/match-engine.ts
// NatoureFly Personalization Engine — Match Scoring Algorithm

import type { UserProfileScores, Archetype } from "./quiz-processor";
import { getArchetypeConfig } from "./archetype-filters";

export interface HotelInput {
  id: string;
  name: string;
  stars: number;           // 1-5
  price: number;           // AZN
  meal_plan?: string;      // "all", "breakfast", "none"
  beach_distance?: number; // metre
  transfer_minutes?: number;
  is_chain?: boolean;
  amenities?: string[];
}

export interface FlightInput {
  id: string;
  total_amount: number;    // AZN
  stop_count: number;      // 0 = birbaşa
  total_duration: number;  // dəqiqə
  cabin_class: string;
  carrier_name?: string;
}

export interface ScoredResult {
  entity_id: string;
  entity_type: "hotel" | "flight";
  match_score: number;     // 0-100
  score_breakdown: {
    price_score: number;
    comfort_score: number;
    duration_score: number;
    profile_match: number;
  };
  explanation: string[];   // "niyə bu sənə uyğundur" çiplər
}

// Meal plan-a görə comfort skoru
const MEAL_SCORES: Record<string, number> = {
  ultra: 1.0,
  all: 0.9,
  full: 0.8,
  half: 0.6,
  breakfast: 0.5,
  none: 0.2,
};

// ─── Hotel Scoring ─────────────────────────────────────────────────────────

export function scoreHotel(
  hotel: HotelInput,
  profile: UserProfileScores,
  avgBookingValue = 1500
): ScoredResult {
  const config = getArchetypeConfig(profile.archetype as Archetype);
  const weights = config.scoring_weights;

  // 1. Price score (aşağı qiymət = yüksək skor budget_optimizer üçün)
  const priceNorm = avgBookingValue > 0
    ? Math.max(0, 1 - hotel.price / (avgBookingValue * 2))
    : 0.5;

  // 2. Comfort score
  const starScore = hotel.stars / 5;
  const mealScore = MEAL_SCORES[hotel.meal_plan ?? "none"] ?? 0.2;
  const amenityScore = calcAmenityMatch(hotel.amenities ?? [], profile);
  const comfortScore = starScore * 0.45 + mealScore * 0.35 + amenityScore * 0.2;

  // 3. Location / transfer score
  const transferMinutes = hotel.transfer_minutes ?? 30;
  const locationScore = Math.max(0, 1 - transferMinutes / 90);

  // 4. Profile match
  const profileMatch = calcHotelProfileMatch(hotel, profile);

  // Weighted total
  const raw =
    priceNorm    * weights.price_weight   +
    comfortScore * weights.comfort_weight +
    locationScore * weights.duration_weight +
    profileMatch * weights.match_weight;

  const match_score = Math.min(100, Math.max(0, Math.round(raw * 100)));

  return {
    entity_id: hotel.id,
    entity_type: "hotel",
    match_score,
    score_breakdown: {
      price_score: priceNorm,
      comfort_score: comfortScore,
      duration_score: locationScore,
      profile_match: profileMatch,
    },
    explanation: generateHotelExplanation(hotel, profile, {
      priceNorm, comfortScore, locationScore, profileMatch,
    }),
  };
}

// ─── Flight Scoring ────────────────────────────────────────────────────────

export function scoreFlight(
  flight: FlightInput,
  profile: UserProfileScores,
  avgFlightPrice = 800
): ScoredResult {
  const config = getArchetypeConfig(profile.archetype as Archetype);
  const weights = config.scoring_weights;

  // 1. Price score
  const priceNorm = Math.max(0, 1 - flight.total_amount / (avgFlightPrice * 2));

  // 2. Comfort score (cabin class)
  const cabinScores: Record<string, number> = { first: 1, business: 0.85, premium_economy: 0.65, economy: 0.4 };
  const comfortScore = cabinScores[flight.cabin_class] ?? 0.4;

  // 3. Duration score (az dayanacaq = yüksək skor hassle_free üçün)
  const stopPenalty = flight.stop_count * 0.25;
  const durationScore = Math.max(0, 1 - stopPenalty - flight.total_duration / 1200);

  // 4. Profile match
  const profileMatch = calcFlightProfileMatch(flight, profile);

  const raw =
    priceNorm    * weights.price_weight   +
    comfortScore * weights.comfort_weight +
    durationScore * weights.duration_weight +
    profileMatch * weights.match_weight;

  const match_score = Math.min(100, Math.max(0, Math.round(raw * 100)));

  return {
    entity_id: flight.id,
    entity_type: "flight",
    match_score,
    score_breakdown: {
      price_score: priceNorm,
      comfort_score: comfortScore,
      duration_score: durationScore,
      profile_match: profileMatch,
    },
    explanation: generateFlightExplanation(flight, profile, {
      priceNorm, comfortScore, durationScore, profileMatch,
    }),
  };
}

// ─── Profile Match Helpers ─────────────────────────────────────────────────

function calcHotelProfileMatch(hotel: HotelInput, profile: UserProfileScores): number {
  let score = 0.5;

  // Comfort priority
  if (profile.pref_comfort_priority > 0.6 && hotel.stars >= 4) score += 0.15;
  if (profile.pref_comfort_priority > 0.7 && hotel.stars >= 5) score += 0.1;

  // Budget sensitivity
  if (profile.pref_budget_sensitivity > 0.65 && hotel.stars <= 3) score += 0.1;
  if (profile.pref_budget_sensitivity < 0.35 && hotel.stars >= 5) score += 0.1;

  // Hassle-free — yaxın transfer
  if (profile.pref_hassle_free > 0.65 && (hotel.transfer_minutes ?? 60) < 25) score += 0.1;

  // Silent explorer — butik / zəncir olmayan
  if (profile.pref_cultural_depth > 0.65 && !hotel.is_chain) score += 0.1;

  // All-inclusive + deep relaxer
  if (profile.pref_comfort_priority > 0.65 && profile.pref_hassle_free > 0.5) {
    if (hotel.meal_plan === "all" || hotel.meal_plan === "ultra") score += 0.1;
  }

  // Çimərliyə yaxınlıq
  if (profile.pref_comfort_priority > 0.5 && (hotel.beach_distance ?? 9999) < 300) score += 0.05;

  return Math.min(1, score);
}

function calcFlightProfileMatch(flight: FlightInput, profile: UserProfileScores): number {
  let score = 0.5;

  if (profile.pref_hassle_free > 0.65 && flight.stop_count === 0) score += 0.2;
  if (profile.pref_hassle_free > 0.65 && flight.stop_count >= 2) score -= 0.2;
  if (profile.pref_comfort_priority > 0.7 && flight.cabin_class === "business") score += 0.15;
  if (profile.pref_budget_sensitivity > 0.65 && flight.cabin_class === "economy") score += 0.1;

  return Math.max(0, Math.min(1, score));
}

function calcAmenityMatch(amenities: string[], profile: UserProfileScores): number {
  let score = 0;
  const total = 5;
  if (profile.pref_comfort_priority > 0.6 && amenities.includes("spa")) score++;
  if (profile.pref_comfort_priority > 0.6 && amenities.includes("pool")) score++;
  if (profile.pref_food_importance > 0.6 && amenities.includes("restaurant")) score++;
  if (profile.pref_family_friendly > 0.6 && amenities.includes("kids_club")) score++;
  if (profile.pref_hassle_free > 0.6 && amenities.includes("airport_shuttle")) score++;
  return score / total;
}

// ─── Explanation Generators ────────────────────────────────────────────────

function generateHotelExplanation(
  hotel: HotelInput,
  profile: UserProfileScores,
  scores: { priceNorm: number; comfortScore: number; locationScore: number; profileMatch: number }
): string[] {
  const reasons: string[] = [];

  if (scores.comfortScore > 0.75 && profile.pref_comfort_priority > 0.55)
    reasons.push(`${hotel.stars}★ — Yüksək rahatlıq`);

  if (scores.priceNorm > 0.65 && profile.pref_budget_sensitivity > 0.5)
    reasons.push("Büdcənə uyğun qiymət");

  if ((hotel.beach_distance ?? 9999) < 300)
    reasons.push(`Çimərliyə ${hotel.beach_distance}m`);

  if ((hotel.transfer_minutes ?? 60) < 20 && profile.pref_hassle_free > 0.55)
    reasons.push(`Hava limanından ${hotel.transfer_minutes}dq`);

  if (!hotel.is_chain && profile.pref_cultural_depth > 0.55)
    reasons.push("Müstəqil otel — yerli xarakter");

  if ((hotel.meal_plan === "all" || hotel.meal_plan === "ultra") && profile.pref_hassle_free > 0.5)
    reasons.push("Hər şey daxil");

  return reasons.slice(0, 3);
}

function generateFlightExplanation(
  flight: FlightInput,
  profile: UserProfileScores,
  scores: { priceNorm: number; comfortScore: number; durationScore: number; profileMatch: number }
): string[] {
  const reasons: string[] = [];

  if (flight.stop_count === 0 && profile.pref_hassle_free > 0.5)
    reasons.push("Birbaşa uçuş");

  if (scores.priceNorm > 0.7 && profile.pref_budget_sensitivity > 0.5)
    reasons.push("Ən sərfəli qiymət");

  if (flight.cabin_class === "business" && profile.pref_comfort_priority > 0.6)
    reasons.push("Biznes klas");

  if (scores.durationScore > 0.75)
    reasons.push(`${Math.round(flight.total_duration / 60)}s ${flight.total_duration % 60}dq uçuş`);

  return reasons.slice(0, 3);
}

// ─── Batch Scorer (turlar səhifəsi üçün) ──────────────────────────────────

export function sortAndFilterByProfile<T extends { id: string; price: number; stars?: number }>(
  items: T[],
  profile: UserProfileScores,
  options?: { minScore?: number; topN?: number }
): (T & { _matchScore: number; _explanation: string[] })[] {
  const minScore = options?.minScore ?? 30;
  const topN = options?.topN ?? 10;

  const scored = items.map((item) => {
    const hotelInput: HotelInput = {
      id: item.id,
      name: (item as Record<string, unknown>).name as string ?? "",
      stars: (item as Record<string, unknown>).stars as number ?? 3,
      price: item.price,
      meal_plan: (item as Record<string, unknown>).meal_plan as string ?? "none",
      beach_distance: (item as Record<string, unknown>).beach_distance as number,
      transfer_minutes: (item as Record<string, unknown>).transfer_minutes as number,
      is_chain: (item as Record<string, unknown>).is_chain as boolean,
      amenities: (item as Record<string, unknown>).amenities as string[] ?? [],
    };
    const result = scoreHotel(hotelInput, profile);
    return { ...item, _matchScore: result.match_score, _explanation: result.explanation };
  });

  return scored
    .filter((i) => i._matchScore >= minScore)
    .sort((a, b) => b._matchScore - a._matchScore)
    .slice(0, topN);
}
