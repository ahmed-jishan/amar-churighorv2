/**
 * Firebase Admin SDK — server-side only
 * Used in API routes and server components
 * Never import this in client components.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Support two ways to provide admin credentials:
  // 1) Individual env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
  // 2) Single JSON env var (works well on Vercel): FIREBASE_SERVICE_ACCOUNT (stringified JSON)

  let serviceAccount: { project_id?: string; client_email?: string; private_key?: string } | null = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      serviceAccount = {
        project_id: parsed.project_id || parsed.projectId,
        client_email: parsed.client_email || parsed.clientEmail,
        private_key: parsed.private_key || parsed.privateKey,
      };
    } catch (e) {
      // ignore parse errors; will fall back to individual vars and surface a helpful error
      serviceAccount = null;
    }
  }

  const projectId = serviceAccount?.project_id || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = serviceAccount?.client_email || process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = serviceAccount?.private_key || process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin environment variables. Provide either FIREBASE_SERVICE_ACCOUNT (JSON) or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  // Normalize private key robustly:
  // - Accept either a raw PEM, a quoted PEM, or a full service-account JSON string
  // - Handle double-escaped and single-escaped `\n` sequences
  // - Strip CR characters and surrounding quotes
  // - Validate presence of PEM header
  if (typeof privateKey === 'string') {
    let key = privateKey;

    // Remove surrounding quotes if present
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }

    key = key.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n').replace(/\r/g, '').trim();

    if (!key.includes('-----BEGIN PRIVATE KEY-----') && !key.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----')) {
      throw new Error('Invalid Firebase private key format. Ensure the private key contains a valid PEM (BEGIN PRIVATE KEY).');
    }

    privateKey = key;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey as string,
    }),
  });
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminApp = getAdminApp();
    adminDb = getFirestore(adminApp);
  }
  return adminDb;
}