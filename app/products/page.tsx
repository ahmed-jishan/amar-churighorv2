'use client';
import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import ProductSkeleton from '@/components/ui/ProductSkeleton';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books'];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  const { products, loading } = useProducts({ isActive: true });

  const filtered = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
      if (sortBy === 'price_desc') return (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">All Products</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Curated just for you</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeCategory === cat
                  ? 'bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] dark:border-[#c9a96e]'
                  : 'border-[#1f3334] hover:border-green-500 text-gray-600 dark:text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-transparent border border-[#1f3334] rounded-lg px-3 py-1.5 text-sm outline-none">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            : filtered.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      )}
    </motion.div>
  );
}
