import { db } from './config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore';

const COLLECTION = 'savedUrls';

export interface SavedUrl {
  id: string;
  title: string;
  url: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ── Public API ─────────────────────────────────────────────────

/** Fetch all saved URLs, sorted by createdAt desc */
export async function getSavedUrls(): Promise<SavedUrl[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedUrl));
}

/** Create a new saved URL */
export async function createSavedUrl(data: { title: string; url: string; description?: string }): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTION), {
    title: data.title,
    url: data.url,
    description: data.description || '',
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

/** Update an existing saved URL */
export async function updateSavedUrl(id: string, data: { title: string; url: string; description?: string }): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    title: data.title,
    url: data.url,
    description: data.description || '',
    updatedAt: new Date().toISOString(),
  });
}

/** Delete a saved URL */
export async function deleteSavedUrl(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}