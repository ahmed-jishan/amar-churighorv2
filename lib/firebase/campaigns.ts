import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { uploadImage } from '@/lib/cloudinary';
import type { OfferCampaign, CampaignFormData, CampaignCardData } from '@/types/campaign';
import { computeCampaignFields, getDiscountLabel } from '@/types/campaign';

const COLLECTION = 'campaigns';

/** Remove all undefined values from an object (Firestore rejects undefined) */
function cleanPayload<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/**
 * Fetch all campaigns, sorted by priority desc, then createdAt desc.
 * @param onlyActive - If true, only fetch campaigns where isActive === true
 */
export async function getCampaigns(onlyActive?: boolean): Promise<OfferCampaign[]> {
  let constraints: any[] = [];
  if (onlyActive) constraints.push(where('isActive', '==', true));
  constraints.push(orderBy('priority', 'desc'));
  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  const campaigns = snap.docs.map(d => ({ id: d.id, ...d.data() } as OfferCampaign));
  return campaigns.map(computeCampaignFields);
}

/**
 * Fetch only active, non-expired, non-exhausted campaigns (for user-facing display).
 */
export async function getActiveCampaigns(): Promise<OfferCampaign[]> {
  const all = await getCampaigns();
  return all.filter(c => {
    const computed = computeCampaignFields(c);
    return computed.isAvailable === true;
  });
}

export async function getCampaignById(id: string): Promise<OfferCampaign | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() } as OfferCampaign;
  return computeCampaignFields(data);
}

export async function createCampaign(data: CampaignFormData, adminUid: string): Promise<string> {
  // Ensure dates are ISO format
  const startDate = new Date(data.startDate).toISOString();
  const endDate = data.endDate ? new Date(data.endDate).toISOString() : undefined;

  const payload = cleanPayload({
    title: data.title,
    description: data.description,
    type: data.type,
    discountType: data.discountType,
    discountValue: Number(data.discountValue),
    image: data.image || undefined,
    startDate,
    endDate,
    isActive: data.isActive,
    priority: Number(data.priority) || 50,
    targetCategories: data.targetCategories || [],
    usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
    usageCount: 0,
    minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : null,
    comboMinQty: data.comboMinQty ? Number(data.comboMinQty) : null,
    loyaltyMinOrders: data.loyaltyMinOrders ? Number(data.loyaltyMinOrders) : null,
    couponCode: data.couponCode || undefined,
    expiresAfterDays: data.expiresAfterDays ? Number(data.expiresAfterDays) : undefined,
    rewardLabel: data.rewardLabel || undefined,
    perUserUsageLimit: data.perUserUsageLimit ? Number(data.perUserUsageLimit) : undefined,
    firstOrderOnly: data.firstOrderOnly || false,
    createdBy: adminUid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateCampaign(id: string, data: Partial<CampaignFormData>): Promise<void> {
  const payload: Record<string, any> = { updatedAt: new Date().toISOString() };

  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.type !== undefined) payload.type = data.type;
  if (data.discountType !== undefined) payload.discountType = data.discountType;
  if (data.discountValue !== undefined) payload.discountValue = Number(data.discountValue);
  if (data.image !== undefined) payload.image = data.image || '';
  if (data.startDate !== undefined) payload.startDate = new Date(data.startDate).toISOString();
  if (data.endDate !== undefined) payload.endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  if (data.priority !== undefined) payload.priority = Number(data.priority);
  if (data.targetCategories !== undefined) payload.targetCategories = data.targetCategories;
  if (data.usageLimit !== undefined) payload.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
  if (data.minOrderAmount !== undefined) payload.minOrderAmount = data.minOrderAmount ? Number(data.minOrderAmount) : null;
  if (data.comboMinQty !== undefined) payload.comboMinQty = data.comboMinQty ? Number(data.comboMinQty) : null;
  if (data.loyaltyMinOrders !== undefined) payload.loyaltyMinOrders = data.loyaltyMinOrders ? Number(data.loyaltyMinOrders) : null;
  if (data.firstOrderOnly !== undefined) payload.firstOrderOnly = data.firstOrderOnly;
  if (data.couponCode !== undefined) payload.couponCode = data.couponCode || null;
  if (data.expiresAfterDays !== undefined) payload.expiresAfterDays = data.expiresAfterDays ? Number(data.expiresAfterDays) : null;
  if (data.rewardLabel !== undefined) payload.rewardLabel = data.rewardLabel || null;
  if (data.perUserUsageLimit !== undefined) payload.perUserUsageLimit = data.perUserUsageLimit ? Number(data.perUserUsageLimit) : null;

  await updateDoc(doc(db, COLLECTION, id), cleanPayload(payload));
}

export async function deleteCampaign(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Toggle campaign active/inactive status.
 */
export async function toggleCampaignActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    isActive,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Increment campaign usage count. Called on order placed.
 * This is fire-and-forget — never throw.
 */
export async function incrementCampaignUsage(id: string): Promise<void> {
  try {
    const existing = await getCampaignById(id);
    if (!existing) return;
    const newCount = (existing.usageCount || 0) + 1;
    await updateDoc(doc(db, COLLECTION, id), {
      usageCount: newCount,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to increment campaign usage (non-blocking):', err);
  }
}

/**
 * Upload campaign image to Cloudinary.
 * Uses the existing pattern from lib/firebase/products.ts (uploadImage).
 * Folder: 'lumin/campaigns/'
 */
export async function uploadCampaignImage(file: File): Promise<string> {
  // We override the folder by uploading via Cloudinary's upload preset
  // The uploadImage function uses a preset — we create a custom function
  // that uploads to 'lumin/campaigns/' folder
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'lumin/campaigns');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) throw new Error('Campaign image upload failed');
  const data = await res.json();
  return data.secure_url;
}

/**
 * Convert an OfferCampaign to a CampaignCardData for card rendering.
 */
export function toCampaignCardData(campaign: OfferCampaign): CampaignCardData {
  return {
    id: campaign.id,
    type: campaign.type,
    title: campaign.title,
    description: campaign.description,
    image: campaign.image,
    discountType: campaign.discountType,
    discountValue: campaign.discountValue,
    discountLabel: campaign.discountLabel || getDiscountLabel(campaign.discountType, campaign.discountValue),
    endDate: campaign.endDate,
    priority: campaign.priority,
    isActive: campaign.isActive,
    isExpired: campaign.isExpired,
    isExhausted: campaign.isExhausted,
    isAvailable: campaign.isAvailable,
    daysRemaining: campaign.daysRemaining,
    usageLimit: campaign.usageLimit,
    usageCount: campaign.usageCount,
    firstOrderOnly: campaign.firstOrderOnly,
    comboMinQty: campaign.comboMinQty,
    loyaltyMinOrders: campaign.loyaltyMinOrders,
    couponCode: campaign.couponCode,
    expiresAfterDays: campaign.expiresAfterDays,
    rewardLabel: campaign.rewardLabel,
    targetCategories: campaign.targetCategories,
    minOrderAmount: campaign.minOrderAmount,
  };
}
