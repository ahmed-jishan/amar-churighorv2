import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY || '');

interface SendOrderConfirmationParams {
  to: string;
  orderId: string;
  trackingToken: string;
  customerName: string;
  total: number;
}

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  trackingToken,
  customerName,
  total,
}: SendOrderConfirmationParams) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const trackingUrl = `${baseUrl}/track/${trackingToken}`;

  const { data, error } = await resend.emails.send({
    from: 'Amar Churighor <mgolam644@gmail.com>',
    to,
    subject: `Order Confirmed — ${orderId}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b2a2b; color: #e0e0e0; border-radius: 16px; overflow: hidden;">
        <div style="background: #d7ffa4; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #051a1b; font-size: 24px;">🎉 Order Confirmed!</h1>
          <p style="margin: 8px 0 0; color: #1f3334; font-size: 14px;">${orderId}</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="margin: 0 0 16px;">Hi <strong>${customerName}</strong>,</p>
          <p style="margin: 0 0 24px;">Your order <strong>${orderId}</strong> has been placed successfully. Total: <strong>৳${total.toFixed(2)}</strong></p>
          <a href="${trackingUrl}" style="display: inline-block; background: #d7ffa4; color: #051a1b; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
            📦 Track Your Order
          </a>
          <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">
            Or copy this link: <br/>
            <span style="color: #d7ffa4;">${trackingUrl}</span>
          </p>
          <hr style="border: none; border-top: 1px solid #1f3334; margin: 32px 0;" />
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            Amar Churighor — Premium Shopping in Bangladesh
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('Resend email error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}