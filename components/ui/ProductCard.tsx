'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';
import NeoButton from './NeoButton';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    const img = e.currentTarget.closest('.group')?.querySelector('img') as HTMLElement | null;
    addToCart(product, img ?? undefined);
  };

  const effectivePrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, type: 'spring', stiffness: 120 }}
      whileHover={{ y: -6 }}
      className="group bg-white dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden
                 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 flex flex-col
                 border border-[#1f3334]"
    >
      <Link href={`/products/${product.slug}`} className="block overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        {product.isNewArrival && (
          <span className="absolute top-3 left-3 z-10 text-xs bg-[#d7ffa4] text-[#1a1a1a] font-bold px-2 py-0.5 rounded-full border border-[#1a1a1a]">New</span>
        )}
        {hasDiscount && (
          <span className="absolute top-3 right-3 z-10 text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
            -{Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%
          </span>
        )}
        <Image
          src={product.featuredImage || product.images[0] || '/placeholder.png'}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.category}</p>
        <h3 className="font-semibold line-clamp-2 mb-auto">{product.name}</h3>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(effectivePrice)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <div className="mt-2">
          {product.availableStock > 10 ? (
            <span className="text-xs text-green-500 font-medium">✓ In Stock</span>
          ) : product.availableStock > 0 ? (
            <span className="text-xs text-orange-400 font-medium">⚠ Only {product.availableStock} Left</span>
          ) : (
            <span className="text-xs text-red-500 font-medium">✕ Out of Stock</span>
          )}
        </div>
        {product.availableStock === 0 ? (
          <span className="mt-3 text-sm text-red-500 font-medium block">Out of stock</span>
        ) : (
          <div className="flex gap-2 mt-3">
            <NeoButton
              text="Add to Cart"
              onClick={handleAdd}
              className="flex-1 text-sm py-2
                bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]
                dark:bg-[#0f2f30] dark:text-[#e6d3a3] dark:border-[#c9a96e] dark:shadow-[3px_3px_0px_#c9a96e]
                hover:dark:-translate-y-0.5 hover:dark:bg-[#143a3b] hover:dark:text-white hover:dark:shadow-[5px_5px_0px_#c9a96e]"
            />
            <Link href={`/products/${product.slug}`}>
              <NeoButton
                text="View"
                className="text-sm py-2 px-4
                  bg-white text-black border-black shadow-none hover:shadow-[2px_2px_0px_black]
                  dark:bg-[#0b2a2b] dark:text-[#e6d3a3] dark:border-[#c9a96e] dark:shadow-none
                  dark:hover:bg-[#0f3334] dark:hover:text-white dark:hover:shadow-[4px_4px_0px_#c9a96e]"
              />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
