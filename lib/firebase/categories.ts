import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy
} from 'firebase/firestore';
import { ProductCategory } from '@/types';

const COLLECTION = 'categories';

export async function getCategories(): Promise<ProductCategory[]> {
  const q = query(collection(db, COLLECTION), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductCategory));
}

export async function getCategoryById(id: string): Promise<ProductCategory | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ProductCategory;
}

export async function createCategory(data: Omit<ProductCategory, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateCategory(id: string, data: Partial<ProductCategory>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function reorderCategories(ids: string[]): Promise<void> {
  const batch = ids.map((id, index) => updateCategory(id, { sortOrder: index }));
  await Promise.all(batch);
}