'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, RotateCcw, Banknote, ShieldCheck, LucideIcon } from 'lucide-react';
import { getActiveTrustBarItems, TrustBarItem } from '@/lib/firebase/trustBar';

const ICON_MAP: Record<string, LucideIcon> = {
  Truck,
  RotateCcw,
  Banknote,
  ShieldCheck,
};

const DEFAULT_ITEMS = [
  { icon: 'Truck', title: 'Free Delivery', subtitle: 'Orders above ৳999' },
  { icon: 'RotateCcw', title: 'Easy Returns', subtitle: '7-day return policy' },
  { icon: 'Banknote', title: 'Cash on Delivery', subtitle: 'Pay when you receive' },
  { icon: 'ShieldCheck', title: '100% Authentic', subtitle: 'Verified products only' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function TrustBarItemCard({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  const Icon = ICON_MAP[icon];
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center text-center gap-2 py-4"
    >
      <div className="w-12 h-12 rounded-full bg-[#d7ffa4]/10 dark:bg-[#d7ffa4]/10 flex items-center justify-center">
        {Icon ? <Icon className="w-6 h-6 text-[#d7ffa4]" /> : <Truck className="w-6 h-6 text-[#d7ffa4]" />}
      </div>
      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </motion.div>
  );
}

export default function TrustBar() {
  const [items, setItems] = useState<TrustBarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveTrustBarItems()
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Use Firestore data if available, otherwise use defaults
  const displayItems = items.length > 0
    ? items
    : DEFAULT_ITEMS.map((d, i) => ({
        id: `default-${i}`,
        icon: d.icon,
        title: d.title,
        subtitle: d.subtitle,
        isActive: true,
        order: i,
      }));

  if (loading) return <div className="h-24 animate-pulse bg-gray-50 dark:bg-[#0b1a1b]" />;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
      className="bg-gray-50 dark:bg-[#0b1a1b] border-t border-b border-gray-200 dark:border-[#1f3334]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
          {displayItems.map((item) => (
            <TrustBarItemCard
              key={item.id}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}