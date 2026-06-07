import { auth, db } from './config';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Admin } from '@/types';

export async function loginAdmin(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function getAdminData(uid: string): Promise<Admin | null> {
  const snap = await getDoc(doc(db, 'admins', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Admin;
}

export function onAdminAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
