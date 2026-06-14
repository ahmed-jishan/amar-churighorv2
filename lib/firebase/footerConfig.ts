import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  label: string;
  isActive: boolean;
}

export interface FooterConfig {
  tagline: string;
  brandLogo?: string;
  // Optional customisation for brand logo appearance
  brandLogoSizePreset?: '250x150' | '350x75' | '400x100' | 'custom';
  brandLogoWidth?: number | null;
  brandLogoHeight?: number | null;
  brandLogoShape?: 'rounded' | 'circle' | 'square';
  brandLogoAnimation?: boolean;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    youtube?: string;
  };
  socialLinksArray: SocialLink[];
  paymentMethods: string[];
  paymentMethodsArray: PaymentMethod[];
  copyrightText: string;
  isActive: boolean;
}

const DOC_ID = 'footer_config';
const COLLECTION = 'settings';
const DEFAULT: FooterConfig = {
  tagline: 'Your trusted jewelry destination',
  brandLogo: '',
  brandLogoSizePreset: '350x75',
  brandLogoWidth: null,
  brandLogoHeight: null,
  brandLogoShape: 'rounded',
  brandLogoAnimation: false,
  socialLinks: {},
  socialLinksArray: [
    { platform: 'facebook', url: '', icon: 'facebook', isActive: true },
    { platform: 'instagram', url: '', icon: 'instagram', isActive: true },
    { platform: 'whatsapp', url: '', icon: 'message-circle', isActive: true },
    { platform: 'youtube', url: '', icon: 'youtube', isActive: true },
  ],
  paymentMethods: ['cod', 'bkash', 'nagad', 'rocket'],
  paymentMethodsArray: [
    { id: 'cod', label: 'Cash on Delivery', isActive: true },
    { id: 'bkash', label: 'bKash', isActive: true },
    { id: 'nagad', label: 'Nagad', isActive: true },
    { id: 'rocket', label: 'Rocket', isActive: true },
  ],
  copyrightText: 'All rights reserved.',
  isActive: true,
};

export async function getFooterConfig(): Promise<FooterConfig> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
    if (snap.exists()) {
      return { ...DEFAULT, ...snap.data() } as FooterConfig;
    }
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export async function saveFooterConfig(data: Partial<FooterConfig>): Promise<void> {
  await setDoc(doc(db, COLLECTION, DOC_ID), data, { merge: true });
}
