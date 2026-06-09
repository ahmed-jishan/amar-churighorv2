import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Creates a new admin user (Auth + Firestore).
 * Only callable by an authenticated, non-suspended super_admin.
 * Uses Admin SDK server-side — never touches the caller's auth session.
 */
export const createAdminUser = functions.region('us-central1').https.onCall(
  async (data, context) => {
    // ── 1. Authentication check ──────────────────────────
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in.'
      );
    }

    // ── 2. Role check — Firestore থেকে verify করো ───────
    const callerDoc = await admin
      .firestore()
      .collection('admins')
      .doc(context.auth.uid)
      .get();

    if (!callerDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You are not an admin.'
      );
    }

    const callerData = callerDoc.data()!;

    if (callerData.isSuspended) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Your account is suspended.'
      );
    }

    if (callerData.role !== 'super_admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only Super Admins can create admins.'
      );
    }

    // ── 3. Input validation ──────────────────────────────
    const { name, email, password } = data as { name?: string; email?: string; password?: string };

    if (!name || !email || !password) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'name, email and password are required.'
      );
    }

    if (password.length < 6) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Password must be at least 6 characters.'
      );
    }

    // ── 4. Firebase Auth user তৈরি করো ──────────────────
    let newUser;
    try {
      newUser = await admin.auth().createUser({
        email: email.trim().toLowerCase(),
        password,
        displayName: name.trim(),
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'This email is already registered.'
        );
      }
      throw new functions.https.HttpsError('internal', err.message);
    }

    // ── 5. Firestore admin document তৈরি করো ────────────
    await admin.firestore().collection('admins').doc(newUser.uid).set({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'admin',
      isSuspended: false,
      createdAt: new Date().toISOString(),
    });

    // ── 6. Super Admin এর session touch করা হয়নি ────────
    return { success: true, uid: newUser.uid, message: 'Admin created successfully.' };
  }
);

/**
 * Deletes an admin user (Auth + Firestore).
 * Cannot delete self or a super_admin.
 */
export const deleteAdminUser = functions.region('us-central1').https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const callerDoc = await admin.firestore().collection('admins').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized.');
    }

    const callerData = callerDoc.data()!;
    if (callerData.role !== 'super_admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can delete admins.');
    }

    const { uid } = data as { uid?: string };
    if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Admin UID is required.');
    if (uid === context.auth.uid) throw new functions.https.HttpsError('invalid-argument', 'Cannot delete yourself.');

    const targetDoc = await admin.firestore().collection('admins').doc(uid).get();
    if (!targetDoc.exists) throw new functions.https.HttpsError('not-found', 'Admin not found.');
    if (targetDoc.data()!.role === 'super_admin') {
      throw new functions.https.HttpsError('permission-denied', 'Cannot delete a Super Admin.');
    }

    await admin.firestore().collection('admins').doc(uid).delete();
    await admin.auth().deleteUser(uid);
    return { success: true, message: 'Admin deleted.' };
  }
);

/**
 * Updates an admin user (name + displayName, and/or isSuspended).
 */
export const updateAdminUser = functions.region('us-central1').https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const callerDoc = await admin.firestore().collection('admins').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized.');
    }

    const callerData = callerDoc.data()!;
    if (callerData.role !== 'super_admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can update admins.');
    }

    const { uid, name, isSuspended } = data as { uid?: string; name?: string; isSuspended?: boolean };
    if (!uid) throw new functions.https.HttpsError('invalid-argument', 'Admin UID is required.');

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isSuspended !== undefined) updateData.isSuspended = isSuspended;

    await admin.firestore().collection('admins').doc(uid).update(updateData);
    if (name) await admin.auth().updateUser(uid, { displayName: name.trim() });

    return { success: true, message: 'Admin updated.' };
  }
);