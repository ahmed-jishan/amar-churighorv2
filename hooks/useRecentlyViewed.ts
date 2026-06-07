import { useState, useEffect } from 'react';
import { Product } from '@/types';

const KEY = 'ac_recently_viewed';
const MAX = 6;

export function useRecentlyViewed() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  function addItem(product: Product) {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const next = [product, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  return { items, addItem };
}
