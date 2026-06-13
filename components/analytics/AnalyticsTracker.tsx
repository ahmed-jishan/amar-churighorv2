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

const TRACKING_API = '/api/track';
const HEARTBEAT_INTERVAL_MS = 60000; // 60 seconds
const SESSION_TRACKED_KEY = 'analytic_session_tracked';

// ─── Helper: fire tracking event (fire-and-forget) ────────

function sendTrackingEvent(body: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  
  // Use sendBeacon for reliability on page unload
  if (body.type === 'endsession' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    navigator.sendBeacon(TRACKING_API, blob);
    return;
  }

  // Use fetch with keepalive for other events
  fetch(TRACKING_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Silent fail — tracking should never affect UX
  });
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

      sendTrackingEvent({
        type: 'session',
        visitorId,
        sessionId,
        deviceType: detectDeviceType(),
        browser: detectBrowser(),
        os: detectOS(),
        landingPage: window.location.pathname,
        referralSource: getReferrer(),
        visitCount,
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