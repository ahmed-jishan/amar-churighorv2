// ──────────────────────────────────────────────────────────────────
// Loyalty Reward System — Customer Profile & Reward Service
// Uses Firestore with email+phone composite identity (no login required)
// ──────────────────────────────────────────────────────────────────

import { db } from '@/lib/firebase/config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, query,
  where, limit, increment, arrayUnion,
} from 'firebase/firestore';
import type {
  CustomerProfile,
  CustomerReward,
  LoyaltyCampaignData,
  RewardValidation,
  CouponApplicationResult,
} from './types';
import { getCampaigns, getCampaignById, incrementCampaignUsage } from '@/lib/firebase/campaigns';
import type { OfferCampaign } from '@/types/campaign';
import { sendRewardUnlockEmail } from '@/lib/loyalty/emailService';

// ── Collection Names ─────────────────────────────────────────────
const CUSTOMERS_COLLECTION = 'customers';
const REWARDS_COLLECTION = 'customer_rewards';

// ── Helpers ───────────────────────────────────────────────────────

/** Generate a composite customer key from email + phone */
export function makeCustomerKey(email: string, phone: string): string {
  return `${email.toLowerCase().trim()}|${phone.replace(/\s/g, '').trim()}`;
}

/** Strip undefined values for Firestore compatibility */
function clean<T extends Record<string, any>>(obj: T): T {
  const cleaned = { ...obj } as Record<string, any>;
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) delete cleaned[key];
  });
  return cleaned as T;
}

// ── Customer Profile Operations ───────────────────────────────────

/** Find customer profile by email + phone */
export async function findCustomerByEmailPhone(
  email: string,
  phone: string
): Promise<CustomerProfile | null> {
  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where('email', '==', email.toLowerCase().trim()),
    where('phone', '==', phone.replace(/\s/g, '').trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return { id: snap.docs[0].id, ...data } as CustomerProfile;
}

/** Create or update a customer profile after a completed order */
export async function upsertCustomerProfile(
  email: string,
  phone: string,
  orderTotal: number,
  orderCreatedAt: string
): Promise<CustomerProfile> {
  const existing = await findCustomerByEmailPhone(email, phone);

  if (existing) {
    const ref = doc(db, CUSTOMERS_COLLECTION, existing.id);
    await updateDoc(ref, {
      completedOrders: increment(1),
      totalSpent: increment(orderTotal),
      lastOrderAt: orderCreatedAt,
      updatedAt: new Date().toISOString(),
    });
    // Return the PROFILE with manually incremented count (Firestore increment may be stale on read)
    return {
      ...existing,
      completedOrders: existing.completedOrders + 1,
      totalSpent: existing.totalSpent + orderTotal,
      lastOrderAt: orderCreatedAt,
      updatedAt: new Date().toISOString(),
    };
  } else {
    const now = new Date().toISOString();
    const customerKey = makeCustomerKey(email, phone);
    const newProfile = {
      __customerKey: customerKey,
      email: email.toLowerCase().trim(),
      phone: phone.replace(/\s/g, '').trim(),
      completedOrders: 1,
      totalSpent: orderTotal,
      unlockedRewards: [],
      usedRewards: [],
      firstOrderAt: orderCreatedAt,
      lastOrderAt: orderCreatedAt,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await addDoc(collection(db, CUSTOMERS_COLLECTION), newProfile);
    return { id: ref.id, ...newProfile } as CustomerProfile;
  }
}

/** Get unused (available) rewards for a customer.
 *  A reward is "available" if usageCount < usageLimit AND not expired.
 *  This means if a customer skips applying on one order, the reward
 *  still shows on the next order — they don't lose their chance.
 *  If the associated campaign has been deactivated by admin, the reward
 *  is NOT shown — user cannot use deactivated campaign rewards. */
export async function getAvailableRewards(
  email: string,
  phone: string
): Promise<CustomerReward[]> {
  const profile = await findCustomerByEmailPhone(email, phone);
  if (!profile || profile.unlockedRewards.length === 0) return [];

  // Fetch active campaigns once for campaign-checking efficiency
  const activeCampaigns = await getActiveLoyaltyCampaigns();
  const activeCampaignIds = new Set(activeCampaigns.map(c => c.campaignId || c.id));

  const allRewards: CustomerReward[] = [];
  for (const rewardId of profile.unlockedRewards) {
    const reward = await getRewardById(rewardId);
    if (!reward) continue;

    // Reward is available if:
    // 1. Associated campaign is still active (admin hasn't deactivated it)
    // 2. Not expired AND
    // 3. usageCount < usageLimit (has remaining uses)
    const campaignActive = activeCampaignIds.has(reward.campaignId);
    if (!campaignActive) continue;

    const notExpired = new Date(reward.expiresAt) > new Date();
    const hasRemainingUses = reward.usageCount < reward.usageLimit;

    if (notExpired && hasRemainingUses) {
      allRewards.push(reward);
    }
  }
  return allRewards;
}

// ── Reward Operations ─────────────────────────────────────────────

/** Get a single reward by ID */
export async function getRewardById(id: string): Promise<CustomerReward | null> {
  const snap = await getDoc(doc(db, REWARDS_COLLECTION, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    // Ensure backward compatibility for old rewards without usageCount/usageLimit
    usageCount: data.usageCount ?? (data.isUsed ? 1 : 0),
    usageLimit: data.usageLimit ?? 1,
  } as CustomerReward;
}

/** Get all active loyalty campaigns (supports both 'loyalty' and 'loyalty_reward' types) */
export async function getActiveLoyaltyCampaigns(): Promise<LoyaltyCampaignData[]> {
  const allCampaigns = await getCampaigns();
  const now = new Date().toISOString();

  return allCampaigns
    .filter(c => {
      if (c.type !== 'loyalty' && (c as any).type !== 'loyalty_reward') return false;
      if (!c.isActive) return false;
      if (c.startDate && c.startDate > now) return false;
      if (c.endDate && c.endDate < now) return false;
      return true;
    })
    .map(c => toLoyaltyCampaignData(c));
}

/**
 * Check if customer already has a reward for a specific campaign that still has
 * remaining uses (usageCount < usageLimit). If an existing reward still has uses,
 * return it — we won't create a new one.
 *
 * Only when the existing reward is exhausted (usageCount >= usageLimit) will we
 * allow creating a new reward record.
 */
async function getUsableRewardForCampaign(
  customerKey: string,
  campaignId: string,
  campaignUsageLimit: number
): Promise<CustomerReward | null> {
  const q = query(
    collection(db, REWARDS_COLLECTION),
    where('customerKey', '==', customerKey),
    where('campaignId', '==', campaignId),
    limit(20)
  );
  const snap = await getDocs(q);

  let usableReward: CustomerReward | null = null;

  for (const d of snap.docs) {
    const data = d.data();
    const rewardUsageCount = data.usageCount ?? (data.isUsed ? 1 : 0);
    const rewardUsageLimit = data.usageLimit ?? 1;

    // If this reward still has remaining uses, it's usable
    if (rewardUsageCount < rewardUsageLimit) {
      usableReward = {
        id: d.id,
        ...data,
        usageCount: rewardUsageCount,
        usageLimit: rewardUsageLimit,
      } as CustomerReward;
    }
    // If we find a usable reward, return it immediately
    if (usableReward) return usableReward;
  }

  // If no reward found, check if the campaign usageLimit per-user is exhausted
  // by counting ALL rewards for this user+campaign and their total usage
  let totalUsage = 0;
  for (const d of snap.docs) {
    const data = d.data();
    totalUsage += data.usageCount ?? (data.isUsed ? 1 : 0);
  }

  // If total usage across all rewards >= perUserUsageLimit, user has exhausted their limit
  if (totalUsage >= campaignUsageLimit) {
    return null; // Will be interpreted as "exhausted" by caller
  }

  // No reward exists at all for this user+campaign — return a sentinel to indicate "needs creation"
  return null;
}

/** Check if a customer is eligible for any rewards and unlock them */
export async function checkAndUnlockRewards(
  email: string,
  phone: string
): Promise<CustomerReward | null> {
  const profile = await findCustomerByEmailPhone(email, phone);
  if (!profile) return null;

  const activeCampaigns = await getActiveLoyaltyCampaigns();
  if (activeCampaigns.length === 0) return null;

  const customerKey = makeCustomerKey(email, phone);

  for (const campaign of activeCampaigns) {
    if (profile.completedOrders >= campaign.minCompletedOrders) {
      const perUserLimit = campaign.perUserUsageLimit ?? 1;

      // Check if user has a usable reward already, or if they've exhausted their limit
      const usableReward = await getUsableRewardForCampaign(customerKey, campaign.id, perUserLimit);

      if (usableReward) {
        // User already has a reward with remaining uses — no need to create new
        continue;
      }

      // Check if user has exhausted per-user limit (getUsableRewardForCampaign returned null
      // because total usage >= limit). In that case, skip this campaign entirely.
      const allRewards = await getAllRewardsForCampaign(customerKey, campaign.id);
      let totalUsage = 0;
      for (const r of allRewards) {
        totalUsage += r.usageCount;
      }
      if (totalUsage >= perUserLimit) {
        // User has exhausted their per-user usage limit — skip
        continue;
      }

      // Check campaign global usage limit
      if (campaign.usageLimit && campaign.currentUsage >= campaign.usageLimit) continue;

      // Create new reward
      return await unlockReward(profile, campaign);
    }
  }
  return null;
}

/** Get ALL rewards for a user+campaign (used for counting total usage) */
async function getAllRewardsForCampaign(
  customerKey: string,
  campaignId: string
): Promise<CustomerReward[]> {
  const q = query(
    collection(db, REWARDS_COLLECTION),
    where('customerKey', '==', customerKey),
    where('campaignId', '==', campaignId),
    limit(20)
  );
  const snap = await getDocs(q);
  const results: CustomerReward[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    results.push({
      id: d.id,
      ...data,
      usageCount: data.usageCount ?? (data.isUsed ? 1 : 0),
      usageLimit: data.usageLimit ?? 1,
    } as CustomerReward);
  }
  return results;
}

/** Create a new reward record for a customer */
export async function unlockReward(
  profile: CustomerProfile,
  campaign: LoyaltyCampaignData
): Promise<CustomerReward | null> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + campaign.expiresAfterDays * 24 * 60 * 60 * 1000).toISOString();
  const customerKey = makeCustomerKey(profile.email, profile.phone);
  const perUserLimit = campaign.perUserUsageLimit ?? 1;

  const rewardData = clean({
    customerKey,
    email: profile.email,
    phone: profile.phone,
    campaignId: campaign.campaignId || campaign.id,
    campaignName: campaign.name,
    couponCode: campaign.couponCode,
    discountType: campaign.discountType,
    discountValue: campaign.discountValue,
    unlockedAt: now,
    expiresAt,
    isUsed: false,
    usageCount: 0,
    usageLimit: perUserLimit,
    emailSent: false,
    displayedOnSuccess: false,
    createdAt: now,
    updatedAt: now,
  });

  const ref = await addDoc(collection(db, REWARDS_COLLECTION), rewardData);

  // Update customer profile with reward reference
  await updateDoc(doc(db, CUSTOMERS_COLLECTION, profile.id), {
    unlockedRewards: arrayUnion(ref.id),
    updatedAt: now,
  });

  // Increment campaign usage using the dedicated function (fire-and-forget)
  try {
    await incrementCampaignUsage(campaign.id);
  } catch (e) {
    console.warn('[Loyalty] Failed to increment campaign usage:', e);
  }

  return { id: ref.id, ...rewardData, usageCount: 0, usageLimit: perUserLimit } as CustomerReward;
}

/** Validate a reward before applying (coupon validation) */
export async function validateRewardForCustomer(
  email: string,
  phone: string,
  couponCode: string
): Promise<RewardValidation> {
  const customerKey = makeCustomerKey(email, phone);

  const q = query(
    collection(db, REWARDS_COLLECTION),
    where('customerKey', '==', customerKey),
    where('couponCode', '==', couponCode.toUpperCase().trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    return { valid: false, reward: null, campaign: null, error: 'No reward found for this coupon code' };
  }

  const data = snap.docs[0].data();
  const reward: CustomerReward = {
    id: snap.docs[0].id,
    ...data,
    usageCount: data.usageCount ?? (data.isUsed ? 1 : 0),
    usageLimit: data.usageLimit ?? 1,
  } as CustomerReward;

  if (new Date(reward.expiresAt) < new Date()) {
    return { valid: false, reward, campaign: null, error: 'Reward has expired' };
  }

  // Check if reward has remaining uses (instead of just !isUsed)
  if (reward.usageCount >= reward.usageLimit) {
    return { valid: false, reward, campaign: null, error: 'Reward has been fully used up' };
  }

  const activeCampaigns = await getActiveLoyaltyCampaigns();
  const campaign = activeCampaigns.find(c => c.id === reward.campaignId) ||
    activeCampaigns.find(c => c.campaignId === reward.campaignId) || null;

  if (!campaign) {
    return { valid: false, reward, campaign: null, error: 'Associated campaign is no longer active' };
  }

  return { valid: true, reward, campaign };
}

/** Apply a reward coupon — mark as used (increment usage count) */
export async function applyReward(
  rewardId: string,
  orderId: string,
  subtotal: number
): Promise<CouponApplicationResult> {
  const reward = await getRewardById(rewardId);
  if (!reward) {
    return { success: false, discountAmount: 0, discountLabel: '', error: 'Reward not found' };
  }

  // Check if reward still has remaining uses
  if (reward.usageCount >= reward.usageLimit) {
    return { success: false, discountAmount: 0, discountLabel: '', error: 'Reward has been fully used' };
  }

  let discountAmount = 0;
  let discountLabel = '';
  if (reward.discountType === 'percentage') {
    discountAmount = Math.round(subtotal * (reward.discountValue / 100) * 100) / 100;
    discountLabel = `${reward.discountValue}% OFF`;
  } else {
    discountAmount = Math.min(reward.discountValue, subtotal);
    discountLabel = `৳${reward.discountValue} OFF`;
  }

  const now = new Date().toISOString();
  const newUsageCount = reward.usageCount + 1;
  const isNowExhausted = newUsageCount >= reward.usageLimit;

  // Update: increment usageCount, optionally set isUsed if exhausted
  const updateData: Record<string, any> = {
    usageCount: increment(1),
    usedOnOrderId: orderId,
    usedAt: now,
    updatedAt: now,
  };

  // If this use exhausts the reward, mark isUsed for backward compatibility
  if (isNowExhausted) {
    updateData.isUsed = true;
  }

  await updateDoc(doc(db, REWARDS_COLLECTION, rewardId), updateData);

  const profile = await findCustomerByEmailPhone(reward.email, reward.phone);
  if (profile) {
    await updateDoc(doc(db, CUSTOMERS_COLLECTION, profile.id), {
      usedRewards: arrayUnion(rewardId),
      updatedAt: now,
    });
  }

  return {
    success: true,
    discountAmount,
    discountLabel,
    reward: {
      ...reward,
      usageCount: newUsageCount,
      isUsed: isNowExhausted,
      usedOnOrderId: orderId,
      usedAt: now,
    },
  };
}

// ── Loyalty Campaign Data Conversion ──────────────────────────────

/** Convert an OfferCampaign to LoyaltyCampaignData */
export function toLoyaltyCampaignData(campaign: OfferCampaign): LoyaltyCampaignData {
  return {
    id: campaign.id,
    campaignId: campaign.id,
    name: campaign.title,
    title: campaign.title,
    description: campaign.description,
    minCompletedOrders: campaign.loyaltyMinOrders || 1,  // default 1 so first order can unlock
    discountType: campaign.discountType,
    discountValue: campaign.discountValue,
    couponCode: campaign.couponCode || generateCouponCode(),
    rewardLabel: campaign.rewardLabel || 'Loyalty Reward',
    usageLimit: campaign.usageLimit ?? undefined,
    currentUsage: campaign.usageCount || 0,
    expiresAfterDays: campaign.expiresAfterDays || 30,
    isActive: campaign.isActive,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    perUserUsageLimit: campaign.perUserUsageLimit ?? undefined,
  };
}

/** Generate a coupon code */
function generateCouponCode(): string {
  const prefix = 'LOY';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

// ── Process Loyalty After Delivery ────────────────────────────────

/**
 * Process loyalty rewards after a completed order.
 * Called directly from checkout with the email+phone of the customer.
 * Uses the profile from step 1 directly in step 2 to avoid Firestore read-after-write staleness.
 */
export async function processLoyaltyAfterDelivery(
  email: string,
  phone: string,
  orderTotal: number,
  orderCreatedAt: string
): Promise<{ profile: CustomerProfile; reward: CustomerReward | null }> {
  // 1. Upsert customer profile (creates or updates + increments completedOrders)
  const profile = await upsertCustomerProfile(email, phone, orderTotal, orderCreatedAt);

  // 2. Check and unlock rewards using the profile directly (not re-fetching from Firestore)
  //    This ensures we use the freshly-computed completedOrders count
  const reward = await checkAndUnlockRewardsWithProfile(email, phone, profile);

  // 3. Send reward email if unlocked
  if (reward && !reward.emailSent) {
    try {
      await sendRewardUnlockEmail(reward);
      await updateDoc(doc(db, REWARDS_COLLECTION, reward.id), {
        emailSent: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Loyalty] Failed to send reward email:', e);
    }
  }

  return { profile, reward };
}

/**
 * Check eligibility using an already-fetched profile (avoids Firestore read-after-write staleness).
 * The profile object MUST have the correct completedOrders count.
 */
async function checkAndUnlockRewardsWithProfile(
  email: string,
  phone: string,
  profile: CustomerProfile
): Promise<CustomerReward | null> {
  const activeCampaigns = await getActiveLoyaltyCampaigns();
  if (activeCampaigns.length === 0) return null;

  const customerKey = makeCustomerKey(email, phone);

  for (const campaign of activeCampaigns) {
    if (profile.completedOrders >= campaign.minCompletedOrders) {
      const perUserLimit = campaign.perUserUsageLimit ?? 1;

      // Check if user has a usable reward already, or if they've exhausted their limit
      const usableReward = await getUsableRewardForCampaign(customerKey, campaign.id, perUserLimit);

      if (usableReward) {
        // Already has a reward with remaining uses
        continue;
      }

      // Check if user has exhausted per-user limit
      const allRewards = await getAllRewardsForCampaign(customerKey, campaign.id);
      let totalUsage = 0;
      for (const r of allRewards) {
        totalUsage += r.usageCount;
      }
      if (totalUsage >= perUserLimit) {
        continue;
      }

      // Check campaign global usage limit
      if (campaign.usageLimit && campaign.currentUsage >= campaign.usageLimit) continue;

      // Create new reward
      return await unlockReward(profile, campaign);
    }
  }
  return null;
}