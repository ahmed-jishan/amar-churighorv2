// ──────────────────────────────────────────────────────────────────
// Campaign & Promotions Eligibility Engine
// Handles all campaign matching, eligibility, and discount logic.
// Single source of truth for campaign offer validation.
// ──────────────────────────────────────────────────────────────────

import { Campaign, CampaignCardData, CampaignEligibility, CampaignType, DiscountType } from './campaignTypes';
import { isOfferProduct } from './helpers';
import type { Product } from '@/types';

/**
 * Convert a full Campaign to a lightweight CampaignCardData for display.
 */
export function toCampaignCard(c: Campaign): CampaignCardData {
  return {
    id: c.id,
    type: c.type,
    title: c.title,
    description: c.description,
    bannerImage: c.bannerImage,
    badgeText: c.badgeText,
    discountType: c.discountType,
    discountValue: c.discountValue,
    endDate: c.endDate,
    priority: c.priority,
    comboLabel: c.comboLabel,
    themeColor: c.themeColor,
    isActive: c.isActive,
    isFirstOrderOnly: c.isFirstOrderOnly,
    minQuantity: c.minQuantity,
    minCompletedOrders: c.minCompletedOrders,
  };
}

/**
 * Get the human-readable discount label for a campaign.
 * e.g. "30% OFF", "৳200 OFF", "Buy 3 Get 10% OFF"
 */
export function getCampaignDiscountLabel(c: CampaignCardData | Campaign): string {
  if (c.type === 'combo' && c.comboLabel) {
    return c.comboLabel;
  }
  if (c.discountType === 'percentage') {
    return `${c.discountValue}% OFF`;
  }
  return `৳${c.discountValue} OFF`;
}

/**
 * Get the full description string for a campaign.
 */
export function getCampaignDescription(c: CampaignCardData | Campaign): string {
  const label = getCampaignDiscountLabel(c);
  switch (c.type) {
    case 'flash_sale':
      return `Flash Sale — ${label}`;
    case 'first_customer':
      return `First Order ${label}`;
    case 'combo':
      return c.comboLabel || `Combo Offer — ${label}`;
    case 'loyalty_reward':
      return `Loyalty Reward — ${label}`;
    case 'festival':
      return `Festival Offer — ${label}`;
    default:
      return c.description || `${label}`;
  }
}

/**
 * Check if a campaign has expired.
 */
export function isCampaignExpired(c: Campaign | CampaignCardData): boolean {
  if (!c.endDate) return false;
  return new Date(c.endDate).getTime() < Date.now();
}

/**
 * Check if a campaign is currently active (scheduled, not expired, isActive).
 */
export function isCampaignCurrentlyActive(c: Campaign | CampaignCardData): boolean {
  return c.isActive && !isCampaignExpired(c);
}

/**
 * Check if a campaign is usable for a given customer email and completed order count.
 */
export function isCampaignEligibleForCustomer(
  c: Campaign,
  customerEmail: string,
  completedOrderCount: number,
  firstOrderOnlyEligible: boolean,
): { eligible: boolean; reason?: string } {
  if (!c.isActive) return { eligible: false, reason: 'Campaign inactive' };
  if (isCampaignExpired(c)) return { eligible: false, reason: 'Campaign expired' };

  // First order only check
  if (c.isFirstOrderOnly && !firstOrderOnlyEligible) {
    return { eligible: false, reason: 'First order only campaign' };
  }

  // Loyalty: minimum completed orders
  if (c.type === 'loyalty_reward' && c.minCompletedOrders) {
    if (completedOrderCount < c.minCompletedOrders) {
      return { eligible: false, reason: `Need ${c.minCompletedOrders - completedOrderCount} more orders` };
    }
  }

  // Usage cap
  if (c.usageLimit && c.currentUsage >= c.usageLimit) {
    return { eligible: false, reason: 'Campaign usage limit reached' };
  }

  return { eligible: true };
}

/**
 * Check if a campaign applies to a given product.
 * Campaign level discounts (combo, loyalty) don't target specific products.
 */
export function campaignAppliesToProduct(c: Campaign, product: Product): boolean {
  // Combo campaigns apply to any product in cart
  if (c.type === 'combo') return true;
  // Loyalty applies to entire order
  if (c.type === 'loyalty_reward') return true;
  // First customer applies to entire order
  if (c.isFirstOrderOnly) return true;

  // Check target product IDs
  if (c.targetProductIds.length > 0) {
    return c.targetProductIds.includes(product.id);
  }

  // Check target categories
  if (c.targetCategoryNames.length > 0) {
    return c.targetCategoryNames.includes(product.category);
  }

  // No targets specified = applies to all eligible products
  return true;
}

/**
 * Check if a product's sale price qualifies as "discounted product" for the offers page.
 * Reuses the existing isOfferProduct helper.
 */
export function isProductOnSale(product: Product): boolean {
  return isOfferProduct(product.price, product.discountPrice);
}

/**
 * Compute the effective discount for a product given a campaign.
 */
export function computeCampaignDiscount(
  product: Product,
  campaign: Campaign,
  quantity: number = 1,
): { discountedPrice: number; discountAmount: number; label: string } {
  const originalPrice = product.discountPrice ?? product.price;
  let discountAmount = 0;
  let label = '';

  if (campaign.discountType === 'percentage') {
    discountAmount = Math.round(originalPrice * (campaign.discountValue / 100));
    label = `${campaign.discountValue}% OFF`;
  } else {
    discountAmount = campaign.discountValue;
    label = `৳${campaign.discountValue} OFF`;
  }

  return {
    discountedPrice: Math.max(0, originalPrice - discountAmount),
    discountAmount,
    label,
  };
}