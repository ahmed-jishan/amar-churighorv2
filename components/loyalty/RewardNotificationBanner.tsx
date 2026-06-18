'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, PartyPopper, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RewardNotificationBannerProps {
  couponCode: string;
  discountText: string;
}

export default function RewardNotificationBanner({
  couponCode,
  discountText,
}: RewardNotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for dismissed state
    const dismissedBanner = localStorage.getItem(`reward_banner_dismissed_${couponCode}`);
    if (dismissedBanner) {
      setDismissed(true);
    }
  }, [couponCode]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`reward_banner_dismissed_${couponCode}`, 'true');
    } catch {}
  };

  if (!mounted || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-gradient-to-r from-[#0d3d3e] via-[#0a2f30] to-[#0d3d3e] dark:from-[#051a1b] dark:via-[#0d3d3e] dark:to-[#051a1b] border-b border-[#d7ffa4]/20"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #d7ffa4 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[#d7ffa4]/20 flex items-center justify-center">
                <PartyPopper className="w-4 h-4 text-[#d7ffa4]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  🎉 You unlocked a reward!
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Use code <strong className="text-[#d7ffa4] font-mono">{couponCode}</strong> on your next purchase and enjoy{' '}
                  <strong className="text-[#d7ffa4]">{discountText}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/offers"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d7ffa4]/10 hover:bg-[#d7ffa4]/20 border border-[#d7ffa4]/30 text-xs font-medium text-[#d7ffa4] transition-colors"
              >
                View Rewards
                <ChevronRight className="w-3 h-3" />
              </Link>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}