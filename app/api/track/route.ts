/**
 * Analytics Tracking API Route
 * 
 * Receives async tracking events from the client-side tracker.
 * All writes are fire-and-forget to avoid blocking the client.
 * IP addresses are masked for privacy.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  trackSession,
  trackPageView,
  trackProductView,
  touchSession,
  endSession,
} from '@/lib/analytics/service';

// ─── Request body types ────────────────────────────────────

interface TrackSessionBody {
  type: 'session';
  visitorId: string;
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  landingPage: string;
  referralSource: string;
  visitCount: number;
}

interface TrackPageViewBody {
  type: 'pageview';
  visitorId: string;
  sessionId: string;
  pageUrl: string;
  route: string;
  pageTitle?: string;
}

interface TrackProductViewBody {
  type: 'productview';
  visitorId: string;
  sessionId: string;
  productId: string;
  productName: string;
  productSlug?: string;
}

interface TrackHeartbeatBody {
  type: 'heartbeat';
  sessionId: string;
  currentPage: string;
}

interface TrackEndSessionBody {
  type: 'endsession';
  sessionId: string;
  exitPage: string;
}

type TrackBody = TrackSessionBody | TrackPageViewBody | TrackProductViewBody | TrackHeartbeatBody | TrackEndSessionBody;

// ─── Helper: Get client IP ─────────────────────────────────

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '0.0.0.0';
}

// ─── Helper: Mask IP ───────────────────────────────────────

function maskIP(ip: string): string {
  if (!ip) return '';
  const ipv4Match = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (ipv4Match) return `${ipv4Match[1]}.0`;
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 4).join(':') + '::';
  }
  return ip;
}

// ─── POST /api/track ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: TrackBody = await request.json();
    const clientIP = maskIP(getClientIP(request));

    switch (body.type) {
      case 'session': {
        const data = body as TrackSessionBody;
        // Fire and forget — do not await
        trackSession({
          visitorId: data.visitorId,
          sessionId: data.sessionId,
          ip: clientIP,
          deviceType: data.deviceType as any,
          browser: data.browser as any,
          os: data.os as any,
          sessionStart: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          landingPage: data.landingPage,
          referralSource: data.referralSource,
          visitCount: data.visitCount,
          isActive: true,
        }).catch(() => {});
        break;
      }

      case 'pageview': {
        const data = body as TrackPageViewBody;
        trackPageView({
          visitorId: data.visitorId,
          sessionId: data.sessionId,
          pageUrl: data.pageUrl,
          route: data.route,
          pageTitle: data.pageTitle,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
        break;
      }

      case 'productview': {
        const data = body as TrackProductViewBody;
        trackProductView({
          visitorId: data.visitorId,
          sessionId: data.sessionId,
          productId: data.productId,
          productName: data.productName,
          productSlug: data.productSlug,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
        break;
      }

      case 'heartbeat': {
        const data = body as TrackHeartbeatBody;
        touchSession(data.sessionId, data.currentPage).catch(() => {});
        break;
      }

      case 'endsession': {
        const data = body as TrackEndSessionBody;
        endSession(data.sessionId, data.exitPage).catch(() => {});
        break;
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown event type' }, { status: 400 });
    }

    // Always return success — tracking should never fail visible UX
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics Track] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── CORS Preflight ────────────────────────────────────────

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}