'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroSlide } from '@/types';

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: '1', title: 'New Arrivals', subtitle: 'Discover our latest curated collection', image: '/hero-1.jpg', buttonText: 'Shop Now', buttonLink: '/products', isActive: true },
  { id: '2', title: 'Summer Sale', subtitle: 'Up to 30% off on select products', image: '/hero-2.jpg', buttonText: 'View Offers', buttonLink: '/offers', isActive: true },
  { id: '3', title: 'Premium Quality', subtitle: 'Handcrafted with love and care', image: '/hero-3.jpg', buttonText: 'Explore', buttonLink: '/products', isActive: true },
];

export default function HeroCarousel({ slides = DEFAULT_SLIDES }: { slides?: HeroSlide[] }) {
  const activeSlides = slides.filter(s => s.isActive);
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  const next = () => { setDir(1); setCurrent(p => (p + 1) % activeSlides.length); };
  const prev = () => { setDir(-1); setCurrent(p => (p - 1 + activeSlides.length) % activeSlides.length); };

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, []);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-[#1f3334] h-[400px] md:h-[520px]">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={current}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <Image src={activeSlides[current].image} alt={activeSlides[current].title} fill className="object-cover" priority={current === 0} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end pb-12 px-8 md:px-16">
            <div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-3xl md:text-6xl font-bold text-white mb-3"
              >
                {activeSlides[current].title}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-white/80 mb-6"
              >
                {activeSlides[current].subtitle}
              </motion.p>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <Link href={activeSlides[current].buttonLink}
                  className="inline-block bg-[#d7ffa4] text-[#1a1a1a] px-7 py-3 rounded-xl font-semibold border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1a1a1a] transition-all">
                  {activeSlides[current].buttonText}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition">
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition">
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {activeSlides.map((_, i) => (
          <button key={i} onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
            className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-[#d7ffa4]' : 'w-2 bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}
