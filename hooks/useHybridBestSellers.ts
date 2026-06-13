'use client';
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';
import { getHybridBestSellers, getCustomerFavorites } from '@/lib/bestSellerEngine';

interface UseHybridBestSellersOptions {
  maxResults?: number;
  revalidateOnMount?: boolean;
}

interface UseHybridBestSellersResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch the hybrid best seller list (manual + automatic).
 * Automatically handles:
 * - New store fallback (returns manual only if no auto best sellers)
 * - Duplicate prevention
 * - Priority ordering (manual first, then auto by score)
 * - Active-only filtering
 */
export function useHybridBestSellers(
  options: UseHybridBestSellersOptions = {}
): UseHybridBestSellersResult {
  const { maxResults = 8 } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHybridBestSellers(maxResults);
      setProducts(result);
    } catch (e: any) {
      console.error('Failed to fetch hybrid best sellers:', e);
      setError(e.message ?? 'Failed to load best sellers');
    } finally {
      setLoading(false);
    }
  }, [maxResults]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { products, loading, error, refresh };
}