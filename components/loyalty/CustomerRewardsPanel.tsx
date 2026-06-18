'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, Award, Ticket, Clock, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface RewardItem {
  id: string;
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  campaignName: string;
  expiresAt: string;
  unlockedAt: string;
}

interface CustomerRewardsPanelProps {
  rewards: RewardItem[];
  loading?: boolean;
  /** If true, shows "apply" button for checkout integration */
  checkoutMode?: boolean;
  onApplyReward?: (reward: RewardItem) => void;
  /** Email + phone for identity verification */
  email: string;
  phone: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function RewardsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="bg-gray-100 dark:bg-[#0b2a2b] rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-[#1f3334] rounded w-1/3 mb-2" />
          <div className="h-6 bg-gray-200 dark:bg-[#1f3334] rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-[#1f3334] rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export default function CustomerRewardsPanel({
  rewards,
  loading,
  checkoutMode,
  onApplyReward,
  email,
  phone,
}: CustomerRewardsPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(code);
      toast.success('Coupon code copied!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Award className={`w-5 h-5 ${rewards.length > 0 ? 'text-[#d7ffa4]' : 'text-gray-400'}`} />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
          Your Available Rewards
        </h3>
        {!loading && rewards.length > 0 && (
          <span className="text-xs font-medium text-[#059669] dark:text-[#d7ffa4] bg-[#d7ffa4]/10 dark:bg-[#d7ffa4]/10 px-2 py-0.5 rounded-full">
            {rewards.length} {rewards.length === 1 ? 'reward' : 'rewards'}
          </span>
        )}
      </div>

      {loading ? (
        <RewardsSkeleton />
      ) : rewards.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-[#0b2a2b] rounded-xl border border-gray-200 dark:border-[#1f3334]">
          <Gift className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No rewards available yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Complete more orders to unlock exclusive rewards!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward, index) => {
            const discountText = reward.discountType === 'percentage'
              ? `${reward.discountValue}% OFF`
              : `৳${reward.discountValue} OFF`;

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-[#0b2a2b] border border-[#d7ffa4]/30 dark:border-[#d7ffa4]/20 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                        {reward.campaignName}
                      </p>
                      <p className="text-xl font-extrabold text-[#059669] dark:text-[#d7ffa4] mt-0.5">
                        {discountText}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>Valid until {formatDate(reward.expiresAt)}</span>
                      </div>
                    </div>

                    {/* Coupon Code Display */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <div className="bg-[#051a1b] dark:bg-[#0d3d3e] border border-[#d7ffa4]/40 rounded-lg px-3 py-1.5">
                        <span className="text-sm font-mono font-bold tracking-[0.1em] text-[#d7ffa4]">
                          {reward.couponCode}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(reward.couponCode)}
                          className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[#1f3334] hover:bg-gray-200 dark:hover:bg-[#2a4546] text-gray-600 dark:text-gray-300 transition-colors"
                        >
                          {copiedId === reward.couponCode ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Code
                            </>
                          )}
                        </button>
                        {checkoutMode && onApplyReward && (
                          <button
                            onClick={() => onApplyReward(reward)}
                            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#d7ffa4] hover:bg-[#c5f090] text-[#051a1b] font-medium transition-colors"
                          >
                            <Ticket className="w-3 h-3" /> Apply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-[#1f3334]">
                    Unlocked after completing orders
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}