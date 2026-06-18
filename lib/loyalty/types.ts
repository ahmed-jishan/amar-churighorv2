// ──────────────────────────────────────────────────────────────────
// Loyalty Reward System Types
// All reward records stored in Firestore `customers` collection.
// ──────────────────────────────────────────────────────────────────

/** Customer identity and reward tracking profile */
export interface CustomerProfile {
  id: string;
  email: string;
  phone: string;
  /** Total completed/delivered orders */
  completedOrders: number;
  /** Total amount spent on completed orders */
  totalSpent: number;
  /** Array of reward IDs unlocked by this customer */
  unlockedRewards: string[];
  /** Array of reward IDs that have been used/consumed */
  usedRewards: string[];
  /** Timestamps */
  firstOrderAt: string;
  lastOrderAt: string;
  createdAt: string;
  updatedAt: string;
}

/** A reward record tied to a customer and a loyalty campaign */
export interface CustomerReward {
  id: string;
  /** Composite key: email|phone for lookups */
  customerKey: string;
  email: string;
  phone: string;
  /** Reference to the loyalty campaign that generated this reward */
  campaignId: string;
  campaignName: string;
  /** Coupon code (from campaign) */
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  /** When this reward was unlocked */
  unlockedAt: string;
  /** When this reward expires */
  expiresAt: string;
  /** Whether the reward has been used */
  isUsed: boolean;
  /** If used, the order ID where it was applied */
  usedOnOrderId?: string;
  /** If used, timestamp of usage */
  usedAt?: string;
  /** Whether the reward email has been sent */
  emailSent: boolean;
  /** Whether this was displayed on the order success page */
  displayedOnSuccess: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a customer profile */
export interface CustomerProfileInput {
  email: string;
  phone: string;
  completedOrders?: number;
  totalSpent?: number;
  firstOrderAt?: string;
  lastOrderAt?: string;
}

/** Result of checking reward eligibility for a customer */
export interface RewardEligibilityResult {
  eligible: boolean;
  campaign: LoyaltyCampaignData | null;
  milestone: number;
  currentOrders: number;
}

/** Simplified loyalty campaign data from the campaigns collection */
export interface LoyaltyCampaignData {
  id: string;
  name: string;
  title: string;
  description: string;
  minCompletedOrders: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  couponCode: string;
  rewardLabel: string;
  usageLimit?: number;
  currentUsage: number;
  expiresAfterDays: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  campaignId?: string;
}

/** Response for reward validation before applying */
export interface RewardValidation {
  valid: boolean;
  reward: CustomerReward | null;
  campaign: LoyaltyCampaignData | null;
  error?: string;
}

/** Coupon application result */
export interface CouponApplicationResult {
  success: boolean;
  discountAmount: number;
  discountLabel: string;
  reward?: CustomerReward;
  error?: string;
}