import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY || '');

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
    } = await request.json();

    if (!orderId || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, customerEmail' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amarcurighor.vercel.app';
    const trackingUrl = `${baseUrl}/track-order?id=${orderId}`;
    const myOrdersUrl = `${baseUrl}/my-orders`;

    const itemsHtml = items
      .map(
        (item: any) =>
          `<tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px;">${item.name}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 14px; text-align: right;">৳${item.price.toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const { data, error } = await resend.emails.send({
      from: 'Amar Churighor <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Order Confirmed — ${orderId} | Amar Churighor`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <div style="background: #d7ffa4; padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: #051a1b; font-size: 24px;">🎉 Order Confirmed!</h1>
            <p style="margin: 8px 0 0; color: #1f3334; font-size: 14px;">${orderId}</p>
          </div>
          <div style="padding: 32px 24px; color: #333333;">
            <p style="margin: 0 0 16px; font-size: 16px;">Hi <strong>${customerName}</strong>,</p>
            <p style="margin: 0 0 24px; font-size: 15px;">
              Your order <strong style="color: #d7ffa4; background: #051a1b; padding: 2px 8px; border-radius: 4px;">${orderId}</strong> has been confirmed!
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px 12px; text-align: left; font-size: 13px; text-transform: uppercase; color: #666;">Item</th>
                  <th style="padding: 10px 12px; text-align: center; font-size: 13px; text-transform: uppercase; color: #666;">Qty</th>
                  <th style="padding: 10px 12px; text-align: right; font-size: 13px; text-transform: uppercase; color: #666;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="border-top: 2px solid #e0e0e0; padding-top: 16px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
                <span style="color: #666;">Subtotal</span>
                <span>৳${subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
                <span style="color: #666;">Delivery Charge</span>
                <span>৳${deliveryCharge.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                <span>Total</span>
                <span style="color: #051a1b;">৳${total.toFixed(2)}</span>
              </div>
            </div>

            <div style="background: #f9f9f9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #666;">📍 Delivery Location</p>
              <p style="margin: 0; font-size: 15px; font-weight: 600;">${area}, ${district}</p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${trackingUrl}" style="display: inline-block; background: #d7ffa4; color: #051a1b; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; border: 2px solid #051a1b;">
                📦 Track Your Order
              </a>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${myOrdersUrl}" style="color: #051a1b; font-size: 14px; text-decoration: underline;">
                Visit My Orders →
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />

            <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
              Amar Churighor &bull; <a href="https://amarcurighor.vercel.app" style="color: #051a1b;">amarcurighor.vercel.app</a>
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Send order email error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('send-order-email API error:', error);
    // Never fail the order — email failure is non-blocking
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}