'use client';
import { useEffect, useState } from 'react';
import { getCategories } from '@/lib/firebase/categories';
import { useProducts } from '@/hooks/useProducts';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProductCategory } from '@/types';
import { ShoppingBag } from 'lucide-react';

export default function CategoriesPage() {
  const [dbCategories, setDbCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { products } = useProducts({ isActive: true });

  useEffect(() => {
    getCategories().then(cats => {
      setDbCategories(cats.filter(c => c.isActive));
      setLoading(false);
    });
  }, []);

  const categories = loading ? [] : dbCategories.map(cat => ({
    name: cat.name,
    icon: cat.icon || '📦',
    count: products.filter(p => p.category === cat.name).length,
  }));

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Categories</h1>
      <p className="text-gray-500 mb-10">Browse by category</p>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? Array(8).fill(0).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-24 sm:h-32" />
        )) : categories.map(cat => (
          <motion.div key={cat.name} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Link href={`/products?category=${cat.name}`}
              className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-8 bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] hover:border-green-500 transition-colors group text-center">
              <span className="text-2xl md:text-4xl">{cat.icon}</span>
              <h3 className="font-semibold text-sm md:text-base group-hover:text-green-600 dark:group-hover:text-green-400 transition">{cat.name}</h3>
              <p className="text-xs text-gray-400">{cat.count} products</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
