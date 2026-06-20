import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface StoreConfig {
  contactEmails: string[];
  contactPhones: string[];
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
}

/** Analytics tracking toggle configuration */
export interface AnalyticsConfig {
  /** When false, AnalyticsTracker will skip all tracking events */
  trackingEnabled: boolean;
}

/** Email notification toggle configuration */
export interface EmailConfig {
  /** Send order confirmation email to the customer */
  userGetEmail: boolean;
  /** Send order notification email to the admin */
  adminGetEmail: boolean;
}

const CONFIG_ID = 'store_config';
const ANALYTICS_CONFIG_ID = 'analytics_config';
const EMAIL_CONFIG_ID = 'email_config';

const DEFAULT_CONFIG: StoreConfig = {
  contactEmails: ['hello@amarchurchighor.com'],
  contactPhones: ['+880 1XXXXXXXXX'],
  deliveryChargeInside: 80,
  deliveryChargeOutside: 130,
};

const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  trackingEnabled: true,
};

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  userGetEmail: true,
  adminGetEmail: true,
};

export async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const snap = await getDoc(doc(db, 'settings', CONFIG_ID));
    if (snap.exists()) {
      const data = snap.data();
      return {
        contactEmails: data.contactEmails ?? DEFAULT_CONFIG.contactEmails,
        contactPhones: data.contactPhones ?? DEFAULT_CONFIG.contactPhones,
        deliveryChargeInside: data.deliveryChargeInside ?? DEFAULT_CONFIG.deliveryChargeInside,
        deliveryChargeOutside: data.deliveryChargeOutside ?? DEFAULT_CONFIG.deliveryChargeOutside,
      } as StoreConfig;
    }
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveStoreConfig(data: StoreConfig): Promise<void> {
  const sanitized = {
    contactEmails: Array.isArray(data.contactEmails) ? data.contactEmails : DEFAULT_CONFIG.contactEmails,
    contactPhones: Array.isArray(data.contactPhones) ? data.contactPhones : DEFAULT_CONFIG.contactPhones,
    deliveryChargeInside: Math.max(0, data.deliveryChargeInside ?? DEFAULT_CONFIG.deliveryChargeInside),
    deliveryChargeOutside: Math.max(0, data.deliveryChargeOutside ?? DEFAULT_CONFIG.deliveryChargeOutside),
  };
  await setDoc(doc(db, 'settings', CONFIG_ID), sanitized);
}

/** Get the analytics tracking toggle config (default: enabled) */
export async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
  try {
    const snap = await getDoc(doc(db, 'settings', ANALYTICS_CONFIG_ID));
    if (snap.exists()) {
      const data = snap.data();
      return {
        trackingEnabled: data.trackingEnabled !== false, // default true
      };
    }
    return DEFAULT_ANALYTICS_CONFIG;
  } catch {
    return DEFAULT_ANALYTICS_CONFIG;
  }
}

/** Save the analytics tracking toggle config */
export async function saveAnalyticsConfig(data: AnalyticsConfig): Promise<void> {
  await setDoc(doc(db, 'settings', ANALYTICS_CONFIG_ID), {
    trackingEnabled: data.trackingEnabled !== false,
    updatedAt: new Date().toISOString(),
  });
}

/** Get the email notification toggle config (default: both enabled) */
export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const snap = await getDoc(doc(db, 'settings', EMAIL_CONFIG_ID));
    if (snap.exists()) {
      const data = snap.data();
      return {
        userGetEmail: data.userGetEmail !== false,
        adminGetEmail: data.adminGetEmail !== false,
      };
    }
    return DEFAULT_EMAIL_CONFIG;
  } catch {
    return DEFAULT_EMAIL_CONFIG;
  }
}

/** Save the email notification toggle config */
export async function saveEmailConfig(data: EmailConfig): Promise<void> {
  await setDoc(doc(db, 'settings', EMAIL_CONFIG_ID), {
    userGetEmail: data.userGetEmail !== false,
    adminGetEmail: data.adminGetEmail !== false,
    updatedAt: new Date().toISOString(),
  });
}