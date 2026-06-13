/**
 * Visitor Identity Management
 * 
 * Hybrid tracking system:
 * 1. Visitor ID (Persistent) - localStorage + cookie fallback, 12 months lifetime
 * 2. Session ID (Per visit) - sessionStorage, 30 min inactivity timeout
 * 
 * Do NOT use IP as primary identifier. IP is secondary metadata only.
 */

const VISITOR_KEY = 'analytic_visitor_id';
const SESSION_KEY = 'analytic_session_id';
const SESSION_START_KEY = 'analytic_session_start';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const VISITOR_EXPIRY_DAYS = 365;

// ─── Cookie helpers ─────────────────────────────────────────

function setCookie(name: string, value: string, days: number): void {
  if (typeof window === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── localStorage helpers ───────────────────────────────────

function getLocalItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function setLocalItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch { /* quota exceeded / private mode */ }
}

function getSessionItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function setSessionItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(key, value); } catch { /* private mode */ }
}

function removeSessionItem(key: string): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

// ─── ID generation ──────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

// ─── Visitor ID ─────────────────────────────────────────────

/**
 * Returns the persistent visitor ID.
 * Creates a new one if none exists and persists to both localStorage and cookie.
 * SSR-safe: returns ephemeral ID on server.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_' + generateId();
  }

  // Check cookie first (most authoritative for cross-session)
  const cookieId = getCookie(VISITOR_KEY);
  if (cookieId) {
    // Ensure localStorage is in sync
    const localId = getLocalItem(VISITOR_KEY);
    if (!localId) {
      setLocalItem(VISITOR_KEY, cookieId);
    }
    return cookieId;
  }

  // Check localStorage
  const localId = getLocalItem(VISITOR_KEY);
  if (localId) {
    // Restore cookie from localStorage
    setCookie(VISITOR_KEY, localId, VISITOR_EXPIRY_DAYS);
    return localId;
  }

  // No identity exists — create new one
  const id = generateId();
  setCookie(VISITOR_KEY, id, VISITOR_EXPIRY_DAYS);
  setLocalItem(VISITOR_KEY, id);
  return id;
}

// ─── Session ID ─────────────────────────────────────────────

/**
 * Returns the current session ID, creating a new one if:
 * - No session exists
 * - Session has expired (> 30 min inactivity)
 * 
 * Call this on each page navigation to ensure session freshness.
 */
export function getSessionId(): { sessionId: string; isNew: boolean } {
  if (typeof window === 'undefined') {
    return { sessionId: 'ssr_' + generateId(), isNew: true };
  }

  const existingSession = getSessionItem(SESSION_KEY);
  const sessionStart = getSessionItem(SESSION_START_KEY);

  if (existingSession && sessionStart) {
    const elapsed = Date.now() - parseInt(sessionStart, 10);
    if (elapsed < SESSION_EXPIRY_MS) {
      // Session is still valid — update last activity timestamp
      setSessionItem(SESSION_START_KEY, String(Date.now()));
      return { sessionId: existingSession, isNew: false };
    }
  }

  // Create new session
  const newId = generateId();
  setSessionItem(SESSION_KEY, newId);
  setSessionItem(SESSION_START_KEY, String(Date.now()));
  return { sessionId: newId, isNew: true };
}

/**
 * Updates the session's last activity timestamp.
 * Call on heartbeat / page navigation.
 */
export function touchSession(): void {
  if (typeof window === 'undefined') return;
  setSessionItem(SESSION_START_KEY, String(Date.now()));
}

/**
 * Clears the current session (call on logout or manual reset).
 */
export function clearSession(): void {
  removeSessionItem(SESSION_KEY);
  removeSessionItem(SESSION_START_KEY);
}

// ─── Device Detection ───────────────────────────────────────

export function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobi|android.*mobile|iphone|ipod|blackberry/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function detectBrowser(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('edg')) return 'edge';
  if (ua.includes('chrome')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari')) return 'safari';
  if (ua.includes('opr') || ua.includes('opera')) return 'opera';
  return 'unknown';
}

export function detectOS(): 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macos';
  if (ua.includes('linux') && !ua.includes('android')) return 'linux';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  return 'unknown';
}

/**
 * Retrieves the referrer URL or 'direct' if none.
 */
export function getReferrer(): string {
  if (typeof document === 'undefined') return 'direct';
  return document.referrer || 'direct';
}