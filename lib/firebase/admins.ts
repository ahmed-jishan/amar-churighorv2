import { db, auth } from './config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Admin } from '@/types';

export async function getAllAdmins(): Promise<Admin[]> {
  const snap = await getDocs(collection(db, 'admins'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Admin));
}

export async function createAdmin(email: string, password: string, name: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'admins', cred.user.uid), {
    email, name, role: 'admin', isSuspended: false, createdAt: new Date().toISOString(),
  });
}

export async function suspendAdmin(id: string, suspended: boolean): Promise<void> {
  await updateDoc(doc(db, 'admins', id), { isSuspended: suspended });
}

export async function removeAdmin(id: string): Promise<void> {
  await deleteDoc(doc(db, 'admins', id));
}
