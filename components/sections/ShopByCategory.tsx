'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getActiveCategories } from '@/lib/firebase/categories';
import { useProducts } from '@/hooks/useProducts';
import { ProductCategory } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ShopByCategory() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { products } = useProducts({ isActive: true });

  useEffect(() => {
    getActiveCategories()
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Compute product count for each category
  const enriched = categories.map(cat => ({
    ...cat,
    productCount: products.filter(p => p.category === cat.name || p.categoryId === cat.id).length,
  }));

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-[#0b2a2b] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (enriched.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Shop by Category</h2>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {enriched.map(cat => (
          <motion.div key={cat.id} variants={itemVariants}>
            <Link
              href={`/products?category=${cat.name}`}
              className="group relative block aspect-square rounded-2xl overflow-hidden border border-[#1f3334] bg-[#0b2a2b]"
            >
              {/* Category Image */}
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {cat.icon || '📦'}
                </div>
              )}

              {/* Gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* Name + count overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                <h3 className="text-white font-semibold text-sm md:text-base transition-transform duration-300 group-hover:-translate-y-1">
                  {cat.name}
                </h3>
                <p className="text-gray-300 text-xs mt-0.5">
                  {cat.productCount || 0} product{(cat.productCount || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}