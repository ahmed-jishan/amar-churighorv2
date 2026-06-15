import { Product } from '@/types';

const KEY = 'lumin_recently_viewed';
const MAX = 6;

interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  featuredImage: string;
  category: string;
  stock: number;
}

export function addRecentlyViewed(product: Product): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(KEY);
    const items: RecentlyViewedProduct[] = raw ? JSON.parse(raw) : [];
    const filtered = items.filter(p => p.id !== product.id);
    const entry: RecentlyViewedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      featuredImage: product.featuredImage || product.images?.[0] || '',
      category: product.category,
      stock: product.availableStock ?? product.stock,
    };
    const next = [entry, ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Silently fail
  }
}

export function getRecentlyViewed(): RecentlyViewedProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}