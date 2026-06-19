'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getCampaigns } from '@/lib/firebase/campaigns';
import { computeCampaignFields, TYPE_COLORS, CAMPAIGN_TYPE_LABELS } from '@/types/campaign';
import type { OfferCampaign, CampaignType } from '@/types/campaign';
import {
  Clock, Calendar, Infinity, ArrowRight, Tag, Users,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────

const TYPE_ICONS: Record<CampaignType, string> = {
  flash_sale: '⚡',
  first_order: '🎁',
  combo: '📦',
  loyalty: '⭐',
  festival: '🌙',
  custom: '✦',
};

const GRADIENT_BLOCKS: Record<CampaignType, string> = {
  flash_sale: 'linear-gradient(135deg, #1a0808, #2a0d0d)',
  first_order: 'linear-gradient(135deg, #071a09, #0d2a0e)',
  combo: 'linear-gradient(135deg, #120d1a, #1e1530)',
  loyalty: 'linear-gradient(135deg, #1a1208, #2a1c08)',
  festival: 'linear-gradient(135deg, #1a1508, #2a1f08)',
  custom: 'linear-gradient(135deg, #080d1a, #0d1530)',
};

const CTA_STYLES: Record<CampaignType, { bg: string; text: string; border?: string }> = {
  flash_sale: { bg: '#ef4444', text: '#ffffff' },
  first_order: { bg: 'transparent', text: '#4ade80', border: '#4ade80' },
  combo: { bg: '#c9a96e', text: '#050d0e' },
  loyalty: { bg: 'transparent', text: '#f59e0b', border: '#f59e0b' },
  festival: { bg: '#c9a96e', text: '#050d0e' },
  custom: { bg: 'transparent', text: '#60a5fa', border: '#60a5fa' },
};

// ── Progress Bar ───────────────────────────────────────────────

function UsageProgressBar({
  usageCount,
  usageLimit,
  type,
}: {
  usageCount?: number;
  usageLimit?: number | null;
  type: CampaignType;
}) {
  if (!usageLimit || usageLimit <= 0) return null;
  const pct = Math.min(100, ((usageCount || 0) / usageLimit) * 100);
  const color = TYPE_COLORS[type] || '#c9a96e';

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px]" style={{ color: 'var(--text3, #5a7070)' }}>Usage</span>
        <span className="text-[11px]" style={{ color: 'var(--text3, #5a7070)' }}>
          {usageCount || 0}/{usageLimit}
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{
          height: 4,
          backgroundColor: 'rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ── Type Badge ─────────────────────────────────────────────────

function TypeBadge({ type }: { type: CampaignType }) {
  const color = TYPE_COLORS[type] || '#9aada8';
  const icon = TYPE_ICONS[type] || '✦';
  const label = CAMPAIGN_TYPE_LABELS[type] || type;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        color,
        border: `0.5px solid ${color}40`,
        letterSpacing: '0.06em',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// ── Campaign Card ──────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: OfferCampaign }) {
  const computed = computeCampaignFields(campaign);
  const type = campaign.type as CampaignType;
  const hasImage = !!campaign.image;
  const daysRemaining = computed.daysRemaining;
  const gradient = GRADIENT_BLOCKS[type] || GRADIENT_BLOCKS.custom;
  const ctaStyle = CTA_STYLES[type] || CTA_STYLES.custom;

  // Format date for display
  function formatDate(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-250"
      style={{
        backgroundColor: 'var(--card-bg, #0a1a1b)',
        borderColor: 'rgba(201,169,110,0.18)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(201,169,110,0.18)';
      }}
    >
      <Link href={`/offers#${campaign.id}`} className="block">
        {/* Image or gradient block */}
        {hasImage ? (
          <div className="relative h-[160px] overflow-hidden">
            <Image
              src={campaign.image!}
              alt={campaign.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* Overlay gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, var(--card-bg, #0a1a1b) 0%, transparent 60%)',
              }}
            />
            {/* Badges on overlay */}
            <div className="absolute bottom-3 left-3">
              <TypeBadge type={type} />
            </div>
            <div className="absolute bottom-3 right-3">
              <span
                className="font-bold drop-shadow-lg"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '24px',
                  color: TYPE_COLORS[type] || '#c9a96e',
                }}
              >
                {computed.discountLabel}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="relative h-[120px] flex items-center justify-center overflow-hidden"
            style={{ background: gradient }}
          >
            {/* Large emoji */}
            <span className="text-5xl opacity-15 select-none">
              {TYPE_ICONS[type] || '✦'}
            </span>
            {/* Type badge */}
            <div className="absolute bottom-3 left-3">
              <TypeBadge type={type} />
            </div>
            {/* Discount label */}
            <div className="absolute bottom-3 right-3">
              <span
                className="font-bold"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '24px',
                  color: TYPE_COLORS[type] || '#c9a96e',
                }}
              >
                {computed.discountLabel}
              </span>
            </div>
          </div>
        )}

        {/* Card body */}
        <div className="p-[18px]">
          {/* Title */}
          <h3
            className="text-[15px] font-medium leading-snug mb-1.5 line-clamp-1"
            style={{ color: 'var(--text1, #f0ebe0)' }}
          >
            {campaign.title}
          </h3>

          {/* Description */}
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: 'var(--text2, #9aada8)' }}
          >
            {campaign.description}
          </p>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {campaign.type === 'flash_sale' && campaign.endDate && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  border: '0.5px solid rgba(239,68,68,0.2)',
                }}
              >
                <Clock className="w-3 h-3" />
                {daysRemaining !== undefined && daysRemaining <= 3 ? 'Ending soon' : 'Limited time'}
              </span>
            )}
            {campaign.minOrderAmount && campaign.minOrderAmount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  color: 'var(--text3, #5a7070)',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                }}
              >
                <Tag className="w-3 h-3" />
                Min. ৳{campaign.minOrderAmount}
              </span>
            )}
            {campaign.firstOrderOnly && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]"
                style={{
                  backgroundColor: 'rgba(74,222,128,0.1)',
                  color: '#4ade80',
                  border: '0.5px solid rgba(74,222,128,0.2)',
                }}
              >
                <Users className="w-3 h-3" />
                First order
              </span>
            )}
          </div>

          {/* Usage progress bar */}
          {campaign.usageLimit && campaign.usageLimit > 0 && (
            <UsageProgressBar
              usageCount={campaign.usageCount}
              usageLimit={campaign.usageLimit}
              type={type}
            />
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t" style={{ borderColor: 'rgba(201,169,110,0.1)' }}>
            {/* Left: time info */}
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text3, #5a7070)' }}>
              {daysRemaining !== undefined && daysRemaining <= 3 && campaign.endDate ? (
                <span className="flex items-center gap-1" style={{ color: '#ef4444' }}>
                  <Clock className="w-3 h-3" />
                  <span>Ending soon!</span>
                </span>
              ) : campaign.endDate ? (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(campaign.endDate)}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Infinity className="w-3 h-3" />
                  <span>No expiry</span>
                </span>
              )}
            </div>

            {/* Right: CTA button */}
            <span
              className="inline-flex items-center gap-1 px-[10px] py-[5px] rounded-lg text-[11px] font-medium transition-all group-hover:opacity-90"
              style={{
                backgroundColor: ctaStyle.bg,
                color: ctaStyle.text,
                border: ctaStyle.border ? `1px solid ${ctaStyle.border}` : 'none',
              }}
            >
              View Deal
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border overflow-hidden animate-pulse" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
      <div style={{ height: 160, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      <div className="p-[18px] space-y-3">
        <div className="h-3 rounded" style={{ width: '70%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div className="h-2.5 rounded" style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <div className="h-2.5 rounded" style={{ width: '55%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <div className="h-2 rounded" style={{ width: '40%', backgroundColor: 'rgba(255,255,255,0.04) ' }} />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function ActiveOffersSection() {
  const [campaigns, setCampaigns] = useState<OfferCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns(true)
      .then((all) => {
        const computed = all.map(computeCampaignFields);
        const available = computed
          .filter((c) => c.isAvailable)
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .slice(0, 3);

        setCampaigns(available);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <section className="pt-20 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Skeleton header */}
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <div className="h-6 w-40 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <div className="h-3 w-36 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Empty state: render nothing ──
  if (campaigns.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="pt-20 pb-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-1">
              <span
                className="block"
                style={{
                  width: 20,
                  height: 1.5,
                  backgroundColor: '#c9a96e',
                }}
              />
              <span
                className="text-[11px] uppercase tracking-wider font-medium"
                style={{
                  color: '#c9a96e',
                  letterSpacing: '0.12em',
                }}
              >
                Limited Time
              </span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-normal leading-tight"
              style={{
                fontFamily: 'Georgia, serif',
                color: 'var(--text1, #f0ebe0)',
              }}
            >
              Active Offers
            </h2>
            <p className="text-xs md:text-sm mt-1" style={{ color: 'var(--text2, #9aada8)' }}>
              Applied automatically at checkout
            </p>
          </div>

          <Link
            href="/offers"
            className="inline-flex items-center gap-1.5 px-[18px] py-[8px] border rounded-lg text-xs font-medium transition-all hover:bg-[rgba(201,169,110,0.12)] shrink-0"
            style={{
              borderColor: 'rgba(201,169,110,0.25)',
              color: 'var(--text1, #f0ebe0)',
            }}
          >
            View All Offers
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <CampaignCard campaign={campaign} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}