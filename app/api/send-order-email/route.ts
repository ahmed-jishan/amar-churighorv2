/**
 * Legacy email API — delegates to notify-order internally.
 * Kept for backward compatibility but all new code should use /api/notify-order directly.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail, isEmailConfigured } from '@/lib/email';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const {
      orderId,
      customerName,
      customerEmail,
      items,
      subtotal,
      deliveryCharge,
      total,
      district,
      area,
      address,
      phone,
      trackingToken,
    } = await request.json();

    if (!orderId || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, customerEmail' },
        { status: 400 }
      );
    }

    // If trackingToken is provided, use it; otherwise fetch from Firestore
    let resolvedToken = trackingToken;
    if (!resolvedToken) {
      try {
        const q = query(
          collection(db, 'orders'),
          where('orderId', '==', orderId),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          resolvedToken = data.trackingToken;
        }
      } catch {
        // Non-blocking — token will be missing but email still goes out
      }
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const result = await sendOrderConfirmationEmail({
      to: customerEmail,
      orderId,
      trackingToken: resolvedToken || orderId,
      customerName: customerName || 'Valued Customer',
      total: total || 0,
      items: items || [],
      subtotal: subtotal || 0,
      deliveryCharge: deliveryCharge || 0,
      district,
      area,
      address,
      phone,
    });

    // Save email tracking to Firestore (non-blocking)
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
        if (result.success) {
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            emailSentAt: now,
            notificationSent: true,
            emailInfo: {
              success: true,
              sentAt: now,
              to: customerEmail,
            },
          });
        } else {
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            emailInfo: {
              success: false,
              error: result.error,
              sentAt: now,
              to: customerEmail,
            },
          });
        }
      }
    } catch (firestoreErr) {
      console.error('Failed to save email tracking:', firestoreErr);
    }

    if (result.error) {
      console.error('Send order email error:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data, emailSent: true });
  } catch (error) {
    console.error('send-order-email API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}