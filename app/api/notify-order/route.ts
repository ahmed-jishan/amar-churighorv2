/**
 * Order Notification API Route
 *
 * Sends both customer confirmation AND admin notification emails
 * after a successful order placement.
 *
 * This is a server-side-only API — API keys are never exposed to the frontend.
 * Email sending failure never breaks order creation (fire-and-forget).
 *
 * Respects admin-configured email toggles from Firestore EmailConfig.
 * - userGetEmail: send customer confirmation email
 * - adminGetEmail: send admin notification email
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAllOrderEmails, isEmailConfigured, sendOrderConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';
import { getEmailConfig, EmailConfig } from '@/lib/firebase/settings';
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

    // ── Read email configuration from Firestore ──
    let emailConfig: EmailConfig;
    try {
      emailConfig = await getEmailConfig();
    } catch {
      emailConfig = { userGetEmail: true, adminGetEmail: true };
    }

    const userEmailEnabled = emailConfig.userGetEmail;
    const adminEmailEnabled = emailConfig.adminGetEmail;

    // Check if email is configured (SMTP)
    const smtpConfigured = isEmailConfigured();

    // ── Track results ──
    let customerResult: { success: boolean; error?: string } = { success: false, error: 'Email service disabled by admin' };
    let adminResult: { success: boolean; error?: string } = { success: false, error: 'Email service disabled by admin' };

    // ── Send customer confirmation email (if enabled) ──
    if (userEmailEnabled) {
      if (!smtpConfigured) {
        console.warn('[Email] SMTP credentials not configured.');
        customerResult = { success: false, error: 'Email service not configured' };
      } else {
        const result = await sendOrderConfirmationEmail({
          to: email,
          orderId,
          trackingToken,
          customerName: customerName || 'Valued Customer',
          total: total || 0,
          items: (items || []).map((i: any) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            image: i.image,
            selectedSize: (i as any).selectedSize,
          })),
          subtotal: subtotal || 0,
          deliveryCharge: deliveryCharge || 0,
          district,
          area,
          address,
          phone: customerPhone || '',
          customerEmail: email,
          paymentMethod: paymentMethod || 'Cash on Delivery',
          orderStatus: orderStatus || 'pending',
        });
        customerResult = { success: result.success, error: result.error || undefined };
      }
    } else {
      console.log('[Email] Customer email disabled by admin config. Skipping.');
    }

    // ── Send admin notification email (if enabled) ──
    if (adminEmailEnabled) {
      if (!smtpConfigured) {
        console.warn('[Email] SMTP credentials not configured.');
        adminResult = { success: false, error: 'Email service not configured' };
      } else {
        const result = await sendAdminNotificationEmail({
          orderId,
          trackingToken,
          customerName: customerName || 'Valued Customer',
          customerEmail: email,
          customerPhone: customerPhone || '',
          customerAltPhone,
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
        adminResult = { success: result.success, error: result.error || undefined };
      }
    } else {
      console.log('[Email] Admin email disabled by admin config. Skipping.');
    }

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
            success: customerResult.success,
            sentAt: now,
            to: email,
            ...(customerResult.error ? { error: customerResult.error } : {}),
          },
          admin: {
            success: adminResult.success,
            sentAt: now,
            ...(adminResult.error ? { error: adminResult.error } : {}),
          },
        };

        await updateDoc(doc(db, 'orders', orderDoc.id), {
          emailSentAt: now,
          notificationSent: customerResult.success,
          emailInfo,
          adminNotificationSent: adminResult.success,
          adminNotificationSentAt: adminResult.success ? now : null,
        });
      }
    } catch (firestoreErr) {
      // Don't fail if Firestore update fails — the emails were already sent
      console.error('[Email] Failed to save email tracking info to Firestore:', firestoreErr);
    }

    // Log results
    if (!customerResult.success) {
      console.error('[Email] Customer confirmation failed:', customerResult.error);
    }
    if (!adminResult.success) {
      console.error('[Email] Admin notification failed:', adminResult.error);
    }

    // Return overall result — consider success if at least customer email succeeded (or was intentionally skipped)
    const overallSuccess = userEmailEnabled ? customerResult.success : true;
    const responseStatus = overallSuccess ? 200 : 500;

    return NextResponse.json(
      {
        success: overallSuccess,
        emailSent: customerResult.success,
        emailSentAt: new Date().toISOString(),
        details: {
          customer: { ...customerResult, disabled: !userEmailEnabled },
          admin: { ...adminResult, disabled: !adminEmailEnabled },
        },
        config: {
          userGetEmail: userEmailEnabled,
          adminGetEmail: adminEmailEnabled,
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