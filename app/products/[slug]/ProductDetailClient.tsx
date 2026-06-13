'use client';
import { use, useState, useEffect, useCallback } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getProductBySlug } from '@/lib/firebase/products';
import { useCart } from '@/context/CartContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import NeoButton from '@/components/ui/NeoButton';
import { motion } from 'framer-motion';
import { Star, Package, ArrowLeft } from 'lucide-react';
import { getVisitorId, getSessionId } from '@/lib/analytics/visitorId';

// ─── Fire-and-forget product view tracking ────────────────
function trackProductView(product: Product) {
  if (typeof window === 'undefined') return;
  const visitorId = getVisitorId();
  const { sessionId } = getSessionId();
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'productview',
      visitorId,
      sessionId,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
    }),
    keepalive: true,
  }).catch(() => { /* silent */ });
}

export default function ProductDetailClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useCart();
  const { addItem } = useRecentlyViewed();
  const router = useRouter();

  useEffect(() => {
    getProductBySlug(slug).then(p => {
      if (p) { 
        setProduct(p); 
        addItem(p); 
        trackProductView(p);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="grid md:grid-cols-2 gap-6 md:gap-8 animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl aspect-[4/3]" />
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  );

  if (!product) return notFound();

  const images = product.images?.length ? product.images : [product.featuredImage || '/placeholder.png'];
  const price = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            <Image src={images[activeImage]} alt={product.name} width={800} height={600} className="object-cover w-full h-full" priority />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition ${i === activeImage ? 'border-green-500' : 'border-transparent border-gray-700/30'}`}>
                  <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">{product.category}</p>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3">{product.name}</h1>

          <div className="flex items-center flex-wrap gap-2 mb-4">
            <span className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(price)}</span>
            {hasDiscount && <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>}
            {hasDiscount && (
              <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                {Math.round(((product.price - product.discountPrice!) / product.price) * 100)}% off
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'fill-[#d7ffa4] text-[#d7ffa4]' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">(4.5)</span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{product.description}</p>

          <div className="mb-4 p-3 rounded-xl border border-[#1f3334] bg-[#0b2a2b]/30">
            <div className="flex items-center gap-2 text-xs">
              <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {product.availableStock > 10 ? (
                <>
                  <span className="text-green-500 font-medium">In Stock</span>
                  <span className="text-gray-500">· {product.availableStock} available</span>
                </>
              ) : product.availableStock > 0 ? (
                <>
                  <span className="text-orange-400 font-medium">⚠ Low Stock</span>
                  <span className="text-orange-400 font-bold">· Only {product.availableStock} left</span>
                </>
              ) : (
                <>
                  <span className="text-red-500 font-medium">✕ Out of Stock</span>
                  <span className="text-gray-500">· Unavailable</span>
                </>
              )}
            </div>
            {product.initialStock > 0 && (
              <p className="text-[10px] text-gray-500 mt-1">
                {product.soldQuantity} sold · Initially stocked: {product.initialStock}
              </p>
            )}
          </div>

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {product.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.availableStock === 0 ? (
            <div className="flex flex-wrap gap-3">
              <span className="w-full px-6 py-2.5 rounded-[12px] font-semibold text-center bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-2 border-gray-300 dark:border-gray-600">
                Out of Stock
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <NeoButton
                text="Add to Cart"
                onClick={e => {
                  const img = document.querySelector('img[alt="' + product.name + '"]') as HTMLElement;
                  addToCart(product, img ?? undefined);
                }}
                className="w-full text-sm py-3 rounded-[12px]
                  bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]
                  dark:bg-[#0f2f30] dark:text-[#e6d3a3] dark:border-[#c9a96e] dark:shadow-[3px_3px_0px_#c9a96e]
                  hover:dark:-translate-y-0.5 hover:dark:bg-[#143a3b] hover:dark:text-white hover:dark:shadow-[5px_5px_0px_#c9a96e]"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}