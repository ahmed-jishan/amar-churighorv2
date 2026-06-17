// ──────────────────────────────────────────────────────────────────
// Campaign & Promotions System Types
// All campaign records stored in Firestore `campaigns` collection.
// Fully backward-compatible with existing product discount system.
// ──────────────────────────────────────────────────────────────────

export type CampaignType =
  | 'flash_sale'
  | 'first_customer'
  | 'combo'
  | 'loyalty_reward'
  | 'festival'
  | 'custom';

export type DiscountType = 'percentage' | 'fixed';

export interface Campaign {
  id: string;
  /** Internal admin name (not shown to customers) */
  name: string;
  /** Campaign type determines display and behavior */
  type: CampaignType;
  /** Public-facing title (e.g. "Eid Flash Sale") */
  title: string;
  /** Public-facing description */
  description: string;
  /** Banner image URL for hero display */
  bannerImage?: string;
  /** Badge text (e.g. "HOT", "NEW", "LIMITED") */
  badgeText?: string;
  /** Campaign scheduling */
  startDate: string;  // ISO
  endDate?: string;   // ISO (null = no expiry)
  /** Active status */
  isActive: boolean;
  /** Priority (higher = shown first). 0 = lowest */
  priority: number;
  /** Target product IDs (empty = all eligible) */
  targetProductIds: string[];
  /** Target category names (empty = all eligible) */
  targetCategoryNames: string[];
  /** Discount definition */
  discountType: DiscountType;
  discountValue: number; // percentage (e.g. 30) or fixed amount (e.g. 200)
  /** Combo: minimum quantity to qualify */
  minQuantity?: number;
  /** Loyalty: minimum completed orders to qualify */
  minCompletedOrders?: number;
  /** First-customer only flag */
  isFirstOrderOnly: boolean;
  /** Usage cap (null = unlimited) */
  usageLimit?: number;
  /** Current usage count */
  currentUsage: number;
  /** For combo: "buy X get discount" messaging */
  comboLabel?: string;
  /** For festival: theme color */
  themeColor?: string;
  /** Metadata */
  createdAt: string;
  updatedAt: string;
}

/** Input for creating/updating campaigns (without id/timestamps) */
export type CampaignInput = Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'currentUsage'> & {
  currentUsage?: number;
};

/** Minimal display version for card rendering */
export interface CampaignCardData {
  id: string;
  type: CampaignType;
  title: string;
  description: string;
  bannerImage?: string;
  badgeText?: string;
  discountType: DiscountType;
  discountValue: number;
  endDate?: string;
  priority: number;
  comboLabel?: string;
  themeColor?: string;
  isActive: boolean;
  isFirstOrderOnly: boolean;
  minQuantity?: number;
  minCompletedOrders?: number;
}

// ── Discount Eligibility Result ─────────────────────────────
export interface CampaignEligibility {
  eligible: boolean;
  campaign: CampaignCardData | null;
  discountLabel: string;
  /** Computed discount description for UI */
  description: string;
}

// ── Loyalty Reward Config ──────────────────────────────────
export interface LoyaltyRewardConfig {
  enabled: boolean;
  orderThreshold: number;
  rewardType: DiscountType;
  rewardValue: number;
  rewardDurationDays: number;
  rewardLabel: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyRewardConfig = {
  enabled: true,
  orderThreshold: 10,
  rewardType: 'percentage',
  rewardValue: 5,
  rewardDurationDays: 30,
  rewardLabel: 'VIP Loyalty Reward',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};