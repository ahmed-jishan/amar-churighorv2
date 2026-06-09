import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseApp from '@/lib/firebase/config';

/**
 * Initialize Functions SDK with EXPLICIT region 'us-central1'.
 * Without this, the SDK may resolve to a wrong endpoint URL causing CORS
 * or 404 errors on deployed onCall functions.
 */
const functions = getFunctions(firebaseApp, 'us-central1');

export async function createAdminViaFunction(data: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  const createAdmin = httpsCallable<{ name: string; email: string; password: string }, { success: boolean; uid: string }>(functions, 'createAdminUser');
  const result = await createAdmin(data);
  const res = result.data as { success: boolean; uid: string };
  if (!res.success) {
    throw new Error('Admin creation failed');
  }
}

export async function deleteAdminViaFunction(uid: string): Promise<void> {
  const deleteAdmin = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteAdminUser');
  await deleteAdmin({ uid });
}

export async function updateAdminViaFunction(uid: string, data: { name?: string; isSuspended?: boolean }): Promise<void> {
  const updateAdmin = httpsCallable<{ uid: string; name?: string; isSuspended?: boolean }, { success: boolean }>(functions, 'updateAdminUser');
  await updateAdmin({ uid, ...data });
}