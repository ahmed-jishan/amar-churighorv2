'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';
import NeoButton from './NeoButton';
import { formatPrice } from '@/lib/utils';
import { triggerCartAnimation } from '@/lib/cartAnimation';
import { computeOfferInfo } from '@/lib/offers/helpers';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    const img = e.currentTarget.closest('.group')?.querySelector('img') as HTMLElement | null;
    addToCart(product, img ?? undefined);
    const cartEl = document.getElementById('navbar-cart-icon');
    if (cartEl) {
      triggerCartAnimation(e.currentTarget, cartEl);
    }
  };

  const offer = computeOfferInfo(product.price, product.discountPrice);
  const { isOffer, discountPercentage, savings, effectivePrice } = offer;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const imageSrc = product.featuredImage || product.images[0] || '/placeholder.png';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-gray-900/60 backdrop-blur-sm rounded-xl shadow-md overflow-hidden
                 hover:shadow-xl hover:shadow-green-500/8 transition-all duration-400 flex flex-col
                 border border-[#1f3334]"
    >
      <Link href={`/products/${product.slug}`} className="block overflow-hidden bg-gray-100 dark:bg-gray-800 relative aspect-[4/3]">
        {product.isNewArrival && (
          <span className="absolute top-2 left-2 z-10 text-[10px] bg-[#d7ffa4] text-[#1a1a1a] font-bold px-1.5 py-0.5 rounded-full border border-[#1a1a1a] leading-tight">New</span>
        )}
        {isOffer && (
          <span className="absolute top-2 right-2 z-10 text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-tight">
            -{discountPercentage}%
          </span>
        )}
        <Image
          src={imageSrc}
          alt={product.name}
          width={400}
          height={300}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ aspectRatio: '4/3' }}
        />
      </Link>
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">{product.category}</p>
        <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatPrice(effectivePrice)}</span>
          {isOffer && (
            <span className="text-[11px] text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {product.availableStock > 10 ? (
            <span className="text-[10px] text-green-500 font-medium leading-tight">✓ In Stock</span>
          ) : product.availableStock > 0 ? (
            <span className="text-[10px] text-orange-400 font-medium leading-tight">⚠ Only {product.availableStock} Left</span>
          ) : (
            <span className="text-[10px] text-red-500 font-medium leading-tight">✕ Out of Stock</span>
          )}
        </div>
        {product.availableStock === 0 ? (
          <span className="text-xs text-red-500 font-medium block text-center py-1.5 mt-auto border border-red-500/30 rounded bg-red-500/5">Out of stock</span>
        ) : hasSizes ? (
          <Link href={`/products/${product.slug}`} className="mt-auto">
            <NeoButton
              text="View Details"
              className="w-full text-[11px] py-1.5 px-2 leading-tight rounded
                bg-white text-black border-black shadow-none hover:shadow-[2px_2px_0px_black]
                dark:bg-[#0b2a2b] dark:text-[#e6d3a3] dark:border-[#c9a96e] dark:shadow-none
                dark:hover:bg-[#0f3334] dark:hover:text-white dark:hover:shadow-[3px_3px_0px_#c9a96e]"
            />
          </Link>
        ) : (
          <div className="flex gap-1.5 mt-auto">
            <NeoButton
              text="Add to Cart"
              onClick={handleAdd}
              className="flex-1 text-[11px] py-1.5 px-2 leading-tight rounded
                bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]
                dark:bg-[#0f2f30] dark:text-[#e6d3a3] dark:border-[#c9a96e] dark:shadow-[2px_2px_0px_#c9a96e]
                hover:dark:-translate-y-0.5 hover:dark:bg-[#143a3b] hover:dark:text-white hover:dark:shadow-[3px_3px_0px_#c9a96e]"
            />
            <Link href={`/products/${product.slug}`}>
              <NeoButton
                text="View"
                className="text-[11px] py-1.5 px-3 leading-tight rounded
                  bg-white text-black border-black shadow-none hover:shadow-[2px_2px_0px_black]
                  dark:bg-[#0b2a2b] dark:text-[#e6d3a3] dark:border-[#c9a96e] dark:shadow-none
                  dark:hover:bg-[#0f3334] dark:hover:text-white dark:hover:shadow-[3px_3px_0px_#c9a96e]"
              />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}