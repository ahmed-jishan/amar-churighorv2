'use client';
import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import ProductSkeleton from '@/components/ui/ProductSkeleton';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { getSectionConfig, SectionConfig } from '@/lib/firebase/sectionConfig';

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price Low to High' },
  { value: 'price_desc', label: 'Price High to Low' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
];

export default function FeaturedCollectionPage() {
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    getSectionConfig('featured_collection').then(setConfig);
  }, []);

  const { products, loading, error } = useProducts({ isFeatured: true, isActive: true });

  const sortedProducts = useMemo(() => {
    if (!products.length) return [];
    const sorted = [...products];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_asc':
        sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
        break;
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return sorted;
  }, [products, sortBy]);

  const collectionTitle = config?.title || 'Featured Collection';
  const collectionDescription = config?.subtitle || 'Discover our handpicked selection of highlighted products carefully chosen for quality, popularity, and style.';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#d7ffa4] dark:text-[#d7ffa4] text-green-600" />
          <span className="text-xs uppercase tracking-widest text-[#d7ffa4] dark:text-[#d7ffa4] text-green-700 font-medium">Curated Selection</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{collectionTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">{collectionDescription}</p>
        {!loading && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {error ? '' : `Showing ${sortedProducts.length} Product${sortedProducts.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
        <div className="sm:ml-auto flex items-center gap-2 text-sm w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="flex-1 sm:flex-none bg-white dark:bg-[#0b2a2b] border border-[#1f3334] rounded-lg px-3 py-1.5 text-sm outline-none cursor-pointer focus:border-green-500 text-gray-800 dark:text-gray-200"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-gray-500 mb-2">Unable to load featured products.</p>
          <p className="text-sm text-gray-500">Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">✨</p>
          <p className="text-xl font-medium mb-2">No featured products yet</p>
          <p className="text-gray-500 max-w-md mx-auto">
            Featured products will appear here once they are marked as Featured in the admin panel.
          </p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && sortedProducts.length > 0 && (
        <motion.div
          key={sortBy}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        >
          {sortedProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}