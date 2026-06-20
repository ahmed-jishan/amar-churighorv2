'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCampaignById } from '@/lib/firebase/campaigns';
import type { OfferCampaign } from '@/types/campaign';
import { computeCampaignFields, TYPE_COLORS, CAMPAIGN_TYPE_LABELS } from '@/types/campaign';
import { Award, ArrowLeft, CheckCircle, XCircle, Clock, ShoppingBag, Tag, Star } from 'lucide-react';

function SkeletonLoader() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 animate-pulse">
      <div className="h-6 w-32 rounded-lg mb-6" style={{ backgroundColor: 'rgba(201,169,110,0.12)' }} />
      <div className="rounded-2xl border p-8" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
        <div className="h-8 w-3/4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(201,169,110,0.1)' }} />
        <div className="h-4 w-full rounded-lg mb-3" style={{ backgroundColor: 'rgba(201,169,110,0.06)' }} />
        <div className="h-4 w-2/3 rounded-lg mb-6" style={{ backgroundColor: 'rgba(201,169,110,0.06)' }} />
        <div className="h-24 w-full rounded-xl" style={{ backgroundColor: 'rgba(201,169,110,0.06)' }} />
      </div>
    </div>
  );
}

export default function CampaignEligibilityPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;

  const [campaign, setCampaign] = useState<OfferCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    setError(false);
    getCampaignById(campaignId)
      .then((data) => {
        if (!data) { setError(true); return; }
        const computed = computeCampaignFields(data);
        setCampaign(computed);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return <SkeletonLoader />;

  if (error || !campaign) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#f0ebe0' }}>Campaign Not Found</h2>
        <p className="text-sm mb-6" style={{ color: '#5a7070' }}>This campaign doesn't exist or has been removed.</p>
        <Link href="/offers" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor: '#c9a96e', color: '#050d0e' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to Offers
        </Link>
      </div>
    );
  }

  const color = TYPE_COLORS[campaign.type] || '#9aada8';
  const dateStr = campaign.endDate
    ? new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Back button */}
        <Link
          href="/offers"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors hover:opacity-70"
          style={{ color: '#9aada8' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Offers
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--card-bg, #0a1a1b)',
            borderColor: 'rgba(201,169,110,0.18)',
          }}
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Award className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                  {CAMPAIGN_TYPE_LABELS[campaign.type]}
                </span>
                <h1 className="text-xl md:text-2xl font-bold leading-tight mt-0.5" style={{ color: '#f0ebe0' }}>
                  {campaign.title}
                </h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#9aada8' }}>
              {campaign.description}
            </p>
          </div>

          {/* Eligibility Criteria Body */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Discount Info */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: `${color}10` }}>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" style={{ color }} />
                <span className="text-sm font-semibold" style={{ color: '#f0ebe0' }}>
                  {campaign.discountLabel}
                </span>
              </div>
              {campaign.minOrderAmount && campaign.minOrderAmount > 0 && (
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" style={{ color: '#9aada8' }} />
                  <span className="text-xs" style={{ color: '#9aada8' }}>
                    Min. Order: ৳{campaign.minOrderAmount}
                  </span>
                </div>
              )}
              {dateStr && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#9aada8' }} />
                  <span className="text-xs" style={{ color: '#9aada8' }}>
                    Valid until {dateStr}
                  </span>
                </div>
              )}
            </div>

            {/* Eligibility Criteria Card */}
            <div>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider flex items-center gap-2" style={{ color: '#c9a96e' }}>
                <CheckCircle className="w-4 h-4" />
                Eligibility Criteria
              </h2>

              <div
                className="p-5 rounded-xl border text-sm leading-relaxed"
                style={{
                  backgroundColor: 'rgba(201,169,110,0.04)',
                  borderColor: 'rgba(201,169,110,0.15)',
                  color: '#f0ebe0',
                }}
              >
                {campaign.eligibilityCriteria ? (
                  <div className="whitespace-pre-wrap">{campaign.eligibilityCriteria}</div>
                ) : (
                  <>
                    {/* Default eligibility display based on campaign fields */}
                    <ul className="space-y-3">
                      {campaign.loyaltyMinOrders && campaign.loyaltyMinOrders > 0 && (
                        <li className="flex items-start gap-3">
                          <Star className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
                          <span>
                            Complete at least <strong>{campaign.loyaltyMinOrders}</strong> order{campaign.loyaltyMinOrders > 1 ? 's' : ''} with us to qualify.
                          </span>
                        </li>
                      )}
                      {campaign.minOrderAmount && campaign.minOrderAmount > 0 && (
                        <li className="flex items-start gap-3">
                          <ShoppingBag className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
                          <span>
                            Minimum order value of <strong>৳{campaign.minOrderAmount}</strong> required.
                          </span>
                        </li>
                      )}
                      {campaign.couponCode && (
                        <li className="flex items-start gap-3">
                          <Award className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
                          <span>
                            Use coupon code <strong className="font-mono tracking-wider">{campaign.couponCode}</strong> at checkout to receive your discount.
                          </span>
                        </li>
                      )}
                      {campaign.expiresAfterDays && (
                        <li className="flex items-start gap-3">
                          <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
                          <span>
                            Reward is valid for <strong>{campaign.expiresAfterDays} day{campaign.expiresAfterDays !== 1 ? 's' : ''}</strong> after eligibility is confirmed.
                          </span>
                        </li>
                      )}
                      {(!campaign.loyaltyMinOrders && !campaign.minOrderAmount) && (
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#4ade80' }} />
                          <span>This offer is available to all customers!</span>
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* How to Claim */}
            <div>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider flex items-center gap-2" style={{ color: '#c9a96e' }}>
                <ShoppingBag className="w-4 h-4" />
                How to Claim
              </h2>
              <div
                className="p-5 rounded-xl border text-sm leading-relaxed space-y-3"
                style={{
                  backgroundColor: 'rgba(201,169,110,0.04)',
                  borderColor: 'rgba(201,169,110,0.15)',
                  color: '#9aada8',
                }}
              >
                <p>1. Ensure you meet all the eligibility criteria listed above.</p>
                <p>2. Browse our collection and add qualifying items to your cart.</p>
                {campaign.couponCode ? (
                  <p>3. At checkout, enter coupon code <strong className="font-mono tracking-wider text-[#f0ebe0]">{campaign.couponCode}</strong> to apply your discount.</p>
                ) : (
                  <p>3. Proceed to checkout — your discount will be applied automatically.</p>
                )}
                <p>4. Complete your order and enjoy the savings!</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/products"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#c9a96e', color: '#050d0e' }}
              >
                <ShoppingBag className="w-4 h-4" />
                Start Shopping
              </Link>
              <Link
                href="/my-orders"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all border"
                style={{ borderColor: 'rgba(201,169,110,0.25)', color: '#9aada8' }}
              >
                <Clock className="w-4 h-4" />
                My Orders
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}