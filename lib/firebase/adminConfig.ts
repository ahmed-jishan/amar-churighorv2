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
      // Normalize private key robustly:
      // - Accept either a raw PEM, a quoted PEM, or a full service-account JSON string
      // - Handle double-escaped and single-escaped `\n` sequences
      // - Strip CR characters and surrounding quotes
      // - Validate presence of PEM header
      privateKey: (() => {
        let key = process.env.FIREBASE_PRIVATE_KEY || '';

        // If the env contains a full service account JSON, extract the private_key
        const trimmed = key.trim();
        if (trimmed.startsWith('{') && trimmed.includes('private_key')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed.private_key === 'string') {
              key = parsed.private_key;
            }
          } catch {
            // Fall through to normalization below
          }
        }

        // Remove surrounding quotes if present
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
          key = key.slice(1, -1);
        }

        // Convert double-escaped and escaped newlines to real newlines, remove CRs, trim
        key = key.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r/g, '').trim();

        // Basic validation: must contain PEM header
        if (!key.includes('-----BEGIN PRIVATE KEY-----') && !key.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----')) {
          throw new Error('Invalid Firebase private key format. Ensure FIREBASE_PRIVATE_KEY contains a valid PEM (BEGIN PRIVATE KEY).');
        }

        return key;
      })(),
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