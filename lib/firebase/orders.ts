import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, query,
  where, orderBy, limit, Timestamp
} from 'firebase/firestore';
import { Order, OrderStatus } from '@/types';
import { getAnonymousId } from '@/lib/anonymousUser';
import { deductStockAtomic, replenishStock } from './products';
import {
  incrementProductSalesStats,
  decrementProductSalesStats,
} from '@/lib/bestSellerEngine';

const COLLECTION = 'orders';

function generateOrderId(): string {
  return 'AC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

export async function createOrder(data: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<{ orderId: string; trackingToken: string }> {
  const orderId = generateOrderId();
  const now = new Date().toISOString();

  // Atomically deduct stock for each item
  for (const item of data.items) {
    const result = await deductStockAtomic(item.productId, item.quantity);
    if (!result.success) {
      // Stock deduction failed — replenish any already-deducted items
      for (const prevItem of data.items) {
        if (prevItem.productId === item.productId) break; // current & future not deducted
        await replenishStock(prevItem.productId, prevItem.quantity);
      }
      throw new Error(`Insufficient stock for "${item.name}". Only ${result.available} available.`);
    }
  }

  const trackingToken = crypto.randomUUID();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    orderId,
    anonymousId: getAnonymousId(),
    trackingToken,
    trackingTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    notificationSent: false,
    status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: now, note: 'Order placed by customer' }],
    createdAt: now,
    updatedAt: now,
  });
  return { orderId, trackingToken };
}

export async function getOrderByOrderId(orderId: string): Promise<Order | null> {
  const q = query(collection(db, COLLECTION), where('orderId', '==', orderId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  // Backward compatibility: ensure email field exists
  if (!data.customer?.email) {
    data.customer = { ...data.customer, email: '' };
  }
  return { id: snap.docs[0].id, ...data } as Order;
}

export async function getAllOrders(): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => {
    const data = d.data();
    // Backward compatibility: ensure email field exists
    if (!data.customer?.email) {
      data.customer = { ...data.customer, email: '' };
    }
    return { id: d.id, ...data } as Order;
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
  const orderSnap = await getDoc(doc(db, COLLECTION, id));
  if (!orderSnap.exists()) return;
  const order = orderSnap.data() as Order;
  const now = new Date().toISOString();

  const previousStatus = order.status;

  // ── Hybrid Best Seller: Update product sales stats on status transitions ──
  // When status changes TO 'delivered': increment sales stats
  if (previousStatus !== 'delivered' && status === 'delivered') {
    for (const item of order.items) {
      const itemRevenue = item.price * item.quantity;
      await incrementProductSalesStats(item.productId, item.quantity, itemRevenue);
    }
  }
  // When status changes FROM 'delivered' to something else (e.g. cancelled): decrement
  else if (previousStatus === 'delivered' && status !== 'delivered') {
    for (const item of order.items) {
      const itemRevenue = item.price * item.quantity;
      await decrementProductSalesStats(item.productId, item.quantity, itemRevenue);
    }
  }

  const historyEntry: { status: OrderStatus; timestamp: string; note?: string } = { status, timestamp: now };
  if (note !== undefined) {
    historyEntry.note = note;
  }

  await updateDoc(doc(db, COLLECTION, id), {
    status,
    statusHistory: [...(order.statusHistory || []), historyEntry],
    updatedAt: now,
  });
}
