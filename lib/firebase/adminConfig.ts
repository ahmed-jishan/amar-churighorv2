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

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    throw new Error(
      'Missing Firebase Admin environment variables. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
    );
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace \n in private key (Vercel/env issue)
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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