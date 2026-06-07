'use client';
import { useProducts } from '@/hooks/useProducts';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '💻', Fashion: '👗', Home: '🏠', Beauty: '💄', Sports: '⚽', Books: '📚', Food: '🍎', Jewelry: '💍',
};

export default function CategoriesPage() {
  const { products, loading } = useProducts({ isActive: true });

  const categories = loading ? [] : [...new Set(products.map(p => p.category))].map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length,
    icon: CATEGORY_ICONS[cat] ?? '📦',
  }));

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Categories</h1>
      <p className="text-gray-500 mb-10">Browse by category</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? Array(8).fill(0).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-32" />
        )) : categories.map(cat => (
          <motion.div key={cat.name} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Link href={`/products?category=${cat.name}`}
              className="flex flex-col items-center justify-center gap-3 p-8 bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] hover:border-green-500 transition-colors group text-center">
              <span className="text-4xl">{cat.icon}</span>
              <h3 className="font-semibold group-hover:text-green-600 dark:group-hover:text-green-400 transition">{cat.name}</h3>
              <p className="text-xs text-gray-400">{cat.count} products</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
