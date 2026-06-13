import { db } from './config';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore';

export interface WhyChooseUsItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
}

const COLLECTION = 'why_choose_us';

export async function getWhyChooseUsItems(): Promise<WhyChooseUsItem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as WhyChooseUsItem));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

export async function getActiveWhyChooseUsItems(): Promise<WhyChooseUsItem[]> {
  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as WhyChooseUsItem));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

export async function createWhyChooseUsItem(data: Omit<WhyChooseUsItem, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateWhyChooseUsItem(id: string, data: Partial<WhyChooseUsItem>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteWhyChooseUsItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}