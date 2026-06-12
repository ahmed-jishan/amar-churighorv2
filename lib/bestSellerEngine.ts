import { db } from '@/lib/firebase/config';
import {
  collection, doc, getDocs, query, where, orderBy, limit,
  runTransaction
} from 'firebase/firestore';
import { Product, Order, BestSellerConfig, DEFAULT_BEST_SELLER_CONFIG } from '@/types';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

/**
 * Compute the best seller score for a product based on sales metrics.
 * Formula:
 *   bestSellerScore = (orderCount × orderCountWeight)
 *                   + (totalUnitsSold × unitsSoldWeight)
 *                   + (totalRevenue × revenueWeight)
 */
export function computeBestSellerScore(
  totalOrders: number,
  totalUnitsSold: number,
  totalRevenue: number,
  config: BestSellerConfig = DEFAULT_BEST_SELLER_CONFIG
): number {
  return (
    totalOrders * config.orderCountWeight +
    totalUnitsSold * config.unitsSoldWeight +
    totalRevenue * config.revenueWeight
  );
}

/**
 * Fetch all active products that have been manually flagged as Best Seller.
 */
export async function getManualBestSellers(): Promise<Product[]> {
  // Use single-filter query to avoid composite index errors
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('isBestSeller', '==', true),
  );
  const snap = await getDocs(q);
  const products = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Product))
    .filter(p => p.isActive); // Client-side filter for isActive
  // Client-side sort
  products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return products;
}

/**
 * Fetch top performing products by bestSellerScore (auto-calculated).
 * Only returns active products.
 */
export async function getAutoBestSellers(
  maxResults: number = DEFAULT_BEST_SELLER_CONFIG.autoBestSellerLimit,
  excludeIds: Set<string> = new Set()
): Promise<Product[]> {
  // Use single-filter query to avoid composite index errors
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('bestSellerScore', '>', 0),
  );
  const snap = await getDocs(q);
  const results: Product[] = [];
  for (const d of snap.docs) {
    const product = { id: d.id, ...d.data() } as Product;
    if (product.isActive && !excludeIds.has(d.id)) { // Client-side isActive filter
      results.push(product);
    }
  }
  // Client-side sort by bestSellerScore descending
  results.sort((a, b) => (b.bestSellerScore ?? 0) - (a.bestSellerScore ?? 0));
  return results.slice(0, maxResults);
}

/**
 * Get the combined Hybrid Best Seller list:
 * 1. Manual Best Sellers (isBestSeller = true) — always appear first
 * 2. Auto Best Sellers (by bestSellerScore) — fill remaining slots
 * 3. Duplicates removed (manual IDs excluded from auto results)
 * 4. Inactive products excluded automatically
 * 5. New store fallback: if no auto B.S. exist, only manual ones are shown
 */
export async function getHybridBestSellers(
  maxResults: number = 8,
  config: BestSellerConfig = DEFAULT_BEST_SELLER_CONFIG
): Promise<Product[]> {
  // Step 1: Get manual best sellers
  const manual = await getManualBestSellers();

  // Step 2: Build exclusion set from manual IDs
  const manualIds = new Set(manual.map(p => p.id));

  // Step 3: Get automatic best sellers, excluding manual ones
  const auto = await getAutoBestSellers(maxResults, manualIds);

  // Step 4: Combine — manual first, then auto
  const combined = [...manual];

  // Fill remaining slots with auto best sellers
  const remainingSlots = maxResults - combined.length;
  if (remainingSlots > 0) {
    combined.push(...auto.slice(0, remainingSlots));
  }

  // Step 5: If combined is empty (new store fallback), return manual only
  if (combined.length === 0) {
    return manual.slice(0, maxResults);
  }

  return combined.slice(0, maxResults);
}

/**
 * Aggregate sales statistics for a specific product from all delivered orders.
 */
export async function recalculateProductSalesStats(
  productId: string,
  config: BestSellerConfig = DEFAULT_BEST_SELLER_CONFIG
): Promise<void> {
  // Query all delivered orders
  const ordersSnap = await getDocs(
    query(
      collection(db, ORDERS_COLLECTION),
      where('status', '==', 'delivered'),
    )
  );

  let totalOrders = 0;
  let totalUnitsSold = 0;
  let totalRevenue = 0;

  for (const docSnap of ordersSnap.docs) {
    const order = docSnap.data() as Order;
    const matchingItem = order.items.find(i => i.productId === productId);
    if (matchingItem) {
      totalOrders++;
      totalUnitsSold += matchingItem.quantity;
      totalRevenue += matchingItem.price * matchingItem.quantity;
    }
  }

  const bestSellerScore = computeBestSellerScore(
    totalOrders,
    totalUnitsSold,
    totalRevenue,
    config
  );

  // Atomic update to the product document
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, PRODUCTS_COLLECTION, productId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    transaction.update(ref, {
      totalOrders,
      totalUnitsSold,
      totalRevenue,
      bestSellerScore,
      lastCalculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * Recalculate sales stats for ALL products.
 * This is an expensive operation and should be used sparingly (e.g., on-demand or via cron).
 * Returns the number of products updated.
 */
export async function recalculateAllProductSalesStats(
  config: BestSellerConfig = DEFAULT_BEST_SELLER_CONFIG
): Promise<number> {
  // Get all products
  const productsSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const productIds = productsSnap.docs.map(d => d.id);

  let updatedCount = 0;
  for (const productId of productIds) {
    try {
      await recalculateProductSalesStats(productId, config);
      updatedCount++;
    } catch (err) {
      console.error(`Failed to recalculate stats for product ${productId}:`, err);
    }
  }
  return updatedCount;
}

/**
 * Incrementally update a product's sales stats when an order is delivered.
 */
export async function incrementProductSalesStats(
  productId: string,
  quantity: number,
  revenue: number
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, PRODUCTS_COLLECTION, productId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const product = snap.data() as Product;

    const newTotalOrders = (product.totalOrders ?? 0) + 1;
    const newTotalUnitsSold = (product.totalUnitsSold ?? 0) + quantity;
    const newTotalRevenue = (product.totalRevenue ?? 0) + revenue;
    const newScore = computeBestSellerScore(
      newTotalOrders,
      newTotalUnitsSold,
      newTotalRevenue
    );

    transaction.update(ref, {
      totalOrders: newTotalOrders,
      totalUnitsSold: newTotalUnitsSold,
      totalRevenue: newTotalRevenue,
      bestSellerScore: newScore,
      lastCalculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}

/**
 * Decrement a product's sales stats when a delivered order is cancelled.
 */
export async function decrementProductSalesStats(
  productId: string,
  quantity: number,
  revenue: number
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, PRODUCTS_COLLECTION, productId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const product = snap.data() as Product;

    const newTotalOrders = Math.max(0, (product.totalOrders ?? 0) - 1);
    const newTotalUnitsSold = Math.max(0, (product.totalUnitsSold ?? 0) - quantity);
    const newTotalRevenue = Math.max(0, (product.totalRevenue ?? 0) - revenue);
    const newScore = computeBestSellerScore(
      newTotalOrders,
      newTotalUnitsSold,
      newTotalRevenue
    );

    transaction.update(ref, {
      totalOrders: newTotalOrders,
      totalUnitsSold: newTotalUnitsSold,
      totalRevenue: newTotalRevenue,
      bestSellerScore: newScore,
      lastCalculatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
}