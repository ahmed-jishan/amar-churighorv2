import { db } from './config';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';

export interface FlashSale {
  id: string;
  title: string;
  subtitle: string;
  endTime: string;
  discountLabel: string;
  ctaText: string;
  ctaLink: string;
  backgroundColor: 'accent' | 'dark' | 'red';
  isActive: boolean;
  createdAt?: string;
}

const COLLECTION = 'flash_sale';

export async function getFlashSales(): Promise<FlashSale[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FlashSale));
}

export async function getActiveFlashSale(): Promise<FlashSale | null> {
  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  // Return the first active sale
  const data = snap.docs[0].data();
  return { id: snap.docs[0].id, ...data } as FlashSale;
}

export async function createFlashSale(data: Omit<FlashSale, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateFlashSale(id: string, data: Partial<FlashSale>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteFlashSale(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}