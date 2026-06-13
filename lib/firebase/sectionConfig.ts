import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface SectionConfig {
  title: string;
  subtitle: string;
  isActive: boolean;
  displayLimit?: number;
  displayCount?: number;
  offerLabel?: string;
}

const DEFAULTS: Record<string, Partial<SectionConfig>> = {
  featured_collection: {
    title: 'Featured Collection',
    subtitle: 'Handpicked for you',
    displayLimit: 4,
    isActive: true,
  },
  best_sellers: {
    title: 'Customer Favorites',
    subtitle: 'Our most loved products',
    displayLimit: 4,
    isActive: true,
  },
  new_arrivals: {
    title: 'Just Landed',
    subtitle: 'Newest additions to our collection',
    displayCount: 4,
    isActive: true,
  },
  reviews: {
    title: 'What Our Customers Say',
    subtitle: 'Real reviews from real people',
    isActive: true,
  },
  newsletter: {
    title: 'Get 10% Off Your First Order',
    subtitle: 'Join our community and get exclusive offers',
    offerLabel: 'USE CODE: WELCOME10',
    isActive: true,
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Got questions? We have answers.',
    isActive: true,
  },
  why_choose_us: {
    title: 'Why Choose Us',
    subtitle: 'We make shopping easy and enjoyable',
    isActive: true,
  },
};

export async function getSectionConfig(docId: string): Promise<SectionConfig> {
  try {
    const snap = await getDoc(doc(db, 'section_config', docId));
    if (snap.exists()) {
      const defaults = DEFAULTS[docId] || {};
      return { ...defaults, ...snap.data() } as SectionConfig;
    }
    return (DEFAULTS[docId] || { isActive: true }) as SectionConfig;
  } catch {
    return (DEFAULTS[docId] || { isActive: true }) as SectionConfig;
  }
}

export async function saveSectionConfig(docId: string, data: Partial<SectionConfig>): Promise<void> {
  await setDoc(doc(db, 'section_config', docId), data, { merge: true });
}

export async function getAllSectionConfigs(): Promise<Record<string, SectionConfig>> {
  const docs = Object.keys(DEFAULTS);
  const results: Record<string, SectionConfig> = {};
  for (const docId of docs) {
    results[docId] = await getSectionConfig(docId);
  }
  return results;
}