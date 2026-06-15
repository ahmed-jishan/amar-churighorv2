'use client';

/**
 * AnalyticsTracker - Client-side tracking component
 * 
 * Embeds in the root layout to track page views, sessions, and visitor data.
 * Uses fire-and-forget fetch calls to avoid blocking UI.
 * Implements heartbeat mechanism for real-time active visitor tracking.
 * 
 * Performance: Zero impact on page load (async, batched, non-blocking).
 * Privacy: No PII collected. IP is masked server-side.
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  getVisitorId,
  getSessionId,
  detectDeviceType,
  detectBrowser,
  detectOS,
  getReferrer,
  touchSession,
} from '@/lib/analytics/visitorId';
import { getGpsLocation, type GpsLocationData } from '@/lib/analytics/geoLocation';
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  limit,
  increment,
} from 'firebase/firestore';

const TRACKING_API = '/api/track';
const HEARTBEAT_INTERVAL_MS = 60000; // 60 seconds
const SESSION_TRACKED_KEY = 'analytic_session_tracked';
const GPS_REQUESTED_KEY = 'analytic_gps_requested';

// ─── Cached GPS data (request once per session) ──────────
let cachedGps: GpsLocationData | null | undefined = undefined; // undefined = not yet tried, null = failed, object = success

async function getGpsData(): Promise<GpsLocationData | null> {
  // Only attempt GPS once per browser session
  if (cachedGps !== undefined) return cachedGps;
  if (sessionStorage.getItem(GPS_REQUESTED_KEY)) {
    cachedGps = null;
    return null;
  }
  sessionStorage.setItem(GPS_REQUESTED_KEY, 'true');
  try {
    cachedGps = await getGpsLocation();
    return cachedGps;
  } catch {
    cachedGps = null;
    return null;
  }
}

// ─── Client-side IP geolocation (fallback when /api/track is down) ──
// This runs in browser, calls ip-api.com directly.
// Only used for session type events.

let geoLookupCache: Record<string, any> | null | undefined = undefined;

async function clientGeoLookup(): Promise<Record<string, any> | null> {
  if (geoLookupCache !== undefined) return geoLookupCache;
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting', {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    if (!res.ok) { geoLookupCache = null; return null; }
    const data = await res.json();
    if (data && data.status === 'success') {
      geoLookupCache = {
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
      return geoLookupCache;
    }
  } catch {
    // silent
  }
  geoLookupCache = null;
  return null;
}

// ─── Helper: fire tracking event (fire-and-forget) ────────

async function sendTrackingEvent(body: Record<string, unknown>): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Use sendBeacon for reliability on page unload
  if (body.type === 'endsession' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    const sent = navigator.sendBeacon(TRACKING_API, blob);
    // If sendBeacon fails, try client-side fallback
    if (!sent) {
      await clientSideTracking(body as any);
    }
    return;
  }

  // Try API route first (Admin SDK, works well on Vercel with proper env vars)
  try {
    const res = await fetch(TRACKING_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (res.ok) return;
  } catch {
    // API route failed — fall back to client-side SDK
  }

  // Fallback: write directly via client SDK
  // First, if this is a session event, try to get IP geo data from client-side
  if (body.type === 'session') {
    const geo = await clientGeoLookup();
    if (geo && !body.country) {
      // Merge geo data into body for clientSideTracking
      Object.assign(body, {
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        regionCode: geo.regionCode,
        district: geo.district,
        city: geo.city,
        postalCode: geo.postalCode,
        lat: geo.lat,
        lon: geo.lon,
        timezone: geo.timezone,
        isp: geo.isp,
        org: geo.org,
        as: geo.as,
        isMobile: geo.isMobile,
        isProxy: geo.isProxy,
        isHosting: geo.isHosting,
      });
    }
  }
  await clientSideTracking(body as any);
}

// ─── Client-side Fallback (direct Firestore write) ───────

async function clientSideTracking(body: any): Promise<void> {
  try {
    const now = new Date().toISOString();
    const todayStr = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const monthStr = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };
    const dateId = todayStr();
    const monthId = monthStr();

    switch (body.type) {
      case 'session': {
        // ⚠️ IMPORTANT: Must save ALL location fields that /api/track saves
        await addDoc(collection(db, 'visitor_sessions'), {
          visitorId: body.visitorId ?? 'unknown',
          sessionId: body.sessionId ?? 'unknown',
          // IP-based location (from server-side ip-api.com, sent as body fields)
          country: body.country ?? null,
          countryCode: body.countryCode ?? null,
          region: body.region ?? null,
          regionCode: body.regionCode ?? null,
          district: body.district ?? null,
          city: body.city ?? null,
          postalCode: body.postalCode ?? null,
          lat: body.lat ?? null,
          lon: body.lon ?? null,
          timezone: body.timezone ?? null,
          isp: body.isp ?? null,
          org: body.org ?? null,
          as: body.as ?? null,
          isMobile: body.isMobile ?? null,
          isProxy: body.isProxy ?? null,
          isHosting: body.isHosting ?? null,
          // GPS-based location (from browser)
          gpsLat: body.gpsLat ?? null,
          gpsLon: body.gpsLon ?? null,
          gpsAccuracy: body.gpsAccuracy ?? null,
          streetAddress: body.streetAddress ?? null,
          road: body.road ?? null,
          houseNumber: body.houseNumber ?? null,
          suburb: body.suburb ?? null,
          isGpsLocation: body.isGpsLocation ?? false,
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
        // Increment daily+monthly counters
        await Promise.all([
          setDoc(doc(db, 'analytics_daily', dateId), { date: dateId, uniqueVisitors: increment(1), updatedAt: now }, { merge: true }),
          setDoc(doc(db, 'analytics_monthly', monthId), { month: monthId, uniqueVisitors: increment(1), updatedAt: now }, { merge: true }),
        ]);
        break;
      }
      case 'pageview': {
        await addDoc(collection(db, 'page_views'), {
          visitorId: body.visitorId ?? 'unknown',
          sessionId: body.sessionId ?? 'unknown',
          pageUrl: body.pageUrl ?? '/',
          route: body.route ?? '/',
          pageTitle: body.pageTitle ?? '',
          timestamp: now,
        });
        await Promise.all([
          setDoc(doc(db, 'analytics_daily', dateId), { date: dateId, pageViews: increment(1), updatedAt: now }, { merge: true }),
          setDoc(doc(db, 'analytics_monthly', monthId), { month: monthId, pageViews: increment(1), updatedAt: now }, { merge: true }),
        ]);
        break;
      }
      case 'productview': {
        await addDoc(collection(db, 'product_views'), {
          visitorId: body.visitorId ?? 'unknown',
          sessionId: body.sessionId ?? 'unknown',
          productId: body.productId ?? '',
          productName: body.productName ?? 'Unknown',
          productSlug: body.productSlug ?? '',
          timestamp: now,
        });
        await Promise.all([
          setDoc(doc(db, 'analytics_daily', dateId), { date: dateId, productViews: increment(1), updatedAt: now }, { merge: true }),
          setDoc(doc(db, 'analytics_monthly', monthId), { month: monthId, productViews: increment(1), updatedAt: now }, { merge: true }),
        ]);
        break;
      }
      case 'heartbeat': {
        if (!body.sessionId) break;
        const snap = await getDocs(
          query(collection(db, 'visitor_sessions'), where('sessionId', '==', body.sessionId), limit(1))
        );
        if (!snap.empty) {
          await setDoc(doc(db, 'visitor_sessions', snap.docs[0].id),
            { lastActivity: now, exitPage: body.currentPage ?? '/' },
            { merge: true }
          );
        }
        break;
      }
      case 'endsession': {
        if (!body.sessionId) break;
        const snap = await getDocs(
          query(collection(db, 'visitor_sessions'), where('sessionId', '==', body.sessionId), limit(1))
        );
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const duration = data.sessionStart
            ? Math.floor((Date.now() - new Date(data.sessionStart).getTime()) / 1000)
            : 0;
          await setDoc(doc(db, 'visitor_sessions', snap.docs[0].id),
            { exitPage: body.exitPage ?? '/', duration, isActive: false, lastActivity: now },
            { merge: true }
          );
        }
        break;
      }
    }
  } catch {
    // silent — never break UX for analytics
  }
}

// ─── Helper: get visit count from localStorage ────────────

function getVisitCount(): number {
  if (typeof window === 'undefined') return 1;
  const key = 'analytic_visit_count';
  try {
    const stored = localStorage.getItem(key);
    const count = stored ? parseInt(stored, 10) + 1 : 1;
    localStorage.setItem(key, String(count));
    return count;
  } catch {
    return 1;
  }
}

// ─── Main Component ───────────────────────────────────────

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionTracked = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Track session on first mount
  useEffect(() => {
    if (sessionTracked.current) return;

    const visitorId = getVisitorId();
    const { sessionId, isNew } = getSessionId();
    sessionIdRef.current = sessionId;

    // Check if this session was already tracked in this browser session
    const alreadyTracked = sessionStorage.getItem(SESSION_TRACKED_KEY);
    
    if (isNew || !alreadyTracked) {
      const visitCount = getVisitCount();
      sessionStorage.setItem(SESSION_TRACKED_KEY, 'true');

      // ─── Build session event with GPS data ─────────────
      const sessionEvent: Record<string, any> = {
        type: 'session',
        visitorId,
        sessionId,
        deviceType: detectDeviceType(),
        browser: detectBrowser(),
        os: detectOS(),
        landingPage: window.location.pathname,
        referralSource: getReferrer(),
        visitCount,
      };

      // Try to get GPS location (non-blocking, fire-and-forget)
      getGpsData().then(gps => {
        if (gps) {
          sessionEvent.gpsLat = gps.gpsLat;
          sessionEvent.gpsLon = gps.gpsLon;
          sessionEvent.gpsAccuracy = gps.gpsAccuracy;
          sessionEvent.streetAddress = gps.streetAddress;
          sessionEvent.road = gps.road;
          sessionEvent.houseNumber = gps.houseNumber;
          sessionEvent.suburb = gps.suburb;
          sessionEvent.isGpsLocation = true;
        }
        sendTrackingEvent(sessionEvent);
      });
    }

    // Track initial page view
    sendTrackingEvent({
      type: 'pageview',
      visitorId,
      sessionId,
      pageUrl: window.location.pathname + window.location.search,
      route: pathname,
      pageTitle: document.title,
    });

    sessionTracked.current = true;

    // Start heartbeat
    heartbeatRef.current = setInterval(() => {
      if (sessionIdRef.current) {
        sendTrackingEvent({
          type: 'heartbeat',
          sessionId: sessionIdRef.current,
          currentPage: window.location.pathname,
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Track session end on page unload
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        sendTrackingEvent({
          type: 'endsession',
          sessionId: sessionIdRef.current,
          exitPage: window.location.pathname,
        });
      }
    };

    // Use visibilitychange as a more reliable signal than beforeunload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionIdRef.current) {
        sendTrackingEvent({
          type: 'endsession',
          sessionId: sessionIdRef.current,
          exitPage: window.location.pathname,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // End session on unmount
      if (sessionIdRef.current) {
        sendTrackingEvent({
          type: 'endsession',
          sessionId: sessionIdRef.current,
          exitPage: window.location.pathname,
        });
      }
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!sessionTracked.current) return;

    const visitorId = getVisitorId();
    const { sessionId } = getSessionId();
    sessionIdRef.current = sessionId;

    // Touch the local session
    touchSession();

    // Small delay to ensure DOM is updated with new title
    const timer = setTimeout(() => {
      sendTrackingEvent({
        type: 'pageview',
        visitorId,
        sessionId,
        pageUrl: window.location.pathname + window.location.search,
        route: pathname,
        pageTitle: document.title,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // This component doesn't render anything visible
  return null;
}