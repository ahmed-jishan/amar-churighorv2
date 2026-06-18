// ──────────────────────────────────────────────────────────────────
// API: Process loyalty rewards after a delivered order
// Called internally when order status changes to 'delivered'
// ──────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { processLoyaltyAfterDelivery } from '@/lib/loyalty/customerService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, orderTotal, orderCreatedAt } = body;

    if (!email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    const result = await processLoyaltyAfterDelivery(
      email,
      phone,
      orderTotal || 0,
      orderCreatedAt || new Date().toISOString()
    );

    return NextResponse.json({
      success: true,
      profile: {
        completedOrders: result.profile.completedOrders,
        totalSpent: result.profile.totalSpent,
      },
      rewardUnlocked: result.reward !== null,
      reward: result.reward
        ? {
            id: result.reward.id,
            couponCode: result.reward.couponCode,
            discountType: result.reward.discountType,
            discountValue: result.reward.discountValue,
            campaignName: result.reward.campaignName,
            expiresAt: result.reward.expiresAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error('[Loyalty API] process-delivery error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}