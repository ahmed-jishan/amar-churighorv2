/**
 * Server-side Order Creation API
 *
 * This route is the PROPER way to create orders. It uses the Firebase Admin SDK
 * (server-side) to atomically deduct stock and create the order document.
 *
 * WHY this exists instead of calling createOrder() directly from the client:
 * - Firestore Security Rules block stock deduction (product updates) for unauthenticated users
 * - Admin SDK bypasses security rules entirely — no 403 errors
 * - Stock critical operations must never run on the client
 *
 * The client calls this API, which returns { orderId, trackingToken }
 * exactly like the old client-side createOrder() did — seamless drop-in replacement.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/adminConfig';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

function generateOrderId(): string {
  return 'AC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

/** Strip undefined values from an object (Firestore rejects undefined fields) */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean = { ...obj } as Record<string, any>;
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) delete clean[key];
  });
  return clean as T;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer, items, subtotal, deliveryCharge, total, status, anonymousId } = body;

    // ── Validate required fields ──
    if (!customer?.email || !customer?.phone || !items?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: customer (email, phone) and items' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const trackingToken = crypto.randomUUID();

    // ── Step 1: Atomically deduct stock for each item ──
    // Using Admin SDK runTransaction — bypasses Firestore security rules entirely
    const deducted: string[] = []; // track which products were successfully deducted
    try {
      for (const item of items) {
        const productRef = adminDb.collection(PRODUCTS_COLLECTION).doc(item.productId);
        
        await adminDb.runTransaction(async (transaction) => {
          const snap = await transaction.get(productRef);
          if (!snap.exists) {
            throw new Error(`Product not found: ${item.productId}`);
          }

          const product = snap.data()!;
          const currentAvailable = product.availableStock ?? product.stock ?? 0;

          if (currentAvailable < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.name}". Only ${currentAvailable} available.`
            );
          }

          const newAvailable = currentAvailable - item.quantity;
          const newSold = (product.soldQuantity ?? 0) + item.quantity;

          transaction.update(productRef, {
            availableStock: newAvailable,
            soldQuantity: newSold,
            stock: newAvailable,
            updatedAt: now,
          });
        });

        deducted.push(item.productId);
      }
    } catch (error: any) {
      // ── Rollback: replenish any products that were already deducted ──
      for (const productId of deducted) {
        try {
          const productRef = adminDb.collection(PRODUCTS_COLLECTION).doc(productId);
          await adminDb.runTransaction(async (transaction) => {
            const snap = await transaction.get(productRef);
            if (!snap.exists) return;
            const product = snap.data()!;
            const newSold = Math.max(0, (product.soldQuantity ?? 1) - 1);
            const newAvailable = Math.max(0, (product.initialStock ?? product.stock ?? 0) - newSold);
            transaction.update(productRef, {
              availableStock: newAvailable,
              soldQuantity: newSold,
              stock: newAvailable,
              updatedAt: now,
            });
          });
        } catch (rollbackErr) {
          console.error(`[Orders API] Rollback failed for product ${productId}:`, rollbackErr);
        }
      }

      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create order' },
        { status: 409 }
      );
    }

    // ── Step 2: Create the order document ──
    const cleanItems = items.map((item: any) => {
      const cleaned = { ...item };
      Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === undefined) delete cleaned[key];
      });
      return cleaned;
    });

    const cleanCustomer = { ...customer };
    Object.keys(cleanCustomer).forEach(key => {
      if (cleanCustomer[key] === undefined) delete cleanCustomer[key];
    });

    const orderData = {
      orderId,
      customer: cleanCustomer,
      items: cleanItems,
      subtotal: subtotal ?? 0,
      deliveryCharge: deliveryCharge ?? 0,
      total: total ?? 0,
      status: status ?? 'pending',
      statusHistory: [
        { status: 'pending', timestamp: now, note: 'Order placed by customer' },
      ],
      anonymousId: anonymousId ?? '',
      trackingToken,
      trackingTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      notificationSent: false,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await adminDb.collection(ORDERS_COLLECTION).add(orderData);

    return NextResponse.json({
      success: true,
      orderId,
      trackingToken,
      firestoreId: ref.id,
    });
  } catch (error: any) {
    console.error('[Orders API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}