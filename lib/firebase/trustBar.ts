import { db } from './config';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where,
} from 'firebase/firestore';

export interface TrustBarItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
}

const COLLECTION = 'trust_bar';

export async function getTrustBarItems(): Promise<TrustBarItem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  const items = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as TrustBarItem[];
  // Client-side sort to avoid composite index requirement
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

export async function getActiveTrustBarItems(): Promise<TrustBarItem[]> {
  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as TrustBarItem[];
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

export async function createTrustBarItem(data: Omit<TrustBarItem, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateTrustBarItem(id: string, data: Partial<TrustBarItem>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteTrustBarItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}