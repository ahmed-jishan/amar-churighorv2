'use client';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import ProductSkeleton from '@/components/ui/ProductSkeleton';
import LiveCountdown from '@/components/ui/LiveCountdown';
import { Tag, Percent, TrendingDown, ShoppingBag, ArrowUpDown, ChevronDown, Megaphone, Clock, Zap, Gift, Sparkles, Star, Award, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeOfferInfo } from '@/lib/offers/helpers';
import { getActiveCampaigns, toCampaignCardData } from '@/lib/firebase/campaigns';
import type { Product } from '@/types';
import type { OfferCampaign, CampaignCardData, CampaignType } from '@/types/campaign';
import { computeCampaignFields, CAMPAIGN_TYPE_LABELS, TYPE_COLORS } from '@/types/campaign';

// ── Types ──────────────────────────────────────────────────────
type SortKey = 'discount-high' | 'ending-soon' | 'newest' | 'price-low' | 'price-high';
type CampaignFilter = CampaignType | 'all';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'discount-high', label: 'Highest Discount' },
  { key: 'ending-soon', label: 'Ending Soonest' },
  { key: 'newest', label: 'Newest' },
  { key: 'price-low', label: 'Price Low-High' },
  { key: 'price-high', label: 'Price High-Low' },
];

const CAMPAIGN_FILTERS: { key: CampaignFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'flash_sale', label: 'Flash Sale' },
  { key: 'first_order', label: 'First Order' },
  { key: 'combo', label: 'Combo' },
  { key: 'loyalty', label: 'Loyalty' },
  { key: 'festival', label: 'Festival' },
  { key: 'custom', label: 'Custom' },
];

const TYPE_BADGE_STYLES: Record<string, string> = {
  flash_sale: 'text-red-600 dark:text-[#ef4444] bg-red-500/10 dark:bg-[rgba(239,68,68,0.12)]',
  first_order: 'text-green-600 dark:text-[#4ade80] bg-green-500/10 dark:bg-[rgba(74,222,128,0.12)]',
  combo: 'text-purple-600 dark:text-[#a78bfa] bg-purple-500/10 dark:bg-[rgba(167,139,250,0.12)]',
  loyalty: 'text-amber-600 dark:text-[#f59e0b] bg-amber-500/10 dark:bg-[rgba(245,158,11,0.12)]',
  festival: 'text-amber-700 dark:text-[#c9a96e] bg-amber-500/10 dark:bg-[rgba(201,169,110,0.12)]',
  custom: 'text-blue-600 dark:text-[#60a5fa] bg-blue-500/10 dark:bg-[rgba(96,165,250,0.12)]',
};

const CTA_LABELS: Record<string, string> = {
  flash_sale: 'Shop Flash Sale',
  first_order: 'Claim Now',
  combo: 'Shop Combo',
  loyalty: 'Check Eligibility',
  festival: 'Shop Now',
  custom: 'Shop Now',
};

/**
 * Generate CTA link for a campaign. Loyalty campaigns point to the eligibility page.
 * Other types use static paths.
 */
function getCtaLink(campaign: CampaignCardData): string {
  if (campaign.type === 'loyalty') {
    return `/campaigns/${campaign.id}/eligibility`;
  }
  const STATIC_LINKS: Record<string, string> = {
    flash_sale: '/products?sale=flash',
    first_order: '/products',
    combo: '/products',
    festival: '/products',
    custom: '/products',
  };
  return STATIC_LINKS[campaign.type] || '/products';
}

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sortProducts(products: Product[], sortKey: SortKey): Product[] {
  const sorted = [...products];
  switch (sortKey) {
    case 'discount-high':
      return sorted.sort((a, b) => {
        const aOff = computeOfferInfo(a.price, a.discountPrice);
        const bOff = computeOfferInfo(b.price, b.discountPrice);
        return bOff.discountPercentage - aOff.discountPercentage;
      });
    case 'ending-soon':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'price-low':
      return sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    case 'price-high':
      return sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? b.price));
    default:
      return sorted;
  }
}

// ── Flash Countdown (hand-rolled, updates every second) ───────
function FlashCountdown({ endDate }: { endDate: string }) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    function tick() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTime('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${String(d).padStart(2, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <span className="font-mono text-xl md:text-2xl font-bold text-red-600 dark:text-[#ef4444]">
      {time}
    </span>
  );
}

// ── Section Animation Wrapper ─────────────────────────────────
function SectionWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────
function CampaignSkeleton() {
  return (
    <div className="border rounded-xl p-5 animate-pulse bg-gray-100 dark:bg-[#0a1a1b] border-gray-200 dark:border-[rgba(201,169,110,0.18)]">
      <div className="h-4 w-20 rounded-full mb-3 bg-gray-200 dark:bg-[#0f2223]" />
      <div className="h-5 w-3/4 rounded mb-2 bg-gray-200 dark:bg-[#0f2223]" />
      <div className="h-3 w-full rounded mb-3 bg-gray-200 dark:bg-[#0f2223]" />
      <div className="h-8 w-24 rounded mb-3 bg-gray-200 dark:bg-[#0f2223]" />
      <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-[#0f2223]" />
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────
function HeroSection({ stats }: { stats: { active: number; maxDiscount: number; onSale: number } }) {
  return (
    <SectionWrapper>
      <div className="relative overflow-hidden rounded-[20px] border p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 bg-gradient-to-br from-gray-50 to-white dark:from-[#0a1a1b] dark:to-[#051a1b] border-gray-200 dark:border-[rgba(201,169,110,0.18)]">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 bg-amber-500/5 dark:bg-[rgba(201,169,110,0.12)]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 bg-amber-500/5 dark:bg-[rgba(201,169,110,0.12)]" />

        <div className="relative z-10 flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 border bg-amber-500/10 text-amber-700 dark:text-[#c9a96e] dark:bg-[rgba(201,169,110,0.12)] border-amber-200 dark:border-[rgba(201,169,110,0.18)]">
            <Tag className="w-3.5 h-3.5" />
            Limited Time Offers
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight text-gray-900 dark:text-[#f0ebe0]">
            Exclusive Offers Just for You
          </h1>
          <p className="text-sm leading-relaxed max-w-md mx-auto md:mx-0 text-gray-500 dark:text-[#9aada8]">
            Discover limited-time deals, special discounts, and handpicked offers curated just for you.
          </p>
          {/* Stats row */}
          {stats.active > 0 && (
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-amber-500/10 text-gray-600 dark:text-[#9aada8] dark:bg-[rgba(201,169,110,0.12)] border-gray-200 dark:border-[rgba(201,169,110,0.18)]">
                <Zap className="w-3 h-3 text-amber-600 dark:text-[#c9a96e]" />
                {stats.active} Active Offers
              </span>
              {stats.maxDiscount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-amber-500/10 text-gray-600 dark:text-[#9aada8] dark:bg-[rgba(201,169,110,0.12)] border-gray-200 dark:border-[rgba(201,169,110,0.18)]">
                  <Percent className="w-3 h-3 text-amber-600 dark:text-[#c9a96e]" />
                  Up to {stats.maxDiscount}% OFF
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-amber-500/10 text-gray-600 dark:text-[#9aada8] dark:bg-[rgba(201,169,110,0.12)] border-gray-200 dark:border-[rgba(201,169,110,0.18)]">
                <ShoppingBag className="w-3 h-3 text-amber-600 dark:text-[#c9a96e]" />
                {stats.onSale} Items on Sale
              </span>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center justify-center w-[88px] h-[88px] rounded-[20px] shrink-0 border bg-amber-500/10 dark:bg-[rgba(201,169,110,0.12)] border-amber-200 dark:border-[rgba(201,169,110,0.18)]">
          <Tag className="w-10 h-10 text-amber-600 dark:text-[#c9a96e]" />
        </div>
      </div>
    </SectionWrapper>
  );
}

// ── Flash Sale Banner ─────────────────────────────────────────
function FlashSaleBanner({ campaign }: { campaign: CampaignCardData }) {
  if (!campaign.isAvailable) return null;

  return (
    <SectionWrapper>
      <div className="relative overflow-hidden rounded-2xl border p-6 md:p-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-[#1a0808] dark:to-[#2a0d0d] border-red-200 dark:border-[rgba(239,68,68,0.25)]">
        {/* Pulsing dot + label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-[#ef4444]">Flash Sale — Live Now</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-[#f0ebe0]">
              {campaign.title}
            </h2>
            <p className="text-sm mt-1 max-w-md text-gray-500 dark:text-[#9aada8]">{campaign.description}</p>

            {/* Discount chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-3 bg-red-500/10 text-red-600 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#ef4444]">
              <Zap className="w-3 h-3" />
              {campaign.discountLabel}
            </div>

            {/* Countdown */}
            {campaign.endDate && (
              <div className="mt-3">
                <p className="text-xs mb-1 text-gray-400 dark:text-[#5a7070]">Ends in</p>
                <FlashCountdown endDate={campaign.endDate} />
              </div>
            )}
          </div>

          <div className="shrink-0 text-center md:text-right">
            {/* Show discount or image */}
            {campaign.image ? (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
                <img src={campaign.image} alt={campaign.title}
                  className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="text-4xl md:text-6xl font-bold text-red-600 dark:text-[#ef4444]">
                {campaign.discountLabel}
              </div>
            )}
            <a href="/products?sale=flash"
              className="inline-flex items-center gap-1.5 mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 text-white bg-red-600 dark:bg-[#ef4444]">
              Shop Flash Sale →
            </a>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// ── Campaign Card ─────────────────────────────────────────────
function CampaignCardItem({ campaign, index }: { campaign: CampaignCardData; index: number }) {
  const typeColor = TYPE_COLORS[campaign.type] || '#60a5fa';
  const isExhausted = campaign.isExhausted;
  const isEndingSoon = campaign.daysRemaining !== undefined && campaign.daysRemaining <= 3 && campaign.daysRemaining >= 0;
  const usagePercent = campaign.usageLimit && campaign.usageLimit > 0
    ? Math.min(100, Math.round(((campaign.usageCount || 0) / campaign.usageLimit) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      style={{
        opacity: isExhausted ? 0.5 : 1,
      }}
      className="border rounded-[18px] p-[22px] transition-all duration-300 hover:-translate-y-[3px] group bg-white dark:bg-[#0a1a1b] border-gray-200 dark:border-[rgba(201,169,110,0.18)]"
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.4)'; }}
      onMouseLeave={e => {
        if (isExhausted) {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.08)';
        } else {
          // Reset to original based on theme
          const isDark = document.documentElement.classList.contains('dark');
          (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(201,169,110,0.18)' : '#e5e7eb';
        }
      }}
    >
      {/* ── With image layout ── */}
      {campaign.image ? (
        <>
          <div className="relative -mx-[22px] -mt-[22px] mb-4 overflow-hidden rounded-t-[18px] aspect-video"
            style={{ backgroundColor: typeColor + '15' }}>
            <img src={campaign.image} alt={campaign.title}
              className="w-full h-full object-contain" />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(to top, ${typeColor}dd 0%, ${typeColor}99 30%, transparent 60%, ${typeColor}22 100%)`,
              mixBlendMode: 'multiply',
            }} />
            {/* Dark bottom gradient overlay for text */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
            }} />
            {/* Discount badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: typeColor }}>
              {campaign.discountLabel}
            </div>
            {/* Type badge */}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${TYPE_BADGE_STYLES[campaign.type]}`}>
                {CAMPAIGN_TYPE_LABELS[campaign.type]}
              </span>
            </div>
          </div>
          <h3 className="text-[15px] font-medium mb-1 truncate text-gray-900 dark:text-[#f0ebe0]">{campaign.title}</h3>
          <p className="text-xs mb-3 line-clamp-2 text-gray-500 dark:text-[#9aada8]">{campaign.description}</p>
        </>
      ) : (
        <>
          {/* ── No image layout: discount label prominently ── */}
          <div className="flex items-start justify-between mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${TYPE_BADGE_STYLES[campaign.type]}`}>
              {CAMPAIGN_TYPE_LABELS[campaign.type]}
            </span>
            <div className="text-2xl md:text-[28px] font-bold leading-none" style={{ color: typeColor, fontFamily: 'Georgia, serif' }}>
              {campaign.discountLabel}
            </div>
          </div>
          <h3 className="text-[15px] font-medium mb-1 text-gray-900 dark:text-[#f0ebe0]">{campaign.title}</h3>
          <p className="text-xs mb-3 line-clamp-2 text-gray-500 dark:text-[#9aada8]">{campaign.description}</p>
        </>
      )}

      {/* ── Common content below image/text ── */}
      {/* Meta pills */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {campaign.endDate && (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#0f2223] text-gray-500 dark:text-[#5a7070]">
            <Clock className="w-3 h-3" />
            {isEndingSoon ? (
              <span className="text-red-600 dark:text-[#ef4444]">Ending soon!</span>
            ) : (
              formatDate(campaign.endDate)
            )}
          </span>
        )}
        {campaign.targetCategories && campaign.targetCategories.length > 0 && !campaign.targetCategories.includes('All') && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#0f2223] text-gray-500 dark:text-[#5a7070]">
            {campaign.targetCategories[0]}
          </span>
        )}
        {campaign.usageLimit && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#0f2223] text-gray-500 dark:text-[#5a7070]">
            {campaign.usageCount || 0}/{campaign.usageLimit} used
          </span>
        )}
      </div>

      {/* Usage progress bar */}
      {campaign.usageLimit && campaign.usageLimit > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1 text-gray-400 dark:text-[#5a7070]">
            <span>Usage</span>
            <span>{campaign.usageCount || 0} / {campaign.usageLimit}</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-[#0f2223]">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${usagePercent}%`, backgroundColor: typeColor }} />
          </div>
        </div>
      )}

      {/* Exhausted overlay */}
      {isExhausted && (
        <div className="mb-3 px-2 py-1 rounded-md text-xs font-semibold text-center bg-red-500/10 text-red-600 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#ef4444]">
          Offer Exhausted
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-[rgba(201,169,110,0.18)]">
        {campaign.endDate && campaign.daysRemaining !== undefined && campaign.daysRemaining >= 0 && !isEndingSoon && (
          <span className="text-[10px] text-gray-400 dark:text-[#5a7070]">
            {campaign.daysRemaining} day{campaign.daysRemaining !== 1 ? 's' : ''} left
          </span>
        )}
        {isEndingSoon && (
          <span className="text-[10px] font-semibold text-red-600 dark:text-[#ef4444]">
            ⏳ Ending soon!
          </span>
        )}
        {!campaign.endDate && <span />}
        <a href={getCtaLink(campaign)}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${isExhausted ? 'opacity-40 pointer-events-none' : 'hover:opacity-80'} text-white`}
          style={{
            backgroundColor: isExhausted ? '#9aada8' : typeColor,
          }}>
          {CTA_LABELS[campaign.type] || 'Shop Now'}
        </a>
      </div>
    </motion.div>
  );
}

// ── Sort Dropdown ──────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  const [open, setOpen] = useState(false);
  const selected = SORT_OPTIONS.find(o => o.key === value)!;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all bg-white dark:bg-[#0a1a1b] border-gray-200 dark:border-[rgba(201,169,110,0.18)] text-gray-600 dark:text-[#9aada8]">
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            className="absolute right-0 mt-1.5 min-w-[200px] rounded-xl border shadow-xl z-40 overflow-hidden bg-white dark:bg-[#0a1a1b] border-gray-200 dark:border-[rgba(201,169,110,0.18)]">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all"
                style={{
                  color: value === opt.key ? '#c9a96e' : undefined,
                  backgroundColor: value === opt.key ? 'rgba(201,169,110,0.12)' : 'transparent',
                  borderLeft: value === opt.key ? '2px solid #c9a96e' : '2px solid transparent',
                }}>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Discounted Products Section ────────────────────────────────
function DiscountedProducts({ products }: { products: Product[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('discount-high');
  const [catFilter, setCatFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filtered = useMemo(() => {
    let list = catFilter === 'all' ? products : products.filter(p => p.category === catFilter);
    return sortProducts(list, sortKey);
  }, [products, catFilter, sortKey]);

  if (products.length === 0) return null;

  return (
    <SectionWrapper>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-[#f0ebe0]">
            Discounted Products
          </h2>
          <span className="text-xs text-gray-400 dark:text-[#5a7070]">{products.length} products</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Category filters */}
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={`text-xs px-2.5 py-1.5 rounded-full font-medium border transition-all ${
                  catFilter === cat
                    ? 'bg-[#c9a96e] text-[#050d0e] border-[#c9a96e]'
                    : 'bg-transparent text-gray-600 dark:text-[#9aada8] border-gray-200 dark:border-[rgba(201,169,110,0.18)]'
                }`}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
          <SortDropdown value={sortKey} onChange={setSortKey} />
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.03 }}>
            <ProductCard product={p} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-[#5a7070]">No discounted products in this category right now.</p>
        </div>
      )}
    </SectionWrapper>
  );
}

// ── Empty State ───────────────────────────────────────────────
function EmptyOffersState() {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 bg-amber-500/10">
        <Gift className="w-10 h-10 text-amber-600 dark:text-[#c9a96e]" />
      </div>
      <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-[#f0ebe0]">No Active Offers Right Now</h2>
      <p className="text-sm max-w-md text-gray-500 dark:text-[#9aada8]">
        Stay tuned for upcoming discounts and special promotions. Check back soon.
      </p>
      <a href="/products"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 text-white bg-amber-600 dark:bg-[#c9a96e]">
        <ShoppingBag className="w-4 h-4" />
        Browse All Products
      </a>
    </motion.div>
  );
}

// ── Error Section ──────────────────────────────────────────────
function ErrorSection({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-10">
      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600 dark:text-[#ef4444]" />
      <p className="text-sm text-gray-500 dark:text-[#9aada8]">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border transition-all border-gray-200 dark:border-[rgba(201,169,110,0.18)] text-amber-600 dark:text-[#c9a96e]">
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function OffersPage() {
  const { products, loading: productsLoading } = useProducts({ isActive: true });
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignError, setCampaignError] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('all');
  const [campaignSort, setCampaignSort] = useState<SortKey>('discount-high');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignError(false);
    try {
      const data = await getActiveCampaigns();
      setCampaigns(data.map(toCampaignCardData));
    } catch {
      setCampaignError(true);
    }
    setCampaignsLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    let list = campaignFilter === 'all' ? campaigns : campaigns.filter(c => c.type === campaignFilter);
    return [...list].sort((a, b) => {
      if (campaignSort === 'discount-high') return (b.discountValue || 0) - (a.discountValue || 0);
      if (campaignSort === 'ending-soon') {
        const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity;
        return aEnd - bEnd;
      }
      return (b.priority || 0) - (a.priority || 0);
    });
  }, [campaigns, campaignFilter, campaignSort]);

  // Offer products
  const offerProducts = useMemo(() => {
    return products.filter(p => {
      const off = computeOfferInfo(p.price, p.discountPrice);
      return off.isOffer;
    });
  }, [products]);

  // Stats
  const stats = useMemo(() => ({
    active: campaigns.filter(c => c.isAvailable).length,
    maxDiscount: offerProducts.length > 0 ? Math.max(...offerProducts.map(p => computeOfferInfo(p.price, p.discountPrice).discountPercentage)) : 0,
    onSale: offerProducts.length,
  }), [campaigns, offerProducts]);

  // Flash sale
  const flashSale = useMemo(() => campaigns.find(c => c.type === 'flash_sale' && c.isAvailable), [campaigns]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCampaigns()]);
    setRefreshing(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all border-gray-200 dark:border-[rgba(201,169,110,0.18)] text-gray-500 dark:text-[#9aada8]">
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Hero */}
      <HeroSection stats={stats} />

      {/* Flash Sale Banner */}
      {flashSale && <div className="mt-6 md:mt-8"><FlashSaleBanner campaign={flashSale} /></div>}

      {/* Active Campaigns Section */}
      {(campaigns.length > 0 || campaignsLoading) && (
        <SectionWrapper>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-8">
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-[#f0ebe0]">Active Campaigns</h2>
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-[rgba(201,169,110,0.18)] text-gray-500 dark:text-[#9aada8]">
                {campaigns.length} active
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                {CAMPAIGN_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setCampaignFilter(f.key)}
                    className={`text-xs px-2.5 py-1.5 rounded-full font-medium border transition-all ${
                      campaignFilter === f.key
                        ? 'bg-[#c9a96e] text-[#050d0e] border-[#c9a96e]'
                        : 'bg-transparent text-gray-600 dark:text-[#9aada8] border-gray-200 dark:border-[rgba(201,169,110,0.18)]'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <SortDropdown value={campaignSort} onChange={setCampaignSort} />
            </div>
          </div>

          {campaignError ? (
            <ErrorSection message="Failed to load campaigns" onRetry={fetchCampaigns} />
          ) : campaignsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {Array(4).fill(0).map((_, i) => <CampaignSkeleton key={i} />)}
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {filteredCampaigns.map((c, i) => (
                <CampaignCardItem key={c.id} campaign={c} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-sm py-8 text-center text-gray-400 dark:text-[#5a7070]">No matching campaigns found.</p>
          )}
        </SectionWrapper>
      )}

      {/* Discounted Products */}
      {productsLoading ? (
        <div className="mt-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-[#f0ebe0]">Discounted Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        </div>
      ) : offerProducts.length > 0 ? (
        <div className="mt-8">
          <DiscountedProducts products={offerProducts} />
        </div>
      ) : !campaignsLoading && campaigns.length === 0 ? (
        <EmptyOffersState />
      ) : null}

      {/* Bottom padding */}
      <div className="h-12" />
    </div>
  );
}