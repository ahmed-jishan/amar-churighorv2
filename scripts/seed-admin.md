# Super Admin Setup Guide

After deploying, create the first Super Admin manually via Firebase Console:

## Step 1 — Create Auth User
1. Go to: Firebase Console → Authentication → Users → Add User
2. Enter email + password → Click "Add User"
3. Copy the generated **UID**

## Step 2 — Create Firestore Admin Document
1. Go to: Firebase Console → Firestore Database
2. Create collection: **admins**
3. Document ID = **the UID from Step 1**
4. Add these fields exactly:

| Field        | Type    | Value               |
|-------------|---------|---------------------|
| name         | string  | Your Name           |
| email        | string  | your@email.com      |
| role         | string  | super_admin         |
| isSuspended  | boolean | false               |
| createdAt    | string  | 2025-01-01T00:00:00 |

## Step 3 — Login
Visit **/login** and sign in with the credentials from Step 1.

After login, use **Settings → Admin Management** to create additional admins.
