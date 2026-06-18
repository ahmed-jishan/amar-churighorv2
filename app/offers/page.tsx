'use client';
import { useMemo, useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import ProductSkeleton from '@/components/ui/ProductSkeleton';
import CampaignCard from '@/components/ui/CampaignCard';
import LiveCountdown from '@/components/ui/LiveCountdown';
import CustomerRewardsPanel from '@/components/loyalty/CustomerRewardsPanel';
import { Tag, Gift, Percent, TrendingDown, ShoppingBag, ArrowUpDown, ChevronDown, Megaphone, Clock, Zap, Star, Award, Mail, Phone, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeOfferInfo } from '@/lib/offers/helpers';
import { getActiveCampaigns } from '@/lib/firebase/campaigns';
import { toCampaignCard, getCampaignDiscountLabel } from '@/lib/offers/campaignEngine';
import type { Product } from '@/types';
import type { Campaign, CampaignCardData } from '@/lib/offers/campaignTypes';

// ── Sort Options ─────────────────────────────────────────────
type SortKey = 'newest' | 'oldest' | 'discount-high' | 'discount-low' | 'price-low' | 'price-high';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'discount-high', label: 'Highest Discount' },
  { key: 'discount-low', label: 'Lowest Discount' },
  { key: 'price-low', label: 'Price Low to High' },
  { key: 'price-high', label: 'Price High to Low' },
];

function sortProducts(products: Product[], sortKey: SortKey): Product[] {
  const sorted = [...products];
  switch (sortKey) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'discount-high':
      return sorted.sort((a, b) => {
        const aOff = computeOfferInfo(a.price, a.discountPrice);
        const bOff = computeOfferInfo(b.price, b.discountPrice);
        return bOff.discountPercentage - aOff.discountPercentage;
      });
    case 'discount-low':
      return sorted.sort((a, b) => {
        const aOff = computeOfferInfo(a.price, a.discountPrice);
        const bOff = computeOfferInfo(b.price, b.discountPrice);
        return aOff.discountPercentage - bOff.discountPercentage;
      });
    case 'price-low':
      return sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    case 'price-high':
      return sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    default:
      return sorted;
  }
}

// ── Sorting Dropdown ──────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const selected = SORT_OPTIONS.find(o => o.key === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm font-medium
                   text-gray-700 dark:text-gray-200 hover:border-green-500/50 dark:hover:border-green-500/50 transition-all duration-200
                   shadow-sm hover:shadow-md"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
        <span>{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-1.5 min-w-[200px] bg-white dark:bg-[#0b2a2b] border border-[#1f3334] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-40"
          >
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                  value === opt.key
                    ? 'text-[#1a1a1a] dark:text-[#d7ffa4] bg-[#d7ffa4]/10 dark:bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
                    : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-[#0b2a2b]/60 border-l-2 border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-20 md:py-28 text-center"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
        <Gift className="w-10 h-10 text-amber-500 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold mb-3">No Active Offers Right Now</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm md:text-base leading-relaxed">
        Stay tuned for upcoming discounts and special promotions. Check back soon for exclusive deals.
      </p>
      <a
        href="/products"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] dark:bg-[#d7ffa4] text-white dark:text-[#1a1a1a] rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
      >
        <ShoppingBag className="w-4 h-4" />
        Browse All Products
      </a>
    </motion.div>
  );
}

// ── Hero Section ──────────────────────────────────────────────
function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#0b2a2b] via-[#0d3233] to-[#051a1b] dark:from-[#0b2a2b] dark:via-[#0d3233] dark:to-[#051a1b] border border-[#1f3334] p-8 md:p-12 lg:p-16 mb-10 md:mb-14"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, #d7ffa4 1px, transparent 1px), radial-gradient(circle at 75% 75%, #d7ffa4 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#d7ffa4]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#d7ffa4]/10 dark:bg-[#d7ffa4]/10 rounded-full text-xs font-medium text-[#d7ffa4] mb-4 border border-[#d7ffa4]/20">
            <Percent className="w-3.5 h-3.5" />
            Limited Time Offers
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Exclusive{' '}
            <span className="bg-gradient-to-r from-[#d7ffa4] to-[#a8e063] bg-clip-text text-transparent">Offers</span>
          </h1>
          <p className="text-gray-400 max-w-lg text-sm md:text-base leading-relaxed">
            Discover limited-time deals, special discounts, and handpicked offers curated for our customers.
          </p>
        </div>
        <div className="hidden md:flex items-center justify-center w-28 h-28 lg:w-36 lg:h-36 bg-gradient-to-br from-[#d7ffa4]/10 to-[#d7ffa4]/5 rounded-3xl border border-[#d7ffa4]/15 shadow-lg shadow-[#d7ffa4]/5">
          <Tag className="w-12 h-12 lg:w-16 lg:h-16 text-[#d7ffa4]" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────
function StatsBar({ totalOffers, highestDiscount }: { totalOffers: number; highestDiscount: number }) {
  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6">
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0b2a2b] border border-[#1f3334] rounded-xl shadow-sm">
        <Tag className="w-4 h-4 text-[#d7ffa4]" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {totalOffers} {totalOffers === 1 ? 'Offer' : 'Offers'} Active
        </span>
      </div>
      {highestDiscount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0b2a2b] border border-[#1f3334] rounded-xl shadow-sm">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Up to {highestDiscount}% OFF
          </span>
        </div>
      )}
    </div>
  );
}

// ── Campaigns Section ─────────────────────────────────────────
function CampaignsSection({ campaigns }: { campaigns: CampaignCardData[] }) {
  if (campaigns.length === 0) return null;
  return (
    <section className="mb-10 md:mb-14">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="w-5 h-5 text-[#d7ffa4]" />
        <h2 className="text-xl md:text-2xl font-bold">Active Campaigns</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {campaigns.map((c, i) => (
          <CampaignCard key={c.id} campaign={c} index={i} />
        ))}
      </div>
    </section>
  );
}

// ── Flash Sale Section ────────────────────────────────────────
function FlashSaleSection({ campaigns }: { campaigns: CampaignCardData[] }) {
  const flashSales = campaigns.filter(c => c.type === 'flash_sale');
  if (flashSales.length === 0) return null;
  const top = flashSales[0];
  const label = getCampaignDiscountLabel(top);
  return (
    <section className="mb-10 md:mb-14">
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-red-600/20 via-red-700/10 to-orange-600/20 border border-red-500/20 p-6 md:p-8 lg:p-10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-red-400" />
              <span className="text-xs font-bold text-red-300 uppercase tracking-wider">Flash Sale</span>
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{top.title}</h2>
            <p className="text-gray-300 text-sm mt-1">{top.description}</p>
            <div className="text-3xl md:text-4xl font-extrabold text-red-400 mt-2">{label}</div>
          </div>
          {top.endDate && (
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Ends in</span>
              </div>
              <LiveCountdown endDate={top.endDate} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Customer Rewards Lookup Section ───────────────────────────
function CustomerRewardsSection() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/loyalty/customer-rewards?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      if (data.success) {
        setRewards(data.rewards);
      } else {
        setRewards([]);
      }
    } catch {
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-10 md:mb-14">
      <div className="bg-white dark:bg-[#0b2a2b] border border-[#1f3334] rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-[#d7ffa4]" />
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Your Rewards</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter your email and phone number used during checkout to view your available rewards.
        </p>
        
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#051a1b] border border-[#1f3334] rounded-xl text-sm outline-none focus:border-green-500 transition"
            />
          </div>
          <div className="flex-1 relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#051a1b] border border-[#1f3334] rounded-xl text-sm outline-none focus:border-green-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={!email || !phone || loading}
            className="px-5 py-2.5 bg-[#d7ffa4] text-[#051a1b] font-semibold rounded-xl hover:bg-[#c5f090] disabled:opacity-50 disabled:cursor-not-allowed transition text-sm whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'View Rewards'}
          </button>
        </form>

        <CustomerRewardsPanel
          rewards={rewards}
          loading={loading}
          email={email}
          phone={phone}
        />
      </div>
    </section>
  );
}

// ── Main Offers Page ──────────────────────────────────────────
export default function OffersPage() {
  const { products, loading } = useProducts({ isActive: true });
  const [sortKey, setSortKey] = useState<SortKey>('discount-high');
  const [campaignCards, setCampaignCards] = useState<CampaignCardData[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  useEffect(() => {
    getActiveCampaigns().then(campaigns => {
      setCampaignCards(campaigns.map(toCampaignCard));
      setCampaignsLoading(false);
    }).catch(() => setCampaignsLoading(false));
  }, []);

  // Filter offer products dynamically
  const offerProducts = useMemo(() => {
    return products.filter(p => {
      const off = computeOfferInfo(p.price, p.discountPrice);
      return off.isOffer;
    });
  }, [products]);

  // Sort
  const sortedOffers = useMemo(() => sortProducts(offerProducts, sortKey), [offerProducts, sortKey]);

  // Stats
  const highestDiscount = useMemo(() => {
    if (offerProducts.length === 0) return 0;
    return Math.max(...offerProducts.map(p => computeOfferInfo(p.price, p.discountPrice).discountPercentage));
  }, [offerProducts]);

  return (
    <div>
      <HeroSection />

      {/* Customer Rewards Lookup */}
      <CustomerRewardsSection />

      {/* Dynamic Campaign Sections from Admin */}
      {!campaignsLoading && campaignCards.length > 0 && (
        <>
          <FlashSaleSection campaigns={campaignCards} />
          <CampaignsSection campaigns={campaignCards.filter(c => c.type !== 'flash_sale')} />
        </>
      )}

      {!loading && offerProducts.length > 0 && (
        <StatsBar totalOffers={offerProducts.length} highestDiscount={highestDiscount} />
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            {loading ? 'Loading offers...' : `Active Offers (${offerProducts.length})`}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Price reflects discount automatically applied at checkout
          </p>
        </div>
        {!loading && offerProducts.length > 0 && (
          <SortDropdown value={sortKey} onChange={setSortKey} />
        )}
      </div>

      {/* Offer Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
        ) : sortedOffers.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {sortedOffers.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}