import { db } from './config';
import { collection, getDocs } from 'firebase/firestore';
import { Admin } from '@/types';

/**
 * Fetch ALL admins from Firestore `admins` collection.
 * Normalizes field names: supports both `name` and `displayName` for display.
 * WARNING: Firestore rules allow any active (non-suspended) admin to list docs,
 * but only super_admin can create/update/delete.
 *
 * This file intentionally does NOT contain any auth-touching code
 * (no createUserWithEmailAndPassword, signIn, signOut, etc.).
 * Admin creation/deletion/update MUST go through Cloud Functions (services/adminService.ts).
 */
export async function getAllAdmins(): Promise<Admin[]> {
  const snap = await getDocs(collection(db, 'admins'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.displayName || data.name || data.email?.split('@')[0] || 'Admin',
      email: data.email || '',
      role: data.role || 'admin',
      isSuspended: data.isSuspended ?? false,
      createdAt: data.createdAt || '',
    } as Admin;
  });
}