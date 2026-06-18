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
import { getCampaigns, updateCampaign, getCampaignById } from '@/lib/firebase/campaigns';
import type { Campaign } from '@/lib/offers/campaignTypes';
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

/** Get unused (available) rewards for a customer */
export async function getAvailableRewards(
  email: string,
  phone: string
): Promise<CustomerReward[]> {
  const profile = await findCustomerByEmailPhone(email, phone);
  if (!profile || profile.unlockedRewards.length === 0) return [];

  const allRewards: CustomerReward[] = [];
  for (const rewardId of profile.unlockedRewards) {
    const reward = await getRewardById(rewardId);
    if (reward && !reward.isUsed && new Date(reward.expiresAt) > new Date()) {
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
  return { id: snap.id, ...snap.data() } as CustomerReward;
}

/** Get all active loyalty campaigns (with type=loyalty_reward) */
export async function getActiveLoyaltyCampaigns(): Promise<LoyaltyCampaignData[]> {
  const allCampaigns = await getCampaigns();
  const now = new Date().toISOString();

  return allCampaigns
    .filter(c => {
      if (c.type !== 'loyalty_reward') return false;
      if (!c.isActive) return false;
      if (c.startDate && c.startDate > now) return false;
      if (c.endDate && c.endDate < now) return false;
      return true;
    })
    .map(c => toLoyaltyCampaignData(c));
}

/** Check if customer already has a reward for a specific campaign */
async function hasRewardForCampaign(
  customerKey: string,
  campaignId: string
): Promise<boolean> {
  const q = query(
    collection(db, REWARDS_COLLECTION),
    where('customerKey', '==', customerKey),
    limit(20)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    if (data.campaignId === campaignId) return true;
  }
  return false;
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
      const alreadyUnlocked = await hasRewardForCampaign(customerKey, campaign.id);
      if (alreadyUnlocked) continue;

      if (campaign.usageLimit && campaign.currentUsage >= campaign.usageLimit) continue;

      return await unlockReward(profile, campaign);
    }
  }
  return null;
}

/** Create a new reward record for a customer */
export async function unlockReward(
  profile: CustomerProfile,
  campaign: LoyaltyCampaignData
): Promise<CustomerReward | null> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + campaign.expiresAfterDays * 24 * 60 * 60 * 1000).toISOString();
  const customerKey = makeCustomerKey(profile.email, profile.phone);

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

  // Increment campaign usage
  try {
    const campaignDoc = await getCampaignById(campaign.id);
    if (campaignDoc) {
      await updateCampaign(campaign.id, {
        currentUsage: (campaignDoc.currentUsage || 0) + 1,
      } as any);
    }
  } catch (e) {
    console.warn('[Loyalty] Failed to increment campaign usage:', e);
  }

  return { id: ref.id, ...rewardData } as CustomerReward;
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

  const reward: CustomerReward = { id: snap.docs[0].id, ...snap.docs[0].data() } as CustomerReward;

  if (new Date(reward.expiresAt) < new Date()) {
    return { valid: false, reward, campaign: null, error: 'Reward has expired' };
  }

  if (reward.isUsed) {
    return { valid: false, reward, campaign: null, error: 'Reward has already been used' };
  }

  const activeCampaigns = await getActiveLoyaltyCampaigns();
  const campaign = activeCampaigns.find(c => c.id === reward.campaignId) ||
    activeCampaigns.find(c => c.campaignId === reward.campaignId) || null;

  if (!campaign) {
    return { valid: false, reward, campaign: null, error: 'Associated campaign is no longer active' };
  }

  return { valid: true, reward, campaign };
}

/** Apply a reward coupon — mark as used */
export async function applyReward(
  rewardId: string,
  orderId: string,
  subtotal: number
): Promise<CouponApplicationResult> {
  const reward = await getRewardById(rewardId);
  if (!reward) {
    return { success: false, discountAmount: 0, discountLabel: '', error: 'Reward not found' };
  }

  if (reward.isUsed) {
    return { success: false, discountAmount: 0, discountLabel: '', error: 'Reward already used' };
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

  await updateDoc(doc(db, REWARDS_COLLECTION, rewardId), {
    isUsed: true,
    usedOnOrderId: orderId,
    usedAt: now,
    updatedAt: now,
  });

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
    reward: { ...reward, isUsed: true, usedOnOrderId: orderId, usedAt: now },
  };
}

// ── Loyalty Campaign Data Conversion ──────────────────────────────

/** Convert a Campaign to LoyaltyCampaignData */
export function toLoyaltyCampaignData(campaign: Campaign): LoyaltyCampaignData {
  return {
    id: campaign.id,
    campaignId: campaign.id,
    name: campaign.name,
    title: campaign.title || campaign.name,
    description: campaign.description,
    minCompletedOrders: campaign.minCompletedOrders || 10,
    discountType: campaign.discountType,
    discountValue: campaign.discountValue,
    couponCode: campaign.couponCode || generateCouponCode(),
    rewardLabel: campaign.badgeText || 'Loyalty Reward',
    usageLimit: campaign.usageLimit,
    currentUsage: campaign.currentUsage || 0,
    expiresAfterDays: campaign.expiresAfterDays || 30,
    isActive: campaign.isActive,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
  };
}

/** Generate a coupon code */
function generateCouponCode(): string {
  const prefix = 'LOY';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

// ── Process Loyalty After Delivery ────────────────────────────────

/** Process loyalty rewards after a delivered order */
export async function processLoyaltyAfterDelivery(
  email: string,
  phone: string,
  orderTotal: number,
  orderCreatedAt: string
): Promise<{ profile: CustomerProfile; reward: CustomerReward | null }> {
  // 1. Upsert customer profile
  const profile = await upsertCustomerProfile(email, phone, orderTotal, orderCreatedAt);

  // 2. Check and unlock rewards
  const reward = await checkAndUnlockRewards(email, phone);

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