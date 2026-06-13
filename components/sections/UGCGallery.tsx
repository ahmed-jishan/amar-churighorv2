'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getActiveUGCItems, UGCItem } from '@/lib/firebase/ugcGallery';
import { Instagram } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function UGCGallery() {
  const [items, setItems] = useState<UGCItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveUGCItems()
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Loved by Our Customers</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">@lumin</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-[#0b2a2b] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  const displayItems = items.slice(0, 6);

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-2xl md:text-3xl font-bold">Loved by Our Customers</h2>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        <Instagram className="w-4 h-4 inline mr-1" />
        @lumin
      </p>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {displayItems.map(item => (
          <motion.div key={item.id} variants={itemVariants}>
            {item.productId ? (
              <Link href={`/products/${item.productId}`} className="group relative block aspect-square rounded-2xl overflow-hidden border border-[#1f3334]">
                <Image
                  src={item.image}
                  alt={item.caption || 'Customer photo'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  {(item.caption || item.instagramHandle) && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-3">
                      {item.caption && <p className="text-white text-xs md:text-sm font-medium line-clamp-2">{item.caption}</p>}
                      {item.instagramHandle && <p className="text-[#d7ffa4] text-xs mt-1">{item.instagramHandle}</p>}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="group relative block aspect-square rounded-2xl overflow-hidden border border-[#1f3334]">
                <Image
                  src={item.image}
                  alt={item.caption || 'Customer photo'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  {(item.caption || item.instagramHandle) && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-3">
                      {item.caption && <p className="text-white text-xs md:text-sm font-medium line-clamp-2">{item.caption}</p>}
                      {item.instagramHandle && <p className="text-[#d7ffa4] text-xs mt-1">{item.instagramHandle}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <div className="text-center mt-6">
        <a
          href="https://www.instagram.com/lumin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[#d7ffa4] hover:underline"
        >
          <Instagram className="w-4 h-4" />
          See more on Instagram
        </a>
      </div>
    </section>
  );
}