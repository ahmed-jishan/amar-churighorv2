import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface StoreConfig {
  contactEmails: string[];
  contactPhones: string[];
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
}

const CONFIG_ID = 'store_config';

const DEFAULT_CONFIG: StoreConfig = {
  contactEmails: ['hello@amarchurchighor.com'],
  contactPhones: ['+880 1XXXXXXXXX'],
  deliveryChargeInside: 80,
  deliveryChargeOutside: 130,
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