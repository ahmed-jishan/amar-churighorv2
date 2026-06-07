import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/firebase/products';
import { Product } from '@/types';

export function useProducts(filters?: Parameters<typeof getProducts>[0]) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getProducts(filters)
      .then(setProducts)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { products, loading, error };
}
