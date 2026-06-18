'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, Sparkles, PartyPopper, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface RewardCelebrationProps {
  couponCode: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  campaignName: string;
  expiresAt: string;
  milestone: number;
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

export default function RewardCelebration({
  couponCode,
  discountType,
  discountValue,
  campaignName,
  expiresAt,
  milestone,
}: RewardCelebrationProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);

  const discountText = discountType === 'percentage'
    ? `${discountValue}% OFF`
    : `৳${discountValue} OFF`;

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode).then(() => {
      setCopied(true);
      toast.success('Coupon code copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.3 }}
        className="relative overflow-hidden rounded-2xl border-2 border-[#d7ffa4]/50 dark:border-[#d7ffa4]/30 bg-gradient-to-br from-[#f0fdf4] via-[#f7fee7] to-[#ecfdf5] dark:from-[#0d3d3e] dark:via-[#0a2f30] dark:to-[#0d3d3e] shadow-lg shadow-[#d7ffa4]/10 dark:shadow-[#d7ffa4]/5"
      >
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#d7ffa4]/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-2xl" />

        {/* Party popper decorations */}
        <div className="absolute top-4 right-8 text-2xl opacity-30 animate-bounce" style={{ animationDuration: '2s' }}>🎉</div>
        <div className="absolute top-8 right-4 text-xl opacity-20 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}>✨</div>
        <div className="absolute bottom-8 left-6 text-2xl opacity-25 animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>🎊</div>

        <div className="relative z-10 p-5 md:p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
              className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-[#d7ffa4] to-[#a8e063] flex items-center justify-center shadow-lg shadow-[#d7ffa4]/30"
            >
              <Award className="w-7 h-7 text-[#051a1b]" />
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#d7ffa4]/20 dark:bg-[#d7ffa4]/10 rounded-full text-xs font-semibold text-[#051a1b] dark:text-[#d7ffa4] mb-2">
                  <PartyPopper className="w-3.5 h-3.5" />
                  New Reward Unlocked!
                </div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl font-bold text-gray-900 dark:text-white"
              >
                🎉 Congratulations!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-gray-600 dark:text-gray-300 mt-1"
              >
                You have successfully completed{' '}
                <strong className="text-[#059669] dark:text-[#d7ffa4]">{milestone} orders</strong>{' '}
                and unlocked a special customer reward.
              </motion.p>
            </div>
          </div>

          {/* Reward Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 bg-white dark:bg-[#051a1b]/60 rounded-xl border border-[#d7ffa4]/30 dark:border-[#d7ffa4]/20 p-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                  {campaignName}
                </p>
                <p className="text-2xl font-extrabold text-[#059669] dark:text-[#d7ffa4] mt-0.5">
                  {discountText}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Use code at checkout · Valid until {formatDate(expiresAt)}
                </p>
              </div>

              {/* Coupon Code with Copy */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-[#051a1b] dark:bg-[#0d3d3e] border border-[#d7ffa4]/40 rounded-lg px-3 py-2 select-all">
                  <span className="text-lg font-mono font-bold tracking-[0.15em] text-[#d7ffa4]">
                    {couponCode}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2.5 rounded-lg bg-[#d7ffa4] hover:bg-[#c5f090] transition-colors text-[#051a1b]"
                  title="Copy coupon code"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-[#d7ffa4]/20 dark:border-[#d7ffa4]/10">
              💡 Please save this coupon code and use it during your next order. Copy it now to avoid losing it.
            </p>
          </motion.div>

          {/* Dismiss */}
          <div className="mt-3 text-right">
            <button
              onClick={() => setVisible(false)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}