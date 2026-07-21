// lib/grounded-planner.ts
// Faza 2 — Grounded trip planner.
//
// Replaces the "ask the LLM to invent an itinerary" model. Every option returned
// here comes from a REAL provider response (Duffel / RateHawk) and carries the
// provider's own id and price. When a provider fails or has no inventory, this
// module reports an honest `available: false` with a reason — it NEVER invents
// flights, hotels, prices or availability (Zero-Hallucination core principle).
//
// Output feeds straight into the confirmation-gate machine
// (lib/booking/confirmation-gate.ts) via the LOAD_OPTIONS action.

import { searchFlights, type FlightOffer } from "./duffel";
import {
  searchHotels,
  TRACKED_DESTINATIONS,
  type HotelOffer,
  type SearchGuest,
} from "./ratehawk";
import { searchViatorProducts, isViatorConfigured, type ViatorProduct } from "./viator";
import { withRetry, isTransientHttpError } from "./resilience";
import type { GateOption, ServiceType } from "./booking/confirmation-gate";

export interface GroundedPlanInput {
  origin?: string;        // IATA, e.g. "AUS"
  destination: string;    // IATA or city name, e.g. "ANC" / "Los Angeles"
  departDate: string;     // YYYY-MM-DD
  returnDate?: string;    // YYYY-MM-DD (round trip)
  checkin?: string;       // defaults to departDate
  checkout?: string;      // defaults to returnDate
  travelers?: number;     // defaults to 2
}

export interface ServiceOptions {
  service: ServiceType;
  options: GateOption[];
  available: boolean;
  /** Honest, user-facing reason when nothing is bookable. Never a fabricated result. */
  note?: string;
}

export interface GroundedPlan {
  input: GroundedPlanInput;
  services: ServiceOptions[];
  generatedAt: string;
}

const DEFAULT_TRAVELERS = 2;

function unavailable(service: ServiceType, note: string): ServiceOptions {
  return { service, options: [], available: false, note };
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Flights (Duffel) ────────────────────────────────────────────────────────

export function flightOfferToGateOption(offer: FlightOffer): GateOption {
  const stopsLabel = offer.stops === 0
    ? "Nonstop"
    : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`;
  const duration = formatDuration(offer.duration_minutes);

  return {
    // REAL Duffel offer id — required later by createOrder()
    id: offer.offer_id,
    label: [offer.airline, stopsLabel, duration].filter(Boolean).join(" · "),
    // REAL provider price (already includes commission). Total for ALL passengers.
    priceUsd: offer.price_usd,
    meta: {
      airline: offer.airline,
      stops: offer.stops,
      durationMinutes: offer.duration_minutes,
      departureTime: offer.departure_time,
      arrivalTime: offer.arrival_time,
      isRoundTrip: offer.is_round_trip,
      cabinBaggage: offer.cabin_baggage,
      checkedBaggage: offer.checked_baggage,
      passengerIds: offer.passenger_ids,
    },
  };
}

export async function fetchFlightOptions(input: GroundedPlanInput): Promise<ServiceOptions> {
  if (!input.origin) {
    return unavailable("flight", "Add your departure city to see live flight options.");
  }

  try {
    // Search is idempotent, so a transient provider blip is safe to retry.
    const offers = await withRetry(
      () => searchFlights({
        origin: input.origin as string,
        destination: input.destination,
        date: input.departDate,
        return_date: input.returnDate,
        passengers: input.travelers || DEFAULT_TRAVELERS,
      }),
      { attempts: 2, isRetryable: isTransientHttpError },
    );

    if (!offers.length) {
      return unavailable(
        "flight",
        `No flights found from ${input.origin} to ${input.destination} on ${input.departDate}. Try nearby dates.`,
      );
    }

    return {
      service: "flight",
      options: offers.map(flightOfferToGateOption),
      available: true,
    };
  } catch (error: unknown) {
    console.warn("[grounded-planner] flight search failed:", error);
    return unavailable("flight", "Flight search is temporarily unavailable. Please try again.");
  }
}

// ─── Hotels (RateHawk) ───────────────────────────────────────────────────────

export function hotelOfferToGateOption(offer: HotelOffer): GateOption {
  return {
    // book_hash is what prebook/booking actually needs; fall back to the stable key.
    id: offer.book_hash || offer.hotel_key,
    label: [offer.hotel_name, offer.room_type, offer.meal].filter(Boolean).join(" · "),
    priceUsd: offer.price_usd, // REAL provider price for the whole stay
    meta: {
      hotelId: offer.hotel_id,
      hotelStringId: offer.hotel_string_id,
      hotelName: offer.hotel_name,
      stars: offer.stars,
      roomType: offer.room_type,
      meal: offer.meal,
      address: offer.address,
      checkin: offer.checkin,
      checkout: offer.checkout,
      photos: offer.photos,
      bookHash: offer.book_hash,
    },
  };
}

export async function fetchHotelOptions(input: GroundedPlanInput): Promise<ServiceOptions> {
  const checkin = input.checkin || input.departDate;
  const checkout = input.checkout || input.returnDate;

  if (!checkout) {
    return unavailable("hotel", "Add your return/check-out date to see live hotel options.");
  }

  // RateHawk is currently limited to the tracked destination groups (sandbox scope).
  const query = input.destination.toLowerCase().trim();
  const destGroup = TRACKED_DESTINATIONS.find((d) => {
    const name = d.name.toLowerCase();
    return name.includes(query) || query.includes(name);
  });

  if (!destGroup) {
    const supported = TRACKED_DESTINATIONS.map((d) => d.name).join(", ");
    return unavailable(
      "hotel",
      `Live hotel inventory is not available for "${input.destination}" yet. Currently supported: ${supported}.`,
    );
  }

  try {
    const guests: SearchGuest[] = [
      { adults: input.travelers || DEFAULT_TRAVELERS, children: [] },
    ];
    const offers = await withRetry(
      () => searchHotels(destGroup, checkin, checkout, guests),
      { attempts: 2, isRetryable: isTransientHttpError },
    );

    if (!offers.length) {
      return unavailable(
        "hotel",
        `No rooms available in ${destGroup.name} for ${checkin} – ${checkout}.`,
      );
    }

    return {
      service: "hotel",
      options: offers.map(hotelOfferToGateOption),
      available: true,
    };
  } catch (error: unknown) {
    console.warn("[grounded-planner] hotel search failed:", error);
    return unavailable("hotel", "Hotel search is temporarily unavailable. Please try again.");
  }
}

// ─── Tours ───────────────────────────────────────────────────────────────────

export function viatorProductToGateOption(product: ViatorProduct): GateOption {
  const parts = [product.title];
  if (product.durationMinutes) parts.push(formatDuration(product.durationMinutes));
  if (product.rating) parts.push(`${product.rating.toFixed(1)}★`);

  return {
    id: product.productCode, // REAL Viator product code — needed to book
    label: parts.join(" · "),
    priceUsd: product.priceUsd, // REAL "from" price returned by Viator
    meta: {
      productCode: product.productCode,
      description: product.description,
      durationMinutes: product.durationMinutes,
      rating: product.rating,
      reviewCount: product.reviewCount,
      photoUrl: product.photoUrl,
      productUrl: product.productUrl,
    },
  };
}

export async function fetchTourOptions(input: GroundedPlanInput): Promise<ServiceOptions> {
  // Until the Viator partner key is issued, say so honestly rather than
  // surfacing unbookable or invented tours.
  if (!isViatorConfigured()) {
    return unavailable(
      "tour",
      "Guided experiences are not bookable online yet — our team can arrange them for you.",
    );
  }

  try {
    const products = await withRetry(
      () => searchViatorProducts({ destination: input.destination }),
      { attempts: 2, isRetryable: isTransientHttpError },
    );

    if (!products.length) {
      return unavailable("tour", `No guided experiences found in ${input.destination}.`);
    }

    return {
      service: "tour",
      options: products.map(viatorProductToGateOption),
      available: true,
    };
  } catch (error: unknown) {
    console.warn("[grounded-planner] tour search failed:", error);
    return unavailable("tour", "Experience search is temporarily unavailable. Please try again.");
  }
}

// ─── Orchestration ───────────────────────────────────────────────────────────

/**
 * Gathers real, bookable options for every service in parallel.
 * A failure in one provider never blocks the others, and never produces fake data.
 */
export async function buildGroundedPlan(input: GroundedPlanInput): Promise<GroundedPlan> {
  const [flight, hotel, tour] = await Promise.all([
    fetchFlightOptions(input),
    fetchHotelOptions(input),
    fetchTourOptions(input),
  ]);

  return {
    input,
    services: [flight, hotel, tour],
    generatedAt: new Date().toISOString(),
  };
}

/** Convenience: pull one service's options out of a plan. */
export function getServiceOptions(
  plan: GroundedPlan,
  service: ServiceType,
): ServiceOptions | undefined {
  return plan.services.find((s) => s.service === service);
}

/** Cheapest real total across the services that actually returned inventory. */
export function getCheapestTotalUsd(plan: GroundedPlan): number {
  return plan.services.reduce((sum, s) => {
    if (!s.available || s.options.length === 0) return sum;
    const cheapest = s.options.reduce(
      (min, o) => (o.priceUsd < min ? o.priceUsd : min),
      s.options[0].priceUsd,
    );
    return sum + cheapest;
  }, 0);
}