'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const HeroCarousel = dynamic(() => import('@/components/ui/HeroCarousel'), {
  loading: () => (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-[#1f3334] h-[400px] md:h-[520px] bg-[#0b2a2b] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
  ssr: false,
});
import ProductCard from '@/components/ui/ProductCard';
import ProductSkeleton from '@/components/ui/ProductSkeleton';
import NeoButton from '@/components/ui/NeoButton';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { Star, Truck, Shield, RefreshCw, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

function FeaturedProducts() {
  const { products, loading } = useProducts({ isFeatured: true, isActive: true });
  const display = loading ? [] : products.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {loading
        ? Array(3).fill(0).map((_, i) => <ProductSkeleton key={i} />)
        : display.map(p => <ProductCard key={p.id} product={p} />)
      }
    </div>
  );
}

function BestSellers() {
  const { products, loading } = useProducts({ isBestSeller: true, isActive: true });
  const display = loading ? [] : products.slice(0, 4);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading
        ? Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)
        : display.map(p => <ProductCard key={p.id} product={p} />)
      }
    </div>
  );
}

const WHY_US = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Dhaka: 1-2 days. Outside: 3-5 days.' },
  { icon: Shield, title: 'Secure Payment', desc: 'Cash on delivery. 100% safe.' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free return policy.' },
  { icon: Headphones, title: '24/7 Support', desc: "We're here whenever you need us." },
];

const REVIEWS = [
  { name: 'Rina Begum', rating: 5, comment: 'Amazing quality! Will definitely order again.', location: 'Dhaka' },
  { name: 'Karim Hossain', rating: 5, comment: 'Fast delivery and perfect packaging.', location: 'Chittagong' },
  { name: 'Nusrat Jahan', rating: 5, comment: 'Exactly as described. Highly recommended!', location: 'Sylhet' },
];

const FAQS = [
  { q: 'How long does delivery take?', a: 'Dhaka: 1-2 business days. Outside Dhaka: 3-5 business days.' },
  { q: 'Do you accept cash on delivery?', a: 'Yes! We accept cash on delivery across Bangladesh.' },
  { q: 'Can I return a product?', a: 'Yes, within 7 days if the product is unused and in original packaging.' },
  { q: 'How do I track my order?', a: 'Visit our Track Order page and enter your order ID.' },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      <HeroCarousel />

      {/* Featured */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Collection</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Handpicked for you</p>
          </div>
          <Link href="/products"><NeoButton text="View All"
            className="bg-white text-black border-black shadow-none hover:shadow-[3px_3px_0px_black]
            dark:bg-transparent dark:text-gray-300 dark:border-[#1f3334] dark:hover:border-green-400 dark:hover:text-green-400" /></Link>
        </div>
        <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <ProductSkeleton key={i} />)}</div>}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-50 dark:bg-[#0b2a2b]/50 rounded-3xl p-10">
        <h2 className="text-3xl font-bold text-center mb-2">Why Choose Us</h2>
        <p className="text-center text-gray-500 mb-10">We make shopping easy and enjoyable</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_US.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} whileHover={{ y: -4 }}
              className="text-center p-6 bg-white dark:bg-[#051a1b] rounded-2xl border border-[#1f3334] shadow-sm">
              <div className="w-12 h-12 bg-[#d7ffa4] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-[#1a1a1a]" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Best Sellers</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Our most loved products</p>
          </div>
          <Link href="/products"><NeoButton text="See More"
            className="bg-white text-black border-black shadow-none hover:shadow-[3px_3px_0px_black]
            dark:bg-transparent dark:text-gray-300 dark:border-[#1f3334] dark:hover:border-green-400 dark:hover:text-green-400" /></Link>
        </div>
        <Suspense fallback={<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <ProductSkeleton key={i} />)}</div>}>
          <BestSellers />
        </Suspense>
      </section>

      {/* Reviews */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
        <p className="text-center text-gray-500 mb-10">What our customers say</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map(r => (
            <motion.div key={r.name} whileHover={{ y: -4 }}
              className="p-6 bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] shadow-sm">
              <div className="flex gap-1 mb-3">
                {Array(r.rating).fill(0).map((_, i) => <Star key={i} className="w-4 h-4 fill-[#d7ffa4] text-[#d7ffa4]" />)}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">"{r.comment}"</p>
              <div>
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-gray-400">{r.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h2>
        <p className="text-center text-gray-500 mb-10">Got questions? We have answers.</p>
        <div className="max-w-2xl mx-auto space-y-4">
          {FAQS.map((f, i) => (
            <details key={i} className="group border border-[#1f3334] rounded-2xl p-5 cursor-pointer">
              <summary className="font-semibold list-none flex justify-between items-center">
                {f.q}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#d7ffa4] dark:bg-[#0f2f30] rounded-3xl p-10 text-center border border-[#1a1a1a] dark:border-[#c9a96e]">
        <h2 className="text-3xl font-bold text-[#1a1a1a] dark:text-[#e6d3a3] mb-2">Stay in the Loop</h2>
        <p className="text-[#1a1a1a]/70 dark:text-[#e6d3a3]/70 mb-6">Get notified about new products and exclusive offers.</p>
        <div className="flex gap-3 max-w-md mx-auto">
          <input type="email" placeholder="Your email address"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[#1a1a1a] dark:border-[#c9a96e] bg-white dark:bg-[#051a1b] outline-none" />
          <NeoButton text="Subscribe"
            className="bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#444]
            dark:bg-[#c9a96e] dark:text-[#051a1b] dark:border-[#c9a96e] dark:shadow-[3px_3px_0px_#fff3]" />
        </div>
      </section>
    </div>
  );
}
