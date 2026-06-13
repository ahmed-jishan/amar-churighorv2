/**
 * Order Notification API Route
 *
 * Sends both customer confirmation AND admin notification emails
 * after a successful order placement.
 *
 * This is a server-side-only API — API keys are never exposed to the frontend.
 * Email sending failure never breaks order creation (fire-and-forget).
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAllOrderEmails, isEmailConfigured } from '@/lib/email';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const {
      orderId,
      trackingToken,
      email,
      customerName,
      customerPhone,
      customerAltPhone,
      total,
      items,
      subtotal,
      deliveryCharge,
      district,
      area,
      address,
      notes,
      paymentMethod,
      orderStatus,
    } = await request.json();

    if (!orderId || !trackingToken || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, trackingToken, email' },
        { status: 400 }
      );
    }

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('[Email] SMTP credentials not configured.');
      return NextResponse.json(
        {
          success: false,
          error: 'Email service not configured',
          configMissing: true,
        },
        { status: 500 }
      );
    }

    // ── Send both customer confirmation + admin notification ──
    // Uses Promise.allSettled internally — never throws
    const results = await sendAllOrderEmails({
      customerEmail: email,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '',
      customerAltPhone,
      orderId,
      trackingToken,
      items: items || [],
      subtotal: subtotal || 0,
      deliveryCharge: deliveryCharge || 0,
      total: total || 0,
      address: address || '',
      district: district || '',
      area: area || '',
      notes,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      orderStatus: orderStatus || 'pending',
    });

    // ── Save email tracking info to Firestore (non-blocking) ──
    try {
      const q = query(
        collection(db, 'orders'),
        where('orderId', '==', orderId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const orderDoc = snap.docs[0];
        const now = new Date().toISOString();

        const emailInfo: Record<string, any> = {
          customer: {
            success: results.customer.success,
            sentAt: now,
            to: email,
            ...(results.customer.error ? { error: results.customer.error } : {}),
          },
          admin: {
            success: results.admin.success,
            sentAt: now,
            ...(results.admin.error ? { error: results.admin.error } : {}),
          },
        };

        await updateDoc(doc(db, 'orders', orderDoc.id), {
          emailSentAt: now,
          notificationSent: results.customer.success,
          emailInfo,
          // Track admin notification separately
          adminNotificationSent: results.admin.success,
          adminNotificationSentAt: results.admin.success ? now : null,
        });
      }
    } catch (firestoreErr) {
      // Don't fail if Firestore update fails — the emails were already sent
      console.error('[Email] Failed to save email tracking info to Firestore:', firestoreErr);
    }

    // Log results
    if (!results.customer.success) {
      console.error('[Email] Customer confirmation failed:', results.customer.error);
    }
    if (!results.admin.success) {
      console.error('[Email] Admin notification failed:', results.admin.error);
    }

    // Return overall result — consider success if at least customer email succeeded
    const overallSuccess = results.customer.success;
    const responseStatus = overallSuccess ? 200 : 500;

    return NextResponse.json(
      {
        success: overallSuccess,
        emailSent: overallSuccess,
        emailSentAt: new Date().toISOString(),
        details: {
          customer: results.customer,
          admin: results.admin,
        },
      },
      { status: responseStatus }
    );
  } catch (error) {
    console.error('[Email] notify-order API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}