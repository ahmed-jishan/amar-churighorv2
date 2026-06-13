import { db } from './config';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';

export interface UGCItem {
  id: string;
  image: string;
  caption?: string;
  productId?: string;
  instagramHandle?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
}

const COLLECTION = 'ugc_gallery';

export async function getUGCItems(): Promise<UGCItem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as UGCItem));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

export async function getActiveUGCItems(): Promise<UGCItem[]> {
  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as UGCItem));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

export async function createUGCItem(data: Omit<UGCItem, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateUGCItem(id: string, data: Partial<UGCItem>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteUGCItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}