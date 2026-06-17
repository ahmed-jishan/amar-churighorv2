'use client';
import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(endDate: string): TimeLeft | null {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function LiveCountdown({ endDate, className = '' }: { endDate: string; className?: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calcTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = calcTimeLeft(endDate);
      setTimeLeft(tl);
      if (!tl) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map(unit => (
        <div key={unit.label} className="flex flex-col items-center">
          <div className="bg-white/10 dark:bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1.5 md:px-3 md:py-2 min-w-[40px] md:min-w-[48px] text-center border border-white/10">
            <span className="text-lg md:text-xl font-mono font-bold text-white">{pad(unit.value)}</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}