import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp,
} from 'firebase/firestore';
import { Campaign, CampaignInput } from '@/lib/offers/campaignTypes';

const COLLECTION = 'campaigns';

/** Fetch all campaigns, sorted by priority desc, then createdAt desc */
export async function getCampaigns(): Promise<Campaign[]> {
  const q = query(collection(db, COLLECTION), orderBy('priority', 'desc'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
}

/** Fetch only active, non-expired campaigns */
export async function getActiveCampaigns(): Promise<Campaign[]> {
  const all = await getCampaigns();
  const now = new Date().toISOString();
  return all.filter(c => {
    if (!c.isActive) return false;
    if (c.startDate && c.startDate > now) return false;
    if (c.endDate && c.endDate < now) return false;
    return true;
  });
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Campaign;
}

/** Remove all undefined values from an object (Firestore rejects undefined) */
function cleanPayload<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export async function createCampaign(data: CampaignInput): Promise<string> {
  const payload = cleanPayload({
    ...data,
    currentUsage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateCampaign(id: string, data: Partial<Campaign>): Promise<void> {
  const payload = cleanPayload({ ...data, updatedAt: new Date().toISOString() });
  await updateDoc(doc(db, COLLECTION, id), payload);
}

export async function deleteCampaign(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Increment campaign usage count */
export async function incrementCampaignUsage(id: string): Promise<void> {
  const existing = await getCampaignById(id);
  if (!existing) return;
  const newUsage = (existing.currentUsage || 0) + 1;
  await updateDoc(doc(db, COLLECTION, id), {
    currentUsage: newUsage,
    updatedAt: new Date().toISOString(),
  });
}