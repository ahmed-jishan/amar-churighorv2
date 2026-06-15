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
  // If header contains a list, take the first IP
  if (ip.includes(',')) ip = ip.split(',')[0].trim();

  // IPv4 (mask last octet)
  const ipv4Match = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (ipv4Match) return `${ipv4Match[1]}.0`;

  // IPv6 handling
  if (ip.includes(':')) {
    // Common loopback forms: map IPv6 loopback to IPv4 localhost for readability
    if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return '127.0.0.1';

    // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1 -> mask as IPv4
    const v4mapped = ip.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
    if (v4mapped) {
      const v4 = v4mapped[1].match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
      if (v4) return `${v4[1]}.0`;
      return '::ffff:0.0.0.0';
    }

    // Generic IPv6: keep first 2-3 hextets and append '::' (avoid producing '::1::')
    const parts = ip.split(':').filter(Boolean);
    const take = Math.min(3, parts.length);
    if (parts.length === 0) return '::';
    return parts.slice(0, take).join(':') + '::';
  }

  return ip;
}

// ─── Helper: Geo lookup (best-effort with full fields) ───────
async function lookupGeoForIP(ip: string) {
  try {
    // ip-api.com free tier — requesting ALL available fields
    // Docs: https://ip-api.com/docs/api:json
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.status === 'success') {
      return {
        country: data.country || null,
        countryCode: data.countryCode || null,
        region: data.regionName || null,
        regionCode: data.region || null,
        district: data.district || null,
        city: data.city || null,
        postalCode: data.zip || null,
        lat: typeof data.lat === 'number' ? data.lat : null,
        lon: typeof data.lon === 'number' ? data.lon : null,
        timezone: data.timezone || null,
        isp: data.isp || null,
        org: data.org || null,
        as: data.as || null,
        isMobile: typeof data.mobile === 'boolean' ? data.mobile : null,
        isProxy: typeof data.proxy === 'boolean' ? data.proxy : null,
        isHosting: typeof data.hosting === 'boolean' ? data.hosting : null,
      };
    }
  } catch (err) {
    // silent fail
  }
  return null;
}

// ─── POST /api/track ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await req.json();
    const { type } = body;
    const rawClientIP = getClientIP(req);
    const maskedClientIP = maskIP(rawClientIP);
    // perform best-effort geo lookup using the raw IP (do not store raw IP)
    const geo = await lookupGeoForIP(rawClientIP);

    switch (type) {
      case 'session': {
        const now = nowISO();

        // ─── Build location data from IP geo + optional GPS ────
        const sessionData: Record<string, any> = {
          visitorId: body.visitorId ?? 'unknown',
          sessionId: body.sessionId ?? 'unknown',
          ip: maskedClientIP,
          ipRaw: rawClientIP,
          // IP-based geo (from ip-api.com, server-side)
          country: geo?.country ?? null,
          countryCode: geo?.countryCode ?? null,
          region: geo?.region ?? null,
          regionCode: geo?.regionCode ?? null,
          district: geo?.district ?? null,
          city: geo?.city ?? null,
          postalCode: geo?.postalCode ?? null,
          lat: geo?.lat ?? null,
          lon: geo?.lon ?? null,
          timezone: geo?.timezone ?? null,
          isp: geo?.isp ?? null,
          org: geo?.org ?? null,
          as: geo?.as ?? null,
          isMobile: geo?.isMobile ?? null,
          isProxy: geo?.isProxy ?? null,
          isHosting: geo?.isHosting ?? null,
          // GPS-based location (from browser, client-side)
          gpsLat: body.gpsLat ?? null,
          gpsLon: body.gpsLon ?? null,
          gpsAccuracy: body.gpsAccuracy ?? null,
          streetAddress: body.streetAddress ?? null,
          road: body.road ?? null,
          houseNumber: body.houseNumber ?? null,
          suburb: body.suburb ?? null,
          isGpsLocation: body.isGpsLocation ?? false,
          // Device info
          deviceType: body.deviceType ?? 'desktop',
          browser: body.browser ?? 'unknown',
          os: body.os ?? 'unknown',
          // Session info
          sessionStart: now,
          lastActivity: now,
          landingPage: body.landingPage ?? '/',
          referralSource: body.referralSource ?? 'direct',
          visitCount: body.visitCount ?? 1,
          isActive: true,
          createdAt: now,
        };

        await db.collection(COLLECTIONS.visitorSessions).add(sessionData);
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
            { lastActivity: nowISO(), exitPage: body.currentPage ?? '/', ip: maskedClientIP, ipRaw: rawClientIP, geo: geo, country: geo?.country ?? null, region: geo?.region ?? null, city: geo?.city ?? null, lat: geo?.lat ?? null, lon: geo?.lon ?? null, timezone: geo?.timezone ?? null },
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
            { exitPage: body.exitPage ?? '/', duration, isActive: false, lastActivity: nowISO(), lastIP: maskedClientIP, lastIPRaw: rawClientIP, lastGeo: geo, country: geo?.country ?? null, region: geo?.region ?? null, city: geo?.city ?? null, lat: geo?.lat ?? null, lon: geo?.lon ?? null, timezone: geo?.timezone ?? null },
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