/**
 * Analytics Tracking API Route — Server-side with Firebase Admin SDK
 *
 * Receives tracking events from AnalyticsTracker client component
 * and writes directly to Firestore using Admin SDK.
 * This avoids the client SDK being used server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/adminConfig';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTIONS = {
  visitorSessions: 'visitor_sessions',
  pageViews: 'page_views',
  dailyAnalytics: 'analytics_daily',
  monthlyAnalytics: 'analytics_monthly',
} as const;

// ─── Helpers ─────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function incrementCounters(fields: string[]) {
  const db = getAdminDb();
  const dateId = todayStr();
  const monthId = monthStr();

  const dailyUpdate: Record<string, unknown> = { date: dateId, updatedAt: nowISO() };
  const monthlyUpdate: Record<string, unknown> = { month: monthId, updatedAt: nowISO() };

  fields.forEach((f) => {
    dailyUpdate[f] = FieldValue.increment(1);
    monthlyUpdate[f] = FieldValue.increment(1);
  });

  await Promise.all([
    db.collection(COLLECTIONS.dailyAnalytics).doc(dateId).set(dailyUpdate, { merge: true }),
    db.collection(COLLECTIONS.monthlyAnalytics).doc(monthId).set(monthlyUpdate, { merge: true }),
  ]);
}

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

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await req.json();
    const { type } = body;
    const clientIP = maskIP(getClientIP(req));

    switch (type) {
      case 'session': {
        const now = nowISO();
        await db.collection(COLLECTIONS.visitorSessions).add({
          visitorId: body.visitorId ?? 'unknown',
          sessionId: body.sessionId ?? 'unknown',
          ip: clientIP,
          deviceType: body.deviceType ?? 'desktop',
          browser: body.browser ?? 'unknown',
          os: body.os ?? 'unknown',
          sessionStart: now,
          lastActivity: now,
          landingPage: body.landingPage ?? '/',
          referralSource: body.referralSource ?? 'direct',
          visitCount: body.visitCount ?? 1,
          isActive: true,
          createdAt: now,
        });
        await incrementCounters(['uniqueVisitors']);
        break;
      }

      case 'pageview': {
        const now = nowISO();
        await db.collection(COLLECTIONS.pageViews).add({
          visitorId: body.visitorId ?? 'unknown',
          sessionId: body.sessionId ?? 'unknown',
          pageUrl: body.pageUrl ?? '/',
          route: body.route ?? '/',
          pageTitle: body.pageTitle ?? '',
          timestamp: now,
        });
        await incrementCounters(['pageViews']);
        break;
      }

      case 'productview': {
        const now = nowISO();
        await db.collection('product_views').add({
          visitorId: body.visitorId ?? 'unknown',
          sessionId: body.sessionId ?? 'unknown',
          productId: body.productId ?? '',
          productName: body.productName ?? 'Unknown',
          productSlug: body.productSlug ?? '',
          timestamp: now,
        });
        await incrementCounters(['productViews']);
        break;
      }

      case 'heartbeat': {
        if (!body.sessionId) break;
        const snap = await db
          .collection(COLLECTIONS.visitorSessions)
          .where('sessionId', '==', body.sessionId)
          .limit(1)
          .get();
        if (!snap.empty) {
          await snap.docs[0].ref.set(
            { lastActivity: nowISO(), exitPage: body.currentPage ?? '/' },
            { merge: true }
          );
        }
        break;
      }

      case 'endsession': {
        if (!body.sessionId) break;
        const snap = await db
          .collection(COLLECTIONS.visitorSessions)
          .where('sessionId', '==', body.sessionId)
          .limit(1)
          .get();
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const duration = data.sessionStart
            ? Math.floor((Date.now() - new Date(data.sessionStart).getTime()) / 1000)
            : 0;
          await snap.docs[0].ref.set(
            { exitPage: body.exitPage ?? '/', duration, isActive: false, lastActivity: nowISO() },
            { merge: true }
          );
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // Always return success — tracking should never fail visible UX
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/track]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// ─── CORS Preflight ────────────────────────────────────────

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}