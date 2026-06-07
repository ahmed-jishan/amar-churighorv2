import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, query,
  where, orderBy, limit, Timestamp
} from 'firebase/firestore';
import { Order, OrderStatus } from '@/types';

const COLLECTION = 'orders';

function generateOrderId(): string {
  return 'AC' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

export async function createOrder(data: Omit<Order, 'id' | 'orderId' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<string> {
  const orderId = generateOrderId();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    orderId,
    status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: now }],
    createdAt: now,
    updatedAt: now,
  });
  return orderId;
}

export async function getOrderByOrderId(orderId: string): Promise<Order | null> {
  const q = query(collection(db, COLLECTION), where('orderId', '==', orderId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
}

export async function getAllOrders(): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<void> {
  const orderSnap = await getDoc(doc(db, COLLECTION, id));
  if (!orderSnap.exists()) return;
  const order = orderSnap.data() as Order;
  const now = new Date().toISOString();
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    statusHistory: [...(order.statusHistory || []), { status, timestamp: now, note }],
    updatedAt: now,
  });
}
