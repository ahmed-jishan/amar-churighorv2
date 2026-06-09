'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import ProductSkeleton from '@/components/ui/ProductSkeleton';

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const { products, loading } = useProducts({ isActive: true });

  const results = q
    ? products.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(q.toLowerCase()))
      )
    : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Search Results</h1>
      <p className="text-gray-500 mb-8">
        {q ? (loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`) : 'Enter a search term'}
      </p>
      {!loading && results.length === 0 && q && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-xl font-semibold">No results found</p>
          <p className="text-gray-500 mt-2">Try different keywords</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />) : results.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div />}><SearchResults /></Suspense>;
}
