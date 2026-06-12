import { db } from './config';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { HeroSlide, FaqItem, Review, HeroConfig, DEFAULT_HERO_CONFIG, ReviewAnimationConfig, DEFAULT_REVIEW_ANIMATION_CONFIG } from '@/types';

// Store hero config in the `settings` collection (already deployed with rules)
const HERO_CONFIG_ID = 'hero_config';
const REVIEW_ANIMATION_CONFIG_ID = 'review_animation_config';

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
  const q = query(collection(db, 'hero_slides'), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
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

// ──────────────────────────────────────────────
// FAQ CRUD
// ──────────────────────────────────────────────

export async function getFAQs(): Promise<FaqItem[]> {
  const q = query(collection(db, 'faqs'), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      question: data.question || '',
      answer: data.answer || '',
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || '',
    } as FaqItem;
  });
}

export async function getActiveFAQs(): Promise<FaqItem[]> {
  const q = query(collection(db, 'faqs'), where('isActive', '==', true));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      question: data.question || '',
      answer: data.answer || '',
      isActive: true,
      sortOrder: data.sortOrder ?? 0,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
    } as FaqItem;
  });
  // Client-side sort to avoid composite index requirement
  items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return items;
}

export async function saveFAQ(data: Omit<FaqItem, 'id' | 'createdAt'> & { createdAt?: string }): Promise<void> {
  const payload = {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: '',
  };
  await addDoc(collection(db, 'faqs'), payload);
}

export async function updateFAQ(id: string, data: Partial<FaqItem>): Promise<void> {
  await updateDoc(doc(db, 'faqs', id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteFAQ(id: string): Promise<void> {
  await deleteDoc(doc(db, 'faqs', id));
}

// ──────────────────────────────────────────────
// REVIEW CRUD
// ──────────────────────────────────────────────

export async function getReviews(): Promise<Review[]> {
  const q = query(collection(db, 'reviews'), orderBy('displayOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || '',
      rating: data.rating ?? 5,
      comment: data.comment || '',
      avatar: data.avatar || '',
      designation: data.designation || '',
      location: data.location || '',
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || '',
    } as Review;
  });
}

export async function getActiveReviews(): Promise<Review[]> {
  const q = query(collection(db, 'reviews'), where('isActive', '==', true));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || '',
      rating: data.rating ?? 5,
      comment: data.comment || '',
      avatar: data.avatar || '',
      designation: data.designation || '',
      location: data.location || '',
      isActive: true,
      displayOrder: data.displayOrder ?? 0,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
    } as Review;
  });
  // Client-side sort to avoid composite index requirement
  items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  return items;
}

export async function saveReview(data: Omit<Review, 'id' | 'createdAt'> & { createdAt?: string }): Promise<void> {
  const payload = {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: '',
  };
  await addDoc(collection(db, 'reviews'), payload);
}

export async function updateReview(id: string, data: Partial<Review>): Promise<void> {
  await updateDoc(doc(db, 'reviews', id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteReview(id: string): Promise<void> {
  await deleteDoc(doc(db, 'reviews', id));
}

// ──────────────────────────────────────────────
// REVIEW ANIMATION CONFIG
// ──────────────────────────────────────────────

export async function getReviewAnimationConfig(): Promise<ReviewAnimationConfig> {
  try {
    const snap = await getDoc(doc(db, 'settings', REVIEW_ANIMATION_CONFIG_ID));
    if (snap.exists()) {
      return { ...DEFAULT_REVIEW_ANIMATION_CONFIG, ...snap.data() } as ReviewAnimationConfig;
    }
    return DEFAULT_REVIEW_ANIMATION_CONFIG;
  } catch {
    return DEFAULT_REVIEW_ANIMATION_CONFIG;
  }
}

export async function saveReviewAnimationConfig(data: ReviewAnimationConfig): Promise<void> {
  const sanitized = {
    enabled: data.enabled ?? true,
    animationType: data.animationType || 'carousel-slider',
    speed: data.speed || 'normal',
    customSpeed: data.customSpeed ?? 5,
    direction: data.direction || 'left',
    pauseOnHover: data.pauseOnHover ?? true,
    autoPlay: data.autoPlay ?? true,
    loop: data.loop ?? true,
    mobileOptimized: data.mobileOptimized ?? true,
    desktopOptimized: data.desktopOptimized ?? true,
  };
  await setDoc(doc(db, 'settings', REVIEW_ANIMATION_CONFIG_ID), sanitized);
}