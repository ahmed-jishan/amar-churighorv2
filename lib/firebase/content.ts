import { db } from './config';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { HeroSlide, FaqItem, Review, HeroConfig, DEFAULT_HERO_CONFIG } from '@/types';

// Store hero config in the `settings` collection (already deployed with rules)
const HERO_CONFIG_ID = 'hero_config';

// Hero Config (global enable/disable, autoplay, transition)
export async function getHeroConfig(): Promise<HeroConfig> {
  try {
    const snap = await getDoc(doc(db, 'settings', HERO_CONFIG_ID));
    if (snap.exists()) {
      return { ...DEFAULT_HERO_CONFIG, ...snap.data() } as HeroConfig;
    }
    return DEFAULT_HERO_CONFIG;
  } catch {
    return DEFAULT_HERO_CONFIG;
  }
}

export async function saveHeroConfig(data: HeroConfig): Promise<void> {
  const sanitized: Record<string, any> = {
    heroEnabled: data.heroEnabled ?? true,
    autoplay: data.autoplay ?? true,
    autoplaySpeed: data.autoplaySpeed ?? 5000,
    defaultTransition: data.defaultTransition || 'fade',
  };
  await setDoc(doc(db, 'settings', HERO_CONFIG_ID), sanitized);
}

// Hero Slides
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const snap = await getDocs(collection(db, 'hero_slides'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title || '',
      subtitle: data.subtitle || '',
      description: data.description || '',
      image: data.image || '',
      mobileImage: data.mobileImage || '',
      bgImage: data.bgImage || '',
      buttonText: data.buttonText || 'Shop Now',
      buttonLink: data.buttonLink || '/products',
      secondaryButtonText: data.secondaryButtonText || '',
      secondaryButtonLink: data.secondaryButtonLink || '',
      badgeText: data.badgeText || '',
      promoLabel: data.promoLabel || '',
      discountText: data.discountText || '',
      overlayOpacity: data.overlayOpacity ?? 50,
      textAlign: data.textAlign || 'left',
      contentWidth: data.contentWidth || 'medium',
      bgPosition: data.bgPosition || 'center',
      bgFit: data.bgFit || 'cover',
      transition: data.transition || 'fade',
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      altText: data.altText || '',
      metaTitle: data.metaTitle || '',
      metaDescription: data.metaDescription || '',
      createdAt: data.createdAt || new Date().toISOString(),
    } as HeroSlide;
  });
}

export async function saveHeroSlide(data: Omit<HeroSlide, 'id'>): Promise<void> {
  await addDoc(collection(db, 'hero_slides'), data);
}

export async function updateHeroSlide(id: string, data: Partial<HeroSlide>): Promise<void> {
  await updateDoc(doc(db, 'hero_slides', id), data);
}

export async function deleteHeroSlide(id: string): Promise<void> {
  await deleteDoc(doc(db, 'hero_slides', id));
}

// FAQ
export async function getFAQs(): Promise<FaqItem[]> {
  const snap = await getDocs(collection(db, 'faqs'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FaqItem));
}
export async function saveFAQ(data: Omit<FaqItem, 'id'>): Promise<void> {
  await addDoc(collection(db, 'faqs'), data);
}
export async function updateFAQ(id: string, data: Partial<FaqItem>): Promise<void> {
  await updateDoc(doc(db, 'faqs', id), data);
}
export async function deleteFAQ(id: string): Promise<void> {
  await deleteDoc(doc(db, 'faqs', id));
}

// Reviews
export async function getReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, 'reviews'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
}
export async function saveReview(data: Omit<Review, 'id'>): Promise<void> {
  await addDoc(collection(db, 'reviews'), data);
}
export async function updateReview(id: string, data: Partial<Review>): Promise<void> {
  await updateDoc(doc(db, 'reviews', id), data);
}
export async function deleteReview(id: string): Promise<void> {
  await deleteDoc(doc(db, 'reviews', id));
}
