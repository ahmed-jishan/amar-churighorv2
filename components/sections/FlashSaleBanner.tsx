'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getActiveFlashSale, FlashSale } from '@/lib/firebase/flashSale';
import NeoButton from '@/components/ui/NeoButton';

interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
}

function computeCountdown(endTime: string): Countdown | null {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

function CountdownDisplay({ endTime }: { endTime: string }) {
  const [countdown, setCountdown] = useState<Countdown | null>(computeCountdown(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const cd = computeCountdown(endTime);
      setCountdown(cd);
      if (!cd) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (!countdown) return null;

  return (
    <div className="flex items-center gap-3 md:gap-4">
      {[
        { value: countdown.hours, label: 'HRS' },
        { value: countdown.minutes, label: 'MIN' },
        { value: countdown.seconds, label: 'SEC' },
      ].map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-2xl md:text-4xl font-bold leading-none font-mono tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80">{label}</span>
        </div>
      ))}
    </div>
  );
}

const BG_CLASSES: Record<string, string> = {
  accent: 'bg-[#d7ffa4] text-[#1a1a1a]',
  dark: 'bg-[#0d1f20] text-[#d7ffa4] border border-[#1f3334]',
  red: 'bg-red-600 text-white',
};

export default function FlashSaleBanner() {
  const [sale, setSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    getActiveFlashSale()
      .then(data => {
        setSale(data);
        if (data && new Date(data.endTime) <= new Date()) {
          setExpired(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !sale || expired) return null;

  // Double-check endTime before rendering
  if (new Date(sale.endTime) <= new Date()) return null;

  const bgClass = BG_CLASSES[sale.backgroundColor] || BG_CLASSES.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl ${bgClass} p-6 md:p-8`}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Text */}
        <div className="text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-bold mb-1">{sale.title}</h3>
          <p className="text-sm md:text-base opacity-80 mb-2">{sale.subtitle}</p>
          <span className="inline-block text-xs md:text-sm font-semibold px-3 py-1 rounded-full bg-white/20">
            {sale.discountLabel}
          </span>
        </div>

        {/* Countdown */}
        <CountdownDisplay endTime={sale.endTime} />

        {/* CTA */}
        <Link href={sale.ctaLink || '/products'}>
          <NeoButton
            text={sale.ctaText || 'Shop Now'}
            className={`text-sm px-6 py-3 ${
              sale.backgroundColor === 'accent'
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#444]'
                : sale.backgroundColor === 'red'
                  ? 'bg-white text-red-600 border-white shadow-[3px_3px_0px_#8b0000]'
                  : 'bg-[#d7ffa4] text-[#1a1a1a] border-[#d7ffa4] shadow-[3px_3px_0px_#1f3334]'
            }`}
          />
        </Link>
      </div>
    </motion.div>
  );
}