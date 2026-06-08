import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, QueryDocumentSnapshot
} from 'firebase/firestore';
import { Product } from '@/types';

const COLLECTION = 'products';

export async function getProducts(filters?: {
  category?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isActive?: boolean;
}): Promise<Product[]> {
  let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  if (filters?.category) q = query(q, where('category', '==', filters.category));
  if (filters?.isFeatured !== undefined) q = query(q, where('isFeatured', '==', filters.isFeatured));
  if (filters?.isBestSeller !== undefined) q = query(q, where('isBestSeller', '==', filters.isBestSeller));
  if (filters?.isNewArrival !== undefined) q = query(q, where('isNewArrival', '==', filters.isNewArrival));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(collection(db, COLLECTION), where('slug', '==', slug), where('isActive', '==', true), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Categories
export async function getCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
