import { db } from './config';
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source: string;
  isActive: boolean;
  discountSent: boolean;
}

const COLLECTION = 'newsletter_subscribers';

export async function getSubscribers(): Promise<NewsletterSubscriber[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('subscribedAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NewsletterSubscriber));
}

export async function checkDuplicateEmail(email: string): Promise<boolean> {
  const q = query(collection(db, COLLECTION), orderBy('subscribedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.some(d => d.data().email === email);
}

export async function addSubscriber(data: Omit<NewsletterSubscriber, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), data);
  return ref.id;
}

export async function deleteSubscriber(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}