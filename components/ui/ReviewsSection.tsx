'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getActiveReviews, getReviewAnimationConfig } from '@/lib/firebase/content';
import { Review, ReviewAnimationConfig, DEFAULT_REVIEW_ANIMATION_CONFIG, REVIEW_ANIMATION_SPEEDS } from '@/types';
import { Star, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [config, setConfig] = useState<ReviewAnimationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [reviewsData, configData] = await Promise.all([
          getActiveReviews(),
          getReviewAnimationConfig(),
        ]);
        setReviews(reviewsData);
        setConfig(configData);
      } catch (e) {
        console.error('Failed to load reviews:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Auto-slide logic for carousel modes
  const slideNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % Math.max(reviews.length, 1));
  }, [reviews.length]);

  const slidePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + reviews.length) % Math.max(reviews.length, 1));
  }, [reviews.length]);

  useEffect(() => {
    if (!config || !config.enabled || !config.autoPlay || isPaused || reviews.length <= 1) return;
    const speedMs = (config.customSpeed || REVIEW_ANIMATION_SPEEDS[config.speed].value) * 1000;
    intervalRef.current = setInterval(slideNext, speedMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config?.enabled, config?.autoPlay, config?.speed, config?.customSpeed, isPaused, reviews.length, slideNext, config]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  const safeConfig = config || DEFAULT_REVIEW_ANIMATION_CONFIG;
  const speedVal = safeConfig.customSpeed || REVIEW_ANIMATION_SPEEDS[safeConfig.speed].value;

  // Static grid when animation disabled
  if (!safeConfig.enabled) {
    return (
      <section>
        <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
        <p className="text-center text-gray-500 mb-10">What our customers say</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    );
  }

  // Animation modes
  const isSingleCardMode = ['carousel-slider', 'auto-sliding', 'premium-luxury'].includes(safeConfig.animationType);

  if (isSingleCardMode) {
    return (
      <section>
        <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
        <p className="text-center text-gray-500 mb-10">What our customers say</p>
        <div
          className="relative max-w-2xl mx-auto"
          onMouseEnter={() => safeConfig.pauseOnHover && setIsPaused(true)}
          onMouseLeave={() => safeConfig.pauseOnHover && setIsPaused(false)}
          ref={containerRef}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={
                safeConfig.animationType === 'premium-luxury'
                  ? { opacity: 0, scale: 0.9, y: 20 }
                  : { opacity: 0, x: safeConfig.direction === 'left' ? 50 : -50 }
              }
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={
                safeConfig.animationType === 'premium-luxury'
                  ? { opacity: 0, scale: 0.95, y: -10 }
                  : { opacity: 0, x: safeConfig.direction === 'left' ? -50 : 50 }
              }
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-8 shadow-lg"
            >
              <ReviewCard review={reviews[currentIndex]} centered />
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <button
            onClick={slidePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-[#0b2a2b] border border-[#1f3334] flex items-center justify-center shadow-lg hover:scale-105 transition z-10"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={slideNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-[#0b2a2b] border border-[#1f3334] flex items-center justify-center shadow-lg hover:scale-105 transition z-10"
            aria-label="Next review"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-[#d7ffa4] w-7'
                    : 'bg-[#1f3334] hover:bg-gray-500'
                }`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Marquee / continuous scroll modes — using CSS animation for smooth no-blink infinite scroll
  const isMarquee = ['infinite-marquee', 'smooth-continuous', 'horizontal-left', 'horizontal-right'].includes(safeConfig.animationType);

  if (isMarquee) {
    const isRight = safeConfig.animationType === 'horizontal-left' || (safeConfig.direction === 'right' && safeConfig.animationType === 'horizontal-right');
    const duration = speedVal * 2;
    return (
      <section className="overflow-hidden">
        <style>{`
          @keyframes marquee-left {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
          }
          .marquee-track {
            animation: ${isRight ? 'marquee-right' : 'marquee-left'} ${duration}s linear infinite;
            will-change: transform;
          }
          .marquee-track.paused {
            animation-play-state: paused;
          }
        `}</style>
        <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
        <p className="text-center text-gray-500 mb-10">What our customers say</p>
        <div
          className="relative"
          onMouseEnter={() => safeConfig.pauseOnHover && setIsPaused(true)}
          onMouseLeave={() => safeConfig.pauseOnHover && setIsPaused(false)}
        >
          <div className={`marquee-track flex gap-6 ${isPaused ? 'paused' : ''}`}>
            {[...reviews, ...reviews, ...reviews].map((review, i) => (
              <div key={`${review.id}-${i}`} className="min-w-[320px] md:min-w-[380px] flex-shrink-0">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Floating cards
  if (safeConfig.animationType === 'floating-cards') {
    return (
      <section>
        <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
        <p className="text-center text-gray-500 mb-10">What our customers say</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: speedVal,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  // Staggered cards
  if (safeConfig.animationType === 'staggered-cards') {
    return (
      <section>
        <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
        <p className="text-center text-gray-500 mb-10">What our customers say</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  // Zig-zag motion
  if (safeConfig.animationType === 'zig-zag') {
    return (
      <section>
        <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
        <p className="text-center text-gray-500 mb-10">What our customers say</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              animate={{ x: i % 2 === 0 ? [0, 10, 0] : [0, -10, 0] }}
              transition={{
                duration: speedVal,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: i * 0.15,
              }}
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  // Fallback: static grid
  return (
    <section>
      <h2 className="text-3xl font-bold text-center mb-2">Customer Reviews</h2>
      <p className="text-center text-gray-500 mb-10">What our customers say</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}

function ReviewCard({ review, centered = false }: { review: Review; centered?: boolean }) {
  return (
    <div className={`p-6 bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] shadow-sm h-full ${centered ? 'text-center' : ''}`}>
      {/* Avatar */}
      <div className={`flex ${centered ? 'justify-center' : ''} mb-4`}>
        {review.avatar ? (
          <img
            src={review.avatar}
            alt={review.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-[#d7ffa4]"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#d7ffa4] flex items-center justify-center text-[#1a1a1a] font-bold text-lg">
            {review.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Stars */}
      <div className={`flex gap-1 mb-3 ${centered ? 'justify-center' : ''}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating
                ? 'fill-[#d7ffa4] text-[#d7ffa4]'
                : 'text-[#1f3334]'
            }`}
          />
        ))}
      </div>

      {/* Comment */}
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
        &ldquo;{review.comment}&rdquo;
      </p>

      {/* Verified Purchase Badge */}
      {review.isVerified && (
        <div className="flex items-center gap-1 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <span className="text-[10px] text-green-500 font-medium">Verified Purchase</span>
        </div>
      )}

      {/* Name & Location */}
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{review.name}</p>
        </div>
        {review.designation && (
          <p className="text-xs text-gray-400">{review.designation}</p>
        )}
        {review.location && (
          <p className="text-xs text-gray-500 mt-0.5">{review.location}</p>
        )}
      </div>
    </div>
  );
}