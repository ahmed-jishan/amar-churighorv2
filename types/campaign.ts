// ──────────────────────────────────────────────────────────────────
// Campaign & Promotions System Types
// All campaign records stored in Firestore `campaigns` collection.
// Fully backward-compatible with existing product discount system.
// ──────────────────────────────────────────────────────────────────

export type CampaignType =
  | 'flash_sale'
  | 'first_order'
  | 'combo'
  | 'loyalty'
  | 'festival'
  | 'custom';

export type DiscountType = 'percentage' | 'fixed';

/** Full campaign document as stored in Firestore + computed fields */
export interface OfferCampaign {
  id: string;
  /** Public-facing title (e.g. "Summer Flash Sale") */
  title: string;
  /** Short description shown on card */
  description: string;
  /** Campaign type determines display and behavior */
  type: CampaignType;
  /** Discount definition */
  discountType: DiscountType;
  discountValue: number; // e.g. 50 for 50% or 500 for ৳500 off
  /** Optional campaign image URL (Cloudinary) */
  image?: string;
  /** Campaign scheduling */
  startDate: string;  // ISO string
  endDate?: string;   // ISO string — null = no expiry
  /** Active status */
  isActive: boolean;
  /** Priority (higher = shown first). Default 50 */
  priority: number;
  /** Target category names (empty = all eligible) */
  targetCategories: string[];
  /** Usage cap (null = unlimited) */
  usageLimit: number | null;
  /** Current usage count — incremented server-side on order */
  usageCount: number;
  /** Minimum cart value to apply discount */
  minOrderAmount: number | null;
  // ── Type-specific fields ──
  /** For combo: minimum items in cart */
  comboMinQty: number | null;
  /** For loyalty: minimum completed orders */
  loyaltyMinOrders: number | null;
  /** For loyalty: coupon code customers use at checkout */
  couponCode?: string;
  /** For loyalty: how many days the reward is valid after unlock */
  expiresAfterDays?: number;
  /** For loyalty: display label for the reward */
  rewardLabel?: string;
  /** For loyalty: max times each customer can apply this coupon (null = unlimited once) */
  perUserUsageLimit?: number;
  /** For first_order: only applicable to first-time customers */
  firstOrderOnly: boolean;
  // ── Metadata ──
  createdAt: string;
  updatedAt: string;
  createdBy: string; // admin uid

  // ── Computed fields (never stored in Firestore) ──
  isExpired?: boolean;
  isExhausted?: boolean;
  isAvailable?: boolean;
  discountLabel?: string;
  daysRemaining?: number;
}

/** Input for creating/updating campaigns (without id/computed fields/timestamps) */
export interface CampaignFormData {
  title: string;
  description: string;
  type: CampaignType;
  discountType: DiscountType;
  discountValue: number;
  image?: string;
  startDate: string;  // ISO string or local datetime string
  endDate?: string;
  isActive: boolean;
  priority: number;
  targetCategories: string[];
  usageLimit: number | null;
  minOrderAmount: number | null;
  comboMinQty: number | null;
  loyaltyMinOrders: number | null;
  /** For loyalty: coupon code */
  couponCode?: string;
  /** For loyalty: reward validity in days */
  expiresAfterDays?: number;
  /** For loyalty: display label */
  rewardLabel?: string;
  /** For loyalty: max times each customer can apply this coupon */
  perUserUsageLimit?: number;
  firstOrderOnly: boolean;
}

/** Minimal display version for card rendering */
export interface CampaignCardData {
  id: string;
  type: CampaignType;
  title: string;
  description: string;
  image?: string;
  discountType: DiscountType;
  discountValue: number;
  discountLabel?: string;
  endDate?: string;
  priority: number;
  isActive: boolean;
  isExpired?: boolean;
  isExhausted?: boolean;
  isAvailable?: boolean;
  daysRemaining?: number;
  usageLimit: number | null;
  usageCount: number;
  firstOrderOnly: boolean;
  comboMinQty: number | null;
  loyaltyMinOrders: number | null;
  couponCode?: string;
  expiresAfterDays?: number;
  rewardLabel?: string;
  perUserUsageLimit?: number;
  targetCategories: string[];
  minOrderAmount: number | null;
}

// ── Helpers ──────────────────────────────────────────────────

/** Human-readable campaign type labels */
export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  flash_sale: 'Flash Sale',
  first_order: 'First Order',
  combo: 'Combo',
  loyalty: 'Loyalty',
  festival: 'Festival',
  custom: 'Custom',
};

/** Computed campaign filters */
export function computeCampaignFields(campaign: OfferCampaign): OfferCampaign {
  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = campaign.endDate ? new Date(campaign.endDate) : null;

  const isExpired = end ? end.getTime() < now.getTime() : false;
  const isExhausted = campaign.usageLimit !== null && campaign.usageCount >= campaign.usageLimit;
  const isAvailable = campaign.isActive && !isExpired && !isExhausted;

  let discountLabel = '';
  if (campaign.discountType === 'percentage') {
    discountLabel = `${campaign.discountValue}% OFF`;
  } else {
    discountLabel = `৳${campaign.discountValue} OFF`;
  }

  let daysRemaining = undefined;
  if (end) {
    daysRemaining = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (daysRemaining < 0) daysRemaining = 0;
  }

  return {
    ...campaign,
    isExpired,
    isExhausted,
    isAvailable,
    discountLabel,
    daysRemaining,
  };
}

/** Get discount label from raw values */
export function getDiscountLabel(
  discountType: DiscountType,
  discountValue: number,
  comboLabel?: string,
  type?: CampaignType,
): string {
  if (type === 'combo' && comboLabel) return comboLabel;
  if (discountType === 'percentage') return `${discountValue}% OFF`;
  return `৳${discountValue} OFF`;
}

/** Type-specific color hex values */
export const TYPE_COLORS: Record<CampaignType, string> = {
  flash_sale: '#ef4444',
  first_order: '#4ade80',
  combo: '#a78bfa',
  loyalty: '#f59e0b',
  festival: '#c9a96e',
  custom: '#60a5fa',
};