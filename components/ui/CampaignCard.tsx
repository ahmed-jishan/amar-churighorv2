'use client';
import { CampaignCardData } from '@/lib/offers/campaignTypes';
import { getCampaignDiscountLabel, getCampaignDescription } from '@/lib/offers/campaignEngine';
import LiveCountdown from './LiveCountdown';
import { motion } from 'framer-motion';
import { Clock, Tag, Gift, Flame, Sparkles, Star, Award } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flash_sale: <Flame className="w-5 h-5" />,
  first_customer: <Gift className="w-5 h-5" />,
  combo: <Tag className="w-5 h-5" />,
  loyalty_reward: <Award className="w-5 h-5" />,
  festival: <Sparkles className="w-5 h-5" />,
  custom: <Star className="w-5 h-5" />,
};

const TYPE_BG_CLASSES: Record<string, string> = {
  flash_sale: 'from-red-500/10 to-orange-500/10 border-red-500/20',
  first_customer: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
  combo: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
  loyalty_reward: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
  festival: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20',
  custom: 'from-cyan-500/10 to-teal-500/10 border-cyan-500/20',
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  flash_sale: 'bg-red-500/20 text-red-300',
  first_customer: 'bg-green-500/20 text-green-300',
  combo: 'bg-blue-500/20 text-blue-300',
  loyalty_reward: 'bg-purple-500/20 text-purple-300',
  festival: 'bg-amber-500/20 text-amber-300',
  custom: 'bg-cyan-500/20 text-cyan-300',
};

export default function CampaignCard({ campaign, index = 0 }: { campaign: CampaignCardData; index?: number }) {
  const label = getCampaignDiscountLabel(campaign);
  const description = getCampaignDescription(campaign);
  const bgClass = TYPE_BG_CLASSES[campaign.type] || TYPE_BG_CLASSES.custom;
  const badgeClass = TYPE_BADGE_CLASSES[campaign.type] || TYPE_BADGE_CLASSES.custom;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${bgClass} p-5 md:p-6 flex flex-col min-h-[200px] border ${campaign.themeColor ? `border-${campaign.themeColor}/20` : ''}`}
    >
      {/* Decorative bg element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />

      {/* Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          {TYPE_ICONS[campaign.type] || TYPE_ICONS.custom}
          <span className="capitalize">{campaign.type.replace(/_/g, ' ')}</span>
        </div>
        {campaign.badgeText && (
          <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full font-bold uppercase">
            {campaign.badgeText}
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-lg md:text-xl font-bold mb-1 leading-tight">{campaign.title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-400 mb-3 flex-1 line-clamp-2">{campaign.description || description}</p>

      {/* Discount Label */}
      <div className="text-2xl md:text-3xl font-extrabold text-green-400 mb-3">
        {label}
      </div>

      {/* Countdown */}
      {campaign.endDate && (
        <div className="mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Ends in</span>
          </div>
          <LiveCountdown endDate={campaign.endDate} />
        </div>
      )}
    </motion.div>
  );
}