'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getCampaigns } from '@/lib/firebase/campaigns';
import { computeCampaignFields, TYPE_COLORS, CAMPAIGN_TYPE_LABELS } from '@/types/campaign';
import type { OfferCampaign } from '@/types/campaign';
import { Clock, Zap, Gift, Package, Star, Sparkles, Infinity } from 'lucide-react';

// ── Type icon map ──────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  flash_sale: '⚡',
  first_order: '🎁',
  combo: '📦',
  loyalty: '⭐',
  festival: '🌙',
  custom: '✦',
};

const TYPE_ICON_COLORS: Record<string, string> = {
  flash_sale: '#ef4444',
  first_order: '#4ade80',
  combo: '#a78bfa',
  loyalty: '#f59e0b',
  festival: '#c9a96e',
  custom: '#60a5fa',
};

const TYPE_BG_DIM: Record<string, string> = {
  flash_sale: 'rgba(239,68,68,0.12)',
  first_order: 'rgba(74,222,128,0.12)',
  combo: 'rgba(167,139,250,0.12)',
  loyalty: 'rgba(245,158,11,0.12)',
  festival: 'rgba(201,169,110,0.12)',
  custom: 'rgba(96,165,250,0.12)',
};

// ── Ribbon pill component ──────────────────────────────────────

function CampaignPill({ campaign }: { campaign: OfferCampaign }) {
  const computed = computeCampaignFields(campaign);
  const type = campaign.type;
  const color = TYPE_COLORS[type] || '#9aada8';
  const iconColor = TYPE_ICON_COLORS[type] || '#9aada8';
  const iconBg = TYPE_BG_DIM[type] || 'rgba(255,255,255,0.06)';
  const icon = TYPE_ICONS[type] || '✦';

  const isUrgent = type === 'flash_sale' && campaign.endDate && (new Date(campaign.endDate).getTime() - Date.now()) < 24 * 60 * 60 * 1000;
  const daysRemaining = computed.daysRemaining;

  return (
    <Link
      href={`/offers#${campaign.id}`}
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all duration-200 hover:-translate-y-0.5 shrink-0"
      style={{
        backgroundColor: 'var(--card-bg, #0a1a1b)',
        borderColor: isUrgent ? 'rgba(239,68,68,0.4)' : 'rgba(201,169,110,0.18)',
        borderWidth: isUrgent ? '1.5px' : '0.5px',
      }}
    >
      {/* LIVE badge for flash sales ending within 24h */}
      {isUrgent && (
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#ef4444' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
          Live
        </span>
      )}

      {/* Type icon circle */}
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </span>

      {/* Middle: title + time info */}
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xs font-medium truncate max-w-[120px]" style={{ color: 'var(--text1, #f0ebe0)' }}>
          {campaign.title}
        </span>
        <span
          className="text-[10px] whitespace-nowrap"
          style={{
            color: daysRemaining !== undefined && daysRemaining <= 3 ? '#ef4444' : 'var(--text3, #5a7070)',
          }}
        >
          {daysRemaining !== undefined && daysRemaining <= 3
            ? `Ends in ${daysRemaining}d ${new Date(campaign.endDate!).getHours()}h`
            : campaign.endDate
              ? `${daysRemaining} days left`
              : CAMPAIGN_TYPE_LABELS[type]
          }
        </span>
      </div>

      {/* Right: discount label */}
      <span
        className="font-bold shrink-0"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          color: isUrgent ? '#ef4444' : color,
        }}
      >
        {computed.discountLabel}
      </span>
    </Link>
  );
}

// ── Skeleton pill ──────────────────────────────────────────────

function SkeletonPill() {
  return (
    <div
      className="rounded-full shrink-0 animate-pulse"
      style={{
        width: 160,
        height: 38,
        backgroundColor: 'rgba(255,255,255,0.05)',
      }}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function CampaignRibbon() {
  const [campaigns, setCampaigns] = useState<OfferCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns(true)
      .then((all) => {
        const computed = all.map(computeCampaignFields);
        const available = computed
          .filter((c) => c.isAvailable)
          .sort((a, b) => {
            // Priority DESC, then endDate ASC
            const pDiff = (b.priority || 0) - (a.priority || 0);
            if (pDiff !== 0) return pDiff;
            if (a.endDate && b.endDate) return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            if (a.endDate) return -1;
            if (b.endDate) return 1;
            return 0;
          })
          .slice(0, 8);

        setCampaigns(available);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center gap-3 overflow-hidden py-3" style={{ paddingLeft: 'max(1rem, calc((100vw - 1280px) / 2))' }}>
        {[0, 1, 2].map((i) => (
          <SkeletonPill key={i} />
        ))}
      </div>
    );
  }

  // ── Empty state: don't render anything ──
  if (campaigns.length === 0) return null;

  // ── Single campaign: centered ──
  if (campaigns.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex justify-center py-3"
      >
        <CampaignPill campaign={campaigns[0]} />
      </motion.div>
    );
  }

  // ── Multiple campaigns: horizontal scroll ──
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 overflow-x-auto py-3 scrollbar-none"
        style={{
          paddingLeft: 'max(1rem, calc((100vw - 1280px) / 2))',
          paddingRight: 'max(1rem, calc((100vw - 1280px) / 2))',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
          .scrollbar-none::-webkit-scrollbar { display: none; }
        `}</style>

        <motion.div
          className="flex items-center gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              variants={{
                hidden: { opacity: 0, x: -8 },
                visible: { opacity: 1, x: 0 },
              }}
            >
              <CampaignPill campaign={campaign} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right-edge fade gradient */}
      <div
        className="hidden md:block pointer-events-none absolute right-0 top-0 bottom-0"
        style={{
          width: 40,
          background: 'linear-gradient(to right, transparent, var(--page-bg, #050d0e))',
        }}
      />
    </div>
  );
}