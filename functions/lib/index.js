"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminUser = exports.deleteAdminUser = exports.createAdminUser = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
/**
 * Creates a new admin user (Auth + Firestore).
 * Only callable by an authenticated, non-suspended super_admin.
 * Uses Admin SDK server-side — never touches the caller's auth session.
 */
exports.createAdminUser = functions.https.onCall({ region: 'us-central1', enforceAppCheck: false }, async (request) => {
    // ── 1. Authentication check ──────────────────────────
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    // ── 2. Role check — Firestore থেকে verify করো ───────
    const callerDoc = await admin
        .firestore()
        .collection('admins')
        .doc(request.auth.uid)
        .get();
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'You are not an admin.');
    }
    const callerData = callerDoc.data();
    if (callerData.isSuspended) {
        throw new functions.https.HttpsError('permission-denied', 'Your account is suspended.');
    }
    if (callerData.role !== 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can create admins.');
    }
    // ── 3. Input validation ──────────────────────────────
    const { name, email, password } = request.data;
    if (!name || !email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'name, email and password are required.');
    }
    if (password.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
    }
    // ── 4. Firebase Auth user তৈরি করো ──────────────────
    let newUser;
    try {
        newUser = await admin.auth().createUser({
            email: email.trim().toLowerCase(),
            password,
            displayName: name.trim(),
        });
    }
    catch (err) {
        if (err.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'This email is already registered.');
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
});
/**
 * Deletes an admin user (Auth + Firestore).
 * Cannot delete self or a super_admin.
 */
exports.deleteAdminUser = functions.https.onCall({ region: 'us-central1', enforceAppCheck: false }, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const callerDoc = await admin.firestore().collection('admins').doc(request.auth.uid).get();
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized.');
    }
    const callerData = callerDoc.data();
    if (callerData.role !== 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can delete admins.');
    }
    const { uid } = request.data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'Admin UID is required.');
    if (uid === request.auth.uid)
        throw new functions.https.HttpsError('invalid-argument', 'Cannot delete yourself.');
    const targetDoc = await admin.firestore().collection('admins').doc(uid).get();
    if (!targetDoc.exists)
        throw new functions.https.HttpsError('not-found', 'Admin not found.');
    if (targetDoc.data().role === 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Cannot delete a Super Admin.');
    }
    await admin.firestore().collection('admins').doc(uid).delete();
    await admin.auth().deleteUser(uid);
    return { success: true, message: 'Admin deleted.' };
});
/**
 * Updates an admin user (name + displayName, and/or isSuspended).
 */
exports.updateAdminUser = functions.https.onCall({ region: 'us-central1', enforceAppCheck: false }, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const callerDoc = await admin.firestore().collection('admins').doc(request.auth.uid).get();
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Not authorized.');
    }
    const callerData = callerDoc.data();
    if (callerData.role !== 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only Super Admins can update admins.');
    }
    const { uid, name, isSuspended } = request.data;
    if (!uid)
        throw new functions.https.HttpsError('invalid-argument', 'Admin UID is required.');
    const updateData = {};
    if (name !== undefined)
        updateData.name = name.trim();
    if (isSuspended !== undefined)
        updateData.isSuspended = isSuspended;
    await admin.firestore().collection('admins').doc(uid).update(updateData);
    if (name)
        await admin.auth().updateUser(uid, { displayName: name.trim() });
    return { success: true, message: 'Admin updated.' };
});
//# sourceMappingURL=index.js.map