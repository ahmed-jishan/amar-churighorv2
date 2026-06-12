import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, runTransaction
} from 'firebase/firestore';
import { Product, computeInventoryStatus } from '@/types';

const COLLECTION = 'products';

export async function getProducts(filters?: {
  category?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isActive?: boolean;
}): Promise<Product[]> {
  let constraints: any[] = [];

  // Apply where filters first
  if (filters?.category) constraints.push(where('category', '==', filters.category));
  if (filters?.isFeatured !== undefined) constraints.push(where('isFeatured', '==', filters.isFeatured));
  if (filters?.isBestSeller !== undefined) constraints.push(where('isBestSeller', '==', filters.isBestSeller));
  if (filters?.isNewArrival !== undefined) constraints.push(where('isNewArrival', '==', filters.isNewArrival));
  if (filters?.isActive !== undefined) constraints.push(where('isActive', '==', filters.isActive));

  // Only apply orderBy in query when NO filters to avoid composite index requirements
  // When filters exist, we sort client-side to prevent Firestore index errors
  const hasFilters = Object.values(filters || {}).some(v => v !== undefined);
  if (!hasFilters) {
    constraints.push(orderBy('createdAt', 'desc'));
  }

  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  let products = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      initialStock: data.initialStock ?? data.stock ?? 0,
      soldQuantity: data.soldQuantity ?? 0,
      availableStock: data.availableStock ?? (data.initialStock ?? data.stock ?? 0) - (data.soldQuantity ?? 0),
      stock: data.availableStock ?? (data.initialStock ?? data.stock ?? 0) - (data.soldQuantity ?? 0),
    } as Product;
  });

  // Client-side sort when query had no orderBy
  if (hasFilters) {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const q = query(collection(db, COLLECTION), where('slug', '==', slug), where('isActive', '==', true), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    ...data,
    initialStock: data.initialStock ?? data.stock ?? 0,
    soldQuantity: data.soldQuantity ?? 0,
    availableStock: data.availableStock ?? (data.initialStock ?? data.stock ?? 0) - (data.soldQuantity ?? 0),
    stock: data.availableStock ?? (data.initialStock ?? data.stock ?? 0) - (data.soldQuantity ?? 0),
  } as Product;
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    initialStock: data.initialStock ?? data.stock ?? 0,
    soldQuantity: data.soldQuantity ?? 0,
    availableStock: data.availableStock ?? (data.initialStock ?? data.stock ?? 0) - (data.soldQuantity ?? 0),
    stock: data.availableStock ?? (data.initialStock ?? data.stock ?? 0) - (data.soldQuantity ?? 0),
  } as Product;
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  const initialStock = data.initialStock || data.stock || 0;
  const payload = {
    ...data,
    initialStock,
    soldQuantity: 0,
    availableStock: initialStock,
    stock: initialStock,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const updatePayload: Record<string, any> = { ...data, updatedAt: new Date().toISOString() };
  const existing = await getProductById(id);
  if (!existing) return;

  // Case 1: Admin explicitly sets soldQuantity (use it directly)
  if (data.soldQuantity !== undefined) {
    const newSold = Math.max(0, data.soldQuantity);
    const newInitial = data.initialStock ?? existing.initialStock;
    const newAvailable = Math.max(0, newInitial - newSold);
    updatePayload.initialStock = newInitial;
    updatePayload.soldQuantity = newSold;
    updatePayload.availableStock = newAvailable;
    updatePayload.stock = newAvailable;
  }
  // Case 2: Admin adjusts initialStock (preserves soldQuantity)
  else if (data.initialStock !== undefined) {
    const newInitial = Math.max(0, data.initialStock);
    const newAvailable = Math.max(0, newInitial - existing.soldQuantity);
    updatePayload.initialStock = newInitial;
    updatePayload.soldQuantity = existing.soldQuantity;
    updatePayload.availableStock = newAvailable;
    updatePayload.stock = newAvailable;
  }
  // Case 3: Admin sets stock directly (additive — delta is added to total stock)
  else if (data.stock !== undefined) {
    const delta = data.stock - existing.availableStock;
    // Positive delta = restock, negative = reduction
    const newInitialStock = Math.max(existing.soldQuantity, existing.initialStock + delta);
    const newAvailable = Math.max(0, newInitialStock - existing.soldQuantity);
    updatePayload.initialStock = newInitialStock;
    updatePayload.availableStock = newAvailable;
    updatePayload.stock = newAvailable;
    // soldQuantity remains UNCHANGED — NEVER modified by admin stock edits
  }

  await updateDoc(doc(db, COLLECTION, id), updatePayload);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Atomically deduct stock using Firestore transaction.
 * Returns true if successful, false if insufficient stock.
 */
export async function deductStockAtomic(
  productId: string,
  quantity: number
): Promise<{ success: boolean; available: number }> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, productId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        return { success: false, available: 0, reason: 'Product not found' };
      }

      const product = snap.data() as Product;
      const currentAvailable = product.availableStock ?? product.stock ?? 0;

      if (currentAvailable < quantity) {
        return { success: false, available: currentAvailable, reason: 'Insufficient stock' };
      }

      const newAvailable = currentAvailable - quantity;
      const newSold = (product.soldQuantity ?? 0) + quantity;

      transaction.update(ref, {
        availableStock: newAvailable,
        soldQuantity: newSold,
        stock: newAvailable,
        updatedAt: new Date().toISOString(),
      });

      return { success: true, available: newAvailable };
    });
    return result;
  } catch (error) {
    console.error('deductStockAtomic error:', error);
    return { success: false, available: 0 };
  }
}

/**
 * Replenish stock (for cancellations or admin adjustments).
 */
export async function replenishStock(
  productId: string,
  quantity: number
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, COLLECTION, productId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const product = snap.data() as Product;
    const newSold = Math.max(0, (product.soldQuantity ?? 0) - quantity);
    const newAvailable = Math.max(0, (product.initialStock ?? product.stock ?? 0) - newSold);

    transaction.update(ref, {
      availableStock: newAvailable,
      soldQuantity: newSold,
      stock: newAvailable,
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * Adjust inventory manually (admin restock). Transaction-safe.
 */
export async function adjustStock(
  productId: string,
  newAvailable: number
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, COLLECTION, productId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const product = snap.data() as Product;
    const safeAvailable = Math.max(0, newAvailable);
    const newSold = Math.max(0, (product.initialStock ?? product.stock ?? 0) - safeAvailable);

    transaction.update(ref, {
      availableStock: safeAvailable,
      soldQuantity: newSold,
      stock: safeAvailable,
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * Increment stock by a delta (positive = restock, negative = manual reduction).
 */
export async function incrementStock(
  productId: string,
  delta: number
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, COLLECTION, productId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const product = snap.data() as Product;
    const currentAvailable = product.availableStock ?? product.stock ?? 0;
    const newAvailable = Math.max(0, currentAvailable + delta);
    const newInitialStock = (product.initialStock ?? currentAvailable) + Math.max(0, delta);
    const newSold = Math.max(0, newInitialStock - newAvailable);

    transaction.update(ref, {
      initialStock: newInitialStock,
      availableStock: newAvailable,
      soldQuantity: product.initialStock !== undefined ? newSold : product.soldQuantity ?? 0,
      stock: newAvailable,
      updatedAt: new Date().toISOString(),
    });
  });
}

function normalizeInventory(data: Product): void {
  if (data.initialStock === undefined) {
    data.initialStock = data.stock || 0;
  }
  if (data.soldQuantity === undefined) {
    data.soldQuantity = 0;
  }
  if (data.availableStock === undefined) {
    data.availableStock = data.initialStock - data.soldQuantity;
  }
  data.stock = data.availableStock;
}