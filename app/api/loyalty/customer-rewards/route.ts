// ──────────────────────────────────────────────────────────────────
// API: Fetch customer rewards by email + phone
// Used by offers page, checkout, and navbar notification
// ──────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { findCustomerByEmailPhone, getAvailableRewards, getRewardById } from '@/lib/loyalty/customerService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    const available = await getAvailableRewards(email, phone);

    return NextResponse.json({
      success: true,
      rewards: available.map(r => ({
        id: r.id,
        couponCode: r.couponCode,
        discountType: r.discountType,
        discountValue: r.discountValue,
        campaignName: r.campaignName,
        expiresAt: r.expiresAt,
        unlockedAt: r.unlockedAt,
      })),
      count: available.length,
    });
  } catch (error: any) {
    console.error('[Loyalty API] customer-rewards error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, couponCode } = body;

    if (!email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    const available = await getAvailableRewards(email, phone);

    if (couponCode) {
      const matched = available.find(r => r.couponCode === couponCode.toUpperCase().trim());
      return NextResponse.json({
        success: true,
        valid: !!matched,
        reward: matched ? {
          id: matched.id,
          couponCode: matched.couponCode,
          discountType: matched.discountType,
          discountValue: matched.discountValue,
          campaignName: matched.campaignName,
          expiresAt: matched.expiresAt,
        } : null,
      });
    }

    return NextResponse.json({
      success: true,
      rewards: available.map(r => ({
        id: r.id,
        couponCode: r.couponCode,
        discountType: r.discountType,
        discountValue: r.discountValue,
        campaignName: r.campaignName,
        expiresAt: r.expiresAt,
      })),
      count: available.length,
    });
  } catch (error: any) {
    console.error('[Loyalty API] customer-rewards POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}