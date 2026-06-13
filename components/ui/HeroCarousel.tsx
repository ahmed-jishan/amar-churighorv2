'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroSlide, HeroConfig, HeroTransition, DEFAULT_HERO_CONFIG } from '@/types';
import { getHeroSlides, getHeroConfig } from '@/lib/firebase/content';

const FALLBACK_IMAGE = '/placeholder.png';

const FALLBACK_SLIDES = [
  {
    id: 'fallback-1',
    title: 'Timeless Elegance',
    subtitle: 'Discover our curated collection of premium jewelry',
    image: '/placeholder.png',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'fallback-2',
    title: 'New Arrivals',
    subtitle: 'Be the first to wear our latest designs',
    image: '/placeholder.png',
    buttonText: 'Explore',
    buttonLink: '/products',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'fallback-3',
    title: 'Special Offers',
    subtitle: 'Exclusive discounts on premium collections',
    image: '/placeholder.png',
    buttonText: 'View Offers',
    buttonLink: '/offers',
    sortOrder: 2,
    isActive: true,
  },
];

const TRANSITION_VARIANTS: Record<HeroTransition, {
  enter: (d: number) => { x?: string; y?: string; scale?: number; opacity: number };
  center: { x?: number; y?: number; scale?: number; opacity: number };
  exit: (d: number) => { x?: string; y?: string; scale?: number; opacity: number; transition?: { duration: number } };
}> = {
  'fade': {
    enter: () => ({ opacity: 0 }),
    center: { opacity: 1 },
    exit: () => ({ opacity: 0, transition: { duration: 0.3 } }),
  },
  'slide-left': {
    enter: () => ({ x: '100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }),
  },
  'slide-right': {
    enter: () => ({ x: '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  },
  'zoom-in': {
    enter: () => ({ scale: 0.8, opacity: 0 }),
    center: { scale: 1, opacity: 1 },
    exit: () => ({ scale: 1.1, opacity: 0 }),
  },
  'zoom-out': {
    enter: () => ({ scale: 1.2, opacity: 0 }),
    center: { scale: 1, opacity: 1 },
    exit: () => ({ scale: 0.8, opacity: 0 }),
  },
  'cross-fade': {
    enter: (d) => ({ opacity: 0, x: d > 0 ? '5%' : '-5%' }),
    center: { x: 0, opacity: 1 },
    exit: () => ({ opacity: 0 }),
  },
};

function safeSlide(slide: any, index: number): HeroSlide {
  return {
    id: slide?.id || String(index),
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    description: slide?.description || '',
    image: slide?.image || FALLBACK_IMAGE,
    mobileImage: slide?.mobileImage || '',
    bgImage: slide?.bgImage || '',
    buttonText: slide?.buttonText || 'Shop Now',
    buttonLink: slide?.buttonLink || '/products',
    secondaryButtonText: slide?.secondaryButtonText || '',
    secondaryButtonLink: slide?.secondaryButtonLink || '',
    badgeText: slide?.badgeText || '',
    promoLabel: slide?.promoLabel || '',
    discountText: slide?.discountText || '',
    overlayOpacity: slide?.overlayOpacity ?? 50,
    textAlign: slide?.textAlign || 'left',
    contentWidth: slide?.contentWidth || 'medium',
    bgPosition: slide?.bgPosition || 'center',
    bgFit: slide?.bgFit || 'cover',
    transition: slide?.transition || 'fade',
    sortOrder: slide?.sortOrder ?? 0,
    isActive: slide?.isActive ?? true,
    startDate: slide?.startDate || '',
    endDate: slide?.endDate || '',
    altText: slide?.altText || '',
    metaTitle: slide?.metaTitle || '',
    metaDescription: slide?.metaDescription || '',
    createdAt: slide?.createdAt || new Date().toISOString(),
  };
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    Promise.all([
      getHeroSlides(),
      getHeroConfig(),
    ]).then(([data, cfg]) => {
      const processed = data
        .filter(s => s?.isActive)
        .filter(s => {
          if (s.startDate && new Date(s.startDate) > new Date()) return false;
          if (s.endDate && new Date(s.endDate) < new Date()) return false;
          return true;
        })
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

      // Use Firestore slides if available, otherwise use fallback
      if (processed.length > 0) {
        setSlides(processed.map((s, i) => safeSlide(s, i)));
      } else {
        setSlides(FALLBACK_SLIDES.map((s, i) => ({
          ...safeSlide(s, i),
          image: s.image,
        })));
      }
      setConfig(cfg);
      setLoading(false);
    }).catch(() => {
      // On error, use fallback slides
      setSlides(FALLBACK_SLIDES.map((s, i) => ({
        ...safeSlide(s, i),
        image: s.image,
      })));
      setLoading(false);
    });
  }, []);

  // Reset current index when slides change
  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  const activeSlides = slides.filter(s => s && s.image);
  const hasSlides = activeSlides.length > 0 && config.heroEnabled;

  const next = useCallback(() => {
    setDir(1);
    setCurrent(p => (p + 1) % Math.max(1, activeSlides.length));
  }, [activeSlides.length]);

  const prev = useCallback(() => {
    setDir(-1);
    setCurrent(p => (p - 1 + Math.max(1, activeSlides.length)) % Math.max(1, activeSlides.length));
  }, [activeSlides.length]);

  // Autoplay
  useEffect(() => {
    if (!config.autoplay || !hasSlides) return;
    intervalRef.current = setInterval(next, config.autoplaySpeed || 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.autoplay, config.autoplaySpeed, hasSlides, next]);

  // Pause on hover
  const pauseAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const resumeAutoplay = () => {
    if (config.autoplay && hasSlides) {
      intervalRef.current = setInterval(next, config.autoplaySpeed || 5000);
    }
  };

  // ── Touch Swipe Handlers ──
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    pauseAutoplay();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance && activeSlides.length > 1) {
      if (diff > 0) {
        // Swiped left → next
        next();
      } else {
        // Swiped right → prev
        prev();
      }
    }
    resumeAutoplay();
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-[#1f3334] h-[300px] sm:h-[400px] md:h-[520px] bg-[#0b2a2b] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No slides or hero disabled — render nothing (no empty space)
  if (!hasSlides) {
    return null;
  }

  // Ensure current index is valid
  const safeIndex = current >= activeSlides.length ? 0 : current;
  const slide = activeSlides[safeIndex];
  if (!slide) return null;

  const transition = config.defaultTransition || 'fade';
  const variants = TRANSITION_VARIANTS[transition] || TRANSITION_VARIANTS.fade;

  const contentWidthClass = slide.contentWidth === 'narrow' ? 'max-w-lg' : slide.contentWidth === 'full' ? 'max-w-full' : 'max-w-2xl';
  const bgPosClass = slide.bgPosition === 'top' ? 'object-top' : slide.bgPosition === 'bottom' ? 'object-bottom' : 'object-center';
  const bgFitClass = slide.bgFit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-[#1f3334] h-[300px] sm:h-[400px] md:h-[520px] select-none"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={dir} mode="wait">
        <motion.div
          key={safeIndex}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Badge */}
          {slide.badgeText && (
            <span className="absolute top-5 left-5 z-20 text-xs bg-[#d7ffa4] text-[#1a1a1a] font-bold px-3 py-1 rounded-full border border-[#1a1a1a] shadow-lg">
              {slide.badgeText}
            </span>
          )}

          <Image
            src={slide.image || FALLBACK_IMAGE}
            alt={slide.altText || slide.title || 'Hero banner'}
            fill
            className={`${bgFitClass} ${bgPosClass}`}
            priority={safeIndex === 0}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
            }}
          />
          <div
            className="absolute inset-0 flex items-end pb-8 sm:pb-12 px-4 sm:px-8 md:px-16"
            style={{
              background: `linear-gradient(to top, rgba(0,0,0,${(slide.overlayOpacity ?? 50) / 100}) 0%, rgba(0,0,0,${((slide.overlayOpacity ?? 50) - 20) / 100}) 50%, transparent 100%)`,
              textAlign: slide.textAlign || 'left',
            }}
          >
            <div className={`w-full ${contentWidthClass} ${slide.textAlign === 'center' ? 'mx-auto' : slide.textAlign === 'right' ? 'ml-auto' : ''}`}>
              <motion.h2
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-3 leading-tight"
              >
                {slide.title}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-sm sm:text-lg md:text-xl text-white/80 mb-1 md:mb-2"
              >
                {slide.subtitle}
              </motion.p>
              {slide.description && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                  className="text-xs sm:text-sm md:text-base text-white/60 mb-4 md:mb-6 max-w-xl"
                >
                  {slide.description}
                </motion.p>
              )}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <div className="flex gap-2 md:gap-3 flex-wrap" style={{ justifyContent: slide.textAlign === 'center' ? 'center' : slide.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                  <Link href={slide.buttonLink || '/products'}
                    className="inline-block bg-[#d7ffa4] text-[#1a1a1a] px-4 sm:px-7 py-2 sm:py-3 rounded-xl font-semibold border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] sm:shadow-[3px_3px_0px_#1a1a1a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1a1a1a] sm:hover:shadow-[5px_5px_0px_#1a1a1a] transition-all text-xs sm:text-base">
                    {slide.buttonText}
                  </Link>
                  {slide.secondaryButtonText && (
                    <Link href={slide.secondaryButtonLink || '#'}
                      className="inline-block bg-white/10 backdrop-blur-sm text-white px-4 sm:px-7 py-2 sm:py-3 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/20 hover:-translate-y-0.5 transition-all text-xs sm:text-base">
                      {slide.secondaryButtonText}
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {activeSlides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition z-10">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full p-2 transition z-10">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {activeSlides.map((_, i) => (
              <button key={i} onClick={() => { setDir(i > safeIndex ? 1 : -1); setCurrent(i); }}
                className={`h-1.5 rounded-full transition-all ${i === safeIndex ? 'w-8 bg-[#d7ffa4]' : 'w-2 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}