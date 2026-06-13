import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { orderId, trackingToken, email, customerName, total } = await request.json();

    if (!orderId || !trackingToken || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, trackingToken, email' },
        { status: 400 }
      );
    }

    // Fire-and-forget — email failure should NEVER fail the order
    const result = await sendOrderConfirmationEmail({
      to: email,
      orderId,
      trackingToken,
      customerName: customerName || 'Valued Customer',
      total: total || 0,
    });

    if (!result.success) {
      console.error('Failed to send order notification email:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('notify-order API error:', error);
    // Always return success to the client — email failure shouldn't break UX
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}