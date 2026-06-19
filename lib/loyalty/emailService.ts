// ──────────────────────────────────────────────────────────────────
// Loyalty Reward Email Service
// Reuses existing email infrastructure (Nodemailer via lib/email.ts)
// ──────────────────────────────────────────────────────────────────

import type { CustomerReward } from './types';

/**
 * Send a reward unlock email to the customer.
 * This reuses the existing email transporter from lib/email.ts.
 */
export async function sendRewardUnlockEmail(reward: CustomerReward): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amarcurighor.vercel.app';
    const offersUrl = `${baseUrl}/offers`;

    const discountText = reward.discountType === 'percentage'
      ? `${reward.discountValue}% OFF`
      : `৳${reward.discountValue} OFF`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #051a1b 0%, #0d3d3e 100%); padding: 32px; text-align: center; }
    .header h1 { color: #d7ffa4; font-size: 24px; margin: 0 0 8px; }
    .header p { color: #a0a0a0; font-size: 14px; margin: 0; }
    .reward-section { padding: 32px; text-align: center; }
    .reward-badge { display: inline-block; background: linear-gradient(135deg, #d7ffa4, #a8e063); color: #051a1b; padding: 8px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-bottom: 16px; }
    .coupon-code { background: #f0fdf4; border: 2px dashed #d7ffa4; border-radius: 12px; padding: 16px 32px; font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #051a1b; margin: 16px 0; display: inline-block; font-family: 'Courier New', monospace; }
    .discount-value { font-size: 36px; font-weight: 900; color: #051a1b; margin: 8px 0; }
    .details { padding: 0 32px 24px; }
    .details p { color: #666; font-size: 14px; line-height: 1.6; text-align: center; }
    .cta-button { display: inline-block; background: #051a1b; color: #d7ffa4; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 16px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #eee; text-align: center; }
    .footer p { color: #999; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>🎉 Congratulations!</h1>
        <p>You've unlocked an exclusive customer reward</p>
      </div>
      <div class="reward-section">
        <div class="reward-badge">${reward.campaignName}</div>
        <div class="discount-value">${discountText}</div>
        <p style="color:#666;font-size:14px;margin:8px 0;">on your next purchase</p>
        <div class="coupon-code">${reward.couponCode}</div>
        <p style="color:#999;font-size:13px;margin:12px 0;">Use this coupon code during checkout</p>
        <a href="${offersUrl}" class="cta-button">Shop Now</a>
      </div>
      <div class="details">
        <p>
          This reward is valid until <strong>${new Date(reward.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.<br>
          Simply enter the coupon code at checkout to apply your discount.
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Amar Churighor. All rights reserved.</p>
        <p>This email was sent to ${reward.email} regarding your loyalty reward.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Send via API to avoid server-side Nodemailer dependency in client context
    // Use window.location.origin when running in browser, fall back to env var
    const isClient = typeof window !== 'undefined';
    const baseUrlForApi = isClient
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrlForApi}/api/send-reward-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: reward.email,
        subject: `🎉 You've unlocked a reward! ${reward.couponCode} | Amar Churighor`,
        html,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('[Loyalty Email] Failed to send reward email:', error.message);
    return { success: false, error: error.message };
  }
}