// lib/markup.ts
// Natoure Pricing & Markup Middleware Engine

export const SERVICE_FEE_PERCENTAGE = 0.10; // 10% Service Fee

/**
 * Applies the 10% service fee markup to a raw provider price and rounds it.
 * @param rawPrice The B2B provider net price (USD/AZN).
 * @returns The displayed retail price rounded to the nearest integer.
 */
export function applyNatoureMarkup(rawPrice: number): number {
  if (isNaN(rawPrice) || rawPrice <= 0) return 0;
  const finalPrice = rawPrice * (1 + SERVICE_FEE_PERCENTAGE);
  return Math.round(finalPrice);
}

/**
 * Reconstructs the approximate raw B2B provider price from the retail price.
 * @param displayedPrice The price shown to the customer (including markup).
 * @returns The net price rounded to two decimal places.
 */
export function removeNatoureMarkup(displayedPrice: number): number {
  if (isNaN(displayedPrice) || displayedPrice <= 0) return 0;
  const rawPrice = displayedPrice / (1 + SERVICE_FEE_PERCENTAGE);
  return Math.round(rawPrice * 100) / 100;
}

/**
 * Calculates the exact service fee amount (Natoure profit margin) of a retail price.
 * @param rawPrice The B2B provider net price.
 * @returns The profit margin amount rounded to two decimal places.
 */
export function getServiceFeeAmount(rawPrice: number): number {
  if (isNaN(rawPrice) || rawPrice <= 0) return 0;
  const fee = rawPrice * SERVICE_FEE_PERCENTAGE;
  return Math.round(fee * 100) / 100;
}

/**
 * Modifies flight or hotel results from API responses to apply markups dynamically.
 * @param apiOffers Array of search offers from B2B provider API (e.g. RateHawk/Duffel).
 * @param priceField Key of the price field inside the offer object.
 * @returns Array with markup applied to display_price.
 */
export function processApiOffers<T extends Record<string, any>>(
  apiOffers: T[],
  priceField: keyof T = "price"
): (T & { displayed_price: number })[] {
  return apiOffers.map(offer => {
    const rawVal = parseFloat(offer[priceField] as any) || 0;
    return {
      ...offer,
      displayed_price: applyNatoureMarkup(rawVal)
    };
  });
}
