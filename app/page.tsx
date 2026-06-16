'use client';
import { Suspense, useEffect, useState } from 'react';
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
import { useHybridBestSellers } from '@/hooks/useHybridBestSellers';
import { Truck, Shield, RefreshCw, Headphones, Star, Heart, Package, Clock, Award, ThumbsUp, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import ReviewsSection from '@/components/ui/ReviewsSection';
import FAQSection from '@/components/ui/FAQSection';
import { getSectionConfig, SectionConfig } from '@/lib/firebase/sectionConfig';

// ── Featured Collection Section (dynamic config) ──
function FeaturedCollectionSection() {
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const { products, loading } = useProducts();

  useEffect(() => {
    getSectionConfig('featured_collection').then(setConfig);
  }, []);

  if (config && !config.isActive) return null;
  const limit = config?.displayLimit ?? 4;
  const display = loading ? [] : products.filter(p => p.isFeatured && p.isActive).slice(0, limit);

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{config?.title || 'Featured Collection'}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{config?.subtitle || 'Handpicked for you'}</p>
        </div>
        <Link href="/collections/featured" className="self-stretch sm:self-auto"><NeoButton text="View All"
          className="w-full sm:w-auto bg-white text-black border-black shadow-none hover:shadow-[3px_3px_0px_black]
          dark:bg-transparent dark:text-gray-300 dark:border-[#1f3334] dark:hover:border-green-400 dark:hover:text-green-400" /></Link>
      </div>
      <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <ProductSkeleton key={i} />)}</div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array(limit).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            : display.map(p => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </Suspense>
    </section>
  );
}

// ── Best Sellers Section (dynamic config + horizontal scroll mobile) ──
function BestSellersSection() {
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const { products, loading } = useHybridBestSellers({ maxResults: 8 });

  useEffect(() => {
    getSectionConfig('best_sellers').then(setConfig);
  }, []);

  if (config && !config.isActive) return null;
  const limit = config?.displayLimit ?? 4;
  const display = loading ? [] : products.slice(0, limit);

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{config?.title || 'Customer Favorites'}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{config?.subtitle || 'Our most loved products'}</p>
        </div>
        <Link href="/collections/favorites" className="self-stretch sm:self-auto"><NeoButton text="View All →"
          className="w-full sm:w-auto bg-white text-black border-black shadow-none hover:shadow-[3px_3px_0px_black]
          dark:bg-transparent dark:text-gray-300 dark:border-[#1f3334] dark:hover:border-green-400 dark:hover:text-green-400" /></Link>
      </div>
      <Suspense fallback={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(limit).fill(0).map((_, i) => <ProductSkeleton key={i} />)}</div>
      }>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(limit).fill(0).map((_, i) => <ProductSkeleton key={i} />)}</div>
        ) : (
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-x-visible lg:mx-0 lg:px-0">
            {display.map(p => (
              <div key={p.id} className="min-w-[220px] sm:min-w-[240px] snap-start lg:min-w-0 lg:w-full relative">
                <span className="absolute top-2 left-2 z-10 text-[10px] bg-[#d7ffa4] text-[#1a1a1a] font-bold px-2 py-0.5 rounded-full shadow-md">
                  Most Loved
                </span>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </Suspense>
    </section>
  );
}

// ── New Arrivals Section ──
function NewArrivalsSection() {
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const { products, loading } = useProducts();

  useEffect(() => {
    getSectionConfig('new_arrivals').then(setConfig);
  }, []);

  if (config && !config.isActive) return null;
  const count = config?.displayCount ?? 4;
  const display = loading ? [] : products.filter(p => p.isNewArrival && p.isActive).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, count);

  if (!loading && display.length === 0) return null;

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{config?.title || 'Just Landed'}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{config?.subtitle || 'Newest additions to our collection'}</p>
        </div>
        <Link href="/products?sort=newest" className="self-stretch sm:self-auto"><NeoButton text="View All →"
          className="w-full sm:w-auto bg-white text-black border-black shadow-none hover:shadow-[3px_3px_0px_black]
          dark:bg-transparent dark:text-gray-300 dark:border-[#1f3334] dark:hover:border-green-400 dark:hover:text-green-400" /></Link>
      </div>
      <Suspense fallback={<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(count).fill(0).map((_, i) => <ProductSkeleton key={i} />)}</div>}>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-x-visible lg:mx-0 lg:px-0">
          {loading
            ? Array(count).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            : display.map(p => (
                <div key={p.id} className="min-w-[220px] sm:min-w-[240px] snap-start lg:min-w-0 lg:w-full">
                  <ProductCard product={p} />
                </div>
              ))
          }
        </div>
      </Suspense>
    </section>
  );
}

// ── Why Choose Us Section (dynamic from Firestore) ──
const WHY_US_ICONS: Record<string, LucideIcon> = {
  Truck, Shield, ShieldCheck: Shield, RotateCcw: RefreshCw, Headphones, Star, Heart, Package, Clock, Award, ThumbsUp,
};

function WhyChooseUsSection() {
  const [config, setConfig] = useState<SectionConfig | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSectionConfig('why_choose_us'),
      import('@/lib/firebase/whyChooseUs').then(m => m.getActiveWhyChooseUsItems()),
    ]).then(([cfg, data]) => {
      setConfig(cfg);
      setItems(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (config && !config.isActive) return null;
  if (items.length === 0) {
    // Static fallback
    return (
      <section className="bg-gray-50 dark:bg-[#0b2a2b]/50 rounded-3xl p-6 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Why Choose Us</h2>
        <p className="text-center text-gray-500 mb-8 md:mb-10">We make shopping easy and enjoyable</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: Truck, title: 'Fast Delivery', desc: 'Dhaka: 1-2 days. Outside: 3-5 days.' },
            { icon: Shield, title: 'Secure Payment', desc: 'Cash on delivery. 100% safe.' },
            { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free return policy.' },
            { icon: Headphones, title: '24/7 Support', desc: "We're here whenever you need us." },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} whileHover={{ y: -4 }}
              className="text-center p-4 md:p-6 bg-white dark:bg-[#051a1b] rounded-2xl border border-[#1f3334] shadow-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#d7ffa4] rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#1a1a1a]" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">{title}</h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-[#0b2a2b]/50 rounded-3xl p-6 md:p-10">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">{config?.title || 'Why Choose Us'}</h2>
      <p className="text-center text-gray-500 mb-8 md:mb-10">{config?.subtitle || 'We make shopping easy and enjoyable'}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map(item => {
          const Icon = WHY_US_ICONS[item.icon] || Truck;
          return (
            <motion.div key={item.id} whileHover={{ y: -4 }}
              className="text-center p-4 md:p-6 bg-white dark:bg-[#051a1b] rounded-2xl border border-[#1f3334] shadow-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#d7ffa4] dark:bg-[#d7ffa4]/10 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#1a1a1a] dark:text-[#d7ffa4]" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">{item.title}</h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-12 md:space-y-20">
      <HeroCarousel />

      {/* Featured Collection */}
      <FeaturedCollectionSection />

      {/* Why Choose Us */}
      <WhyChooseUsSection />

      {/* Best Sellers / Customer Favorites */}
      <BestSellersSection />

      {/* New Arrivals */}
      <NewArrivalsSection />

      {/* Reviews Section */}
      <section>
        <Suspense fallback={
          <div className="text-center py-8 md:py-12">
            <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        }>
          <ReviewsSection />
        </Suspense>
      </section>

      {/* FAQ Section */}
      <section>
        <Suspense fallback={
          <div className="text-center py-8 md:py-12">
            <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        }>
          <FAQSection />
        </Suspense>
      </section>

      {/* Newsletter */}
      <section className="bg-[#d7ffa4] dark:bg-[#0f2f30] rounded-3xl p-6 md:p-10 text-center border border-[#1a1a1a] dark:border-[#c9a96e]">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] dark:text-[#e6d3a3] mb-2">Stay in the Loop</h2>
        <p className="text-[#1a1a1a]/70 dark:text-[#e6d3a3]/70 mb-6 max-w-sm mx-auto">Get notified about new products and exclusive offers.</p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" placeholder="Your email address"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[#1a1a1a] dark:border-[#c9a96e] bg-white dark:bg-[#051a1b] outline-none" />
          <NeoButton text="Subscribe"
            className="w-full sm:w-auto bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#444]
            dark:bg-[#c9a96e] dark:text-[#051a1b] dark:border-[#c9a96e] dark:shadow-[3px_3px_0px_#fff3]" />
        </div>
      </section>
    </div>
  );
}