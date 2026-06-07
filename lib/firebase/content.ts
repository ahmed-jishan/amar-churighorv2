import { db } from './config';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { HeroSlide, FaqItem, Review } from '@/types';

// Hero Slides
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const snap = await getDocs(collection(db, 'hero_slides'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HeroSlide));
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
