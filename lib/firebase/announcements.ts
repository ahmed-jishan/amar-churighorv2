import { db } from './config';
import {
  doc, getDoc, setDoc,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────

export interface CustomMessage {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
  isActive: boolean;
}

export type AnimationStyle = 'marquee' | 'fade' | 'typewriter' | 'slide_up';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type BarStyle = 'flash_red' | 'gold' | 'dark' | 'success_green';

export interface AnnouncementConfig {
  isEnabled: boolean;
  mode: 'campaign' | 'custom';
  linkedCampaignIds: string[];
  showCampaignDiscount: boolean;
  showCampaignTimer: boolean;
  customMessages: CustomMessage[];
  animationStyle: AnimationStyle;
  animationSpeed: AnimationSpeed;
  barStyle: BarStyle;
  dismissible: boolean;
  showTimer: boolean;
  updatedAt: string;
  updatedBy: string;
}

// ── Default config (used when no doc exists) ───────────────────

export const DEFAULT_CONFIG: AnnouncementConfig = {
  isEnabled: false,
  mode: 'custom',
  linkedCampaignIds: [],
  showCampaignDiscount: true,
  showCampaignTimer: true,
  customMessages: [],
  animationStyle: 'marquee',
  animationSpeed: 'normal',
  barStyle: 'flash_red',
  dismissible: true,
  showTimer: true,
  updatedAt: '',
  updatedBy: '',
};

const CONFIG_DOC_ID = 'config';
const COLLECTION = 'announcement_settings';

// ── Helpers ─────────────────────────────────────────────────────

/** Remove undefined values (Firestore rejects undefined) */
function cleanPayload<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

function docRef() {
  return doc(db, COLLECTION, CONFIG_DOC_ID);
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Fetch announcement config once (non-reactive).
 * Returns DEFAULT_CONFIG if no doc exists yet (so the bar can render properly).
 */
export async function getAnnouncementConfig(): Promise<AnnouncementConfig> {
  try {
    const snap = await getDoc(docRef());
    if (!snap.exists()) return { ...DEFAULT_CONFIG };
    return snap.data() as AnnouncementConfig;
  } catch (err) {
    console.error('Error fetching announcement config:', err);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save announcement config. Creates or overwrites the "config" document.
 */
export async function saveAnnouncementConfig(
  data: AnnouncementConfig,
  adminUid: string
): Promise<void> {
  const payload = cleanPayload({
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  });

  await setDoc(docRef(), payload, { merge: true });
}

/**
 * Subscribe to announcement config with polling.
 * Uses getDoc + setInterval instead of onSnapshot to avoid SDK permission error logs.
 * Polls every 5 seconds for fast reflection of admin changes.
 * Returns an unsubscribe function.
 */
export function subscribeToAnnouncementConfig(
  callback: (config: AnnouncementConfig) => void
): Unsubscribe {
  let cancelled = false;

  async function poll() {
    if (cancelled) return;
    try {
      const snap = await getDoc(docRef());
      if (cancelled) return;
      if (!snap.exists()) {
        callback({ ...DEFAULT_CONFIG });
      } else {
        callback(snap.data() as AnnouncementConfig);
      }
    } catch {
      if (cancelled) return;
      callback({ ...DEFAULT_CONFIG });
    }
  }

  // Fire immediately
  poll();

  // Poll every 5s — fast reflection of admin saves
  const interval = setInterval(poll, 5_000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}