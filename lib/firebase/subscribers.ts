import { db } from './config';
import {
  collection, getDocs, query, orderBy, where, doc, updateDoc, deleteDoc,
} from 'firebase/firestore';

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source: string;
  isActive: boolean;
  discountSent: boolean;
}

const COLLECTION = 'newsletter_subscribers';

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('subscribedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscriber));
}

export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('isActive', '==', true), orderBy('subscribedAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscriber));
}

export async function deleteSubscriber(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function toggleSubscriberActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { isActive });
}

export function exportSubscribersAsCSV(subscribers: Subscriber[]): string {
  const header = 'Email,Subscribed Date,Source,Status,Discount Sent';
  const rows = subscribers.map((s) =>
    [
      s.email,
      new Date(s.subscribedAt).toLocaleDateString('en-BD'),
      s.source,
      s.isActive ? 'Active' : 'Unsubscribed',
      s.discountSent ? 'Yes' : 'No',
    ].join(',')
  );
  return [header, ...rows].join('\n');
}