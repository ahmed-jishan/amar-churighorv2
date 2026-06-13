import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface FooterConfig {
  tagline: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    youtube?: string;
  };
  paymentMethods: string[];
  copyrightText: string;
  isActive: boolean;
}

const DOC_ID = 'footer_config';
const DEFAULT: FooterConfig = {
  tagline: 'Your trusted jewelry destination',
  socialLinks: {},
  paymentMethods: ['cod', 'bkash', 'nagad', 'rocket'],
  copyrightText: 'All rights reserved.',
  isActive: true,
};

export async function getFooterConfig(): Promise<FooterConfig> {
  try {
    const snap = await getDoc(doc(db, 'section_config', DOC_ID));
    if (snap.exists()) {
      return { ...DEFAULT, ...snap.data() } as FooterConfig;
    }
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export async function saveFooterConfig(data: Partial<FooterConfig>): Promise<void> {
  await setDoc(doc(db, 'section_config', DOC_ID), data, { merge: true });
}