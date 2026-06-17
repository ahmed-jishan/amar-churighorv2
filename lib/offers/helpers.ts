/**
 * Offers utility helpers for the professional Offers system.
 *
 * All discount calculations are dynamic — based on product pricing data.
 * No separate offer records needed. Single source of truth = product.
 */

export interface OfferInfo {
  /** Whether the product is an active offer (salePrice exists & < regularPrice) */
  isOffer: boolean;
  /** Discount percentage (integer), e.g. 21 for "21% OFF" */
  discountPercentage: number;
  /** Absolute savings amount */
  savings: number;
  /** Effective (discounted) price */
  effectivePrice: number;
}

/**
 * Compute offer info from product price and discountPrice.
 *
 * Logic:
 * - If discountPrice exists AND discountPrice < price → it's an offer
 * - Discount percentage = Math.round((1 - discountPrice/price) * 100)
 * - Savings = price - discountPrice
 */
export function computeOfferInfo(price: number, discountPrice?: number | null): OfferInfo {
  const hasOffer = discountPrice != null && discountPrice > 0 && discountPrice < price;

  if (!hasOffer) {
    return {
      isOffer: false,
      discountPercentage: 0,
      savings: 0,
      effectivePrice: price,
    };
  }

  const savings = price - discountPrice!;
  const discountPercentage = Math.round((savings / price) * 100);

  return {
    isOffer: true,
    discountPercentage,
    savings,
    effectivePrice: discountPrice!,
  };
}

/**
 * Check if a product is eligible as an offer product.
 * A product becomes an offer when: discountPrice exists && discountPrice < price
 */
export function isOfferProduct(price: number, discountPrice?: number | null): boolean {
  return discountPrice != null && discountPrice > 0 && discountPrice < price;
}