/**
 * Anonymous visitor identity — persists across sessions via cookie + localStorage.
 * SSR-safe. No external dependencies (uses crypto.randomUUID).
 */

const KEY = 'anon_id';
const EXPIRY_DAYS = 365;

function setCookie(value: string): void {
  if (typeof window === 'undefined') return;
  const expires = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${KEY}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict${secure}`;
}

function getCookie(): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getLocalStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function setLocalStorage(value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Returns the existing anonymous ID from cookie (preferred) or localStorage,
 * or creates a new one and persists to both stores.
 * SSR-safe — always returns a string (creates ephemeral ID on server).
 */
export function getAnonymousId(): string {
  // SSR fallback — generate a non-persisted ID
  if (typeof window === 'undefined') {
    return 'ssr_' + generateId();
  }

  const cookie = getCookie();
  if (cookie) return cookie;

  const stored = getLocalStorage();
  if (stored) {
    // Cookie missing but localStorage exists — restore cookie
    setCookie(stored);
    return stored;
  }

  // No identity exists — create new one
  const id = generateId();
  setCookie(id);
  setLocalStorage(id);
  return id;
}

/**
 * Syncs cookie and localStorage on app mount.
 * Call once in a client-side useEffect (e.g. in layout.tsx via a small client component).
 */
export function syncAnonymousId(): void {
  if (typeof window === 'undefined') return;

  const cookie = getCookie();
  const stored = getLocalStorage();

  if (cookie && stored && cookie !== stored) {
    // Conflict — cookie wins (more authoritative for cross-session)
    setLocalStorage(cookie);
  } else if (cookie && !stored) {
    setLocalStorage(cookie);
  } else if (!cookie && stored) {
    setCookie(stored);
  }
  // If both missing, do nothing — getAnonymousId() will create on first call
}