'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeoButton from '@/components/ui/NeoButton';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, addDoc } from 'firebase/firestore';
import { Check, CircleAlert, Loader2 } from 'lucide-react';

// ── Constants ──
const BENEFITS = [
  { icon: '✦', label: 'Early access to new arrivals' },
  { icon: '🎁', label: 'Exclusive subscriber-only offers' },
  { icon: '📦', label: 'Order updates & care tips' },
] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_CSS =
  'flex-1 w-full px-4 py-3 rounded-xl border-2 outline-none transition-colors duration-200 text-sm ' +
  'bg-white dark:bg-[#051a1b] ' +
  'text-[#1a1a1a] dark:text-gray-200 ' +
  'border-[#1a1a1a] dark:border-[#c9a96e] ' +
  'focus:border-[#c9a96e] dark:focus:border-[#e6d3a3] ' +
  'placeholder:text-gray-400 dark:placeholder:text-gray-500';

type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [validationError, setValidationError] = useState('');
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  // ── Fetch subscriber count on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'newsletter_subscribers')));
        if (!cancelled) {
          setSubscriberCount(snap.size);
        }
      } catch {
        // Silently hide on error
        if (!cancelled) setSubscriberCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Submit handler ──
  const handleSubmit = useCallback(async () => {
    // 1. Validate
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    setValidationError('');
    setStatus('loading');

    try {
      // 2. Check duplicate (best-effort — Firestore rules may block read for public)
      let isDuplicate = false;
      try {
        const snap = await getDocs(query(collection(db, 'newsletter_subscribers')));
        isDuplicate = snap.docs.some(d => d.data().email === trimmed);
      } catch {
        // If duplicate check fails (e.g. permission denied for public users),
        // we proceed optimistically and let Firestore handle it
        isDuplicate = false;
      }

      if (isDuplicate) {
        setStatus('duplicate');
        return;
      }

      // 3. Add subscriber
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: trimmed,
        subscribedAt: new Date().toISOString(),
        source: 'homepage',
        isActive: true,
        discountSent: false,
      });

      setStatus('success');
    } catch (err: unknown) {
      // Distinguish permission errors (rules not deployed) vs real failures
      if (err instanceof Error && err.message?.includes('permission-denied')) {
        setValidationError('Subscription is temporarily unavailable. Please try again later.');
        setStatus('idle');
      } else {
        setStatus('error');
      }
    }
  }, [email]);

  // ── Pill style helper ──
  const pillClass =
    'text-[12px] px-[12px] py-[5px] rounded-[99px] ' +
    'bg-[rgba(201,169,110,0.08)] dark:bg-[rgba(201,169,110,0.08)] ' +
    'border-[0.5px] border-[rgba(201,169,110,0.2)] dark:border-[rgba(201,169,110,0.2)] ' +
    'text-[#9aada8] dark:text-[#9aada8]';

  // ── Shared animation props ──
  const springTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  };

  // ── Determine if the form area is visible (idle, loading, error) ──
  const showForm = status === 'idle' || status === 'loading' || status === 'error';
  const showResult = status === 'success' || status === 'duplicate';

  return (
    <section
      className={
        'bg-[#d7ffa4] dark:bg-[#0f2f30] rounded-3xl p-6 md:p-10 text-center ' +
        'border border-[#1a1a1a] dark:border-[#c9a96e]'
      }
    >
      <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] dark:text-[#e6d3a3] mb-2">
        Stay in the Loop
      </h2>
      <p className="text-[#1a1a1a]/70 dark:text-[#e6d3a3]/70 mb-6 max-w-sm mx-auto text-sm md:text-base">
        Get notified about new products and exclusive offers.
      </p>

      {/* ── Benefit pills ── */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {BENEFITS.map(({ icon, label }) => (
          <span key={label} className={pillClass}>
            {icon} {label}
          </span>
        ))}
      </div>

      {/* ── Social proof ── */}
      {subscriberCount !== null && subscriberCount >= 10 && (
        <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-4">
          Join {(subscriberCount).toLocaleString()}+ customers
        </p>
      )}

      {/* ── Animated content area ── */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springTransition}
            className="flex flex-col gap-3 max-w-md mx-auto"
          >
            {/* Input + Button row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="Enter your email — it's free"
                  disabled={status === 'loading'}
                  className={INPUT_CSS}
                />
              </div>
              <NeoButton
                text={status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                onClick={handleSubmit}
                disabled={status === 'loading'}
                icon={
                  status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : undefined
                }
                className={
                  'w-full sm:w-auto ' +
                  'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[3px_3px_0px_#444] ' +
                  'dark:bg-[#c9a96e] dark:text-[#051a1b] dark:border-[#c9a96e] dark:shadow-[3px_3px_0px_#fff3] ' +
                  (status === 'loading' ? 'opacity-60 cursor-not-allowed' : '')
                }
              />
            </div>

            {/* Validation error */}
            {validationError && (
              <p className="text-[#ef4444] text-[12px] mt-[4px] text-left">
                {validationError}
              </p>
            )}

            {/* Error state message below form */}
            {status === 'error' && (
              <p className="text-[#ef4444] dark:text-[#ef4444] text-[12px] mt-1 text-center">
                Something went wrong. Please try again.
              </p>
            )}
          </motion.div>
        )}

        {showResult && (
          <motion.div
            key={status === 'success' ? 'success' : 'duplicate'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springTransition}
            className="flex flex-col items-center gap-2 max-w-sm mx-auto"
          >
            {status === 'success' ? (
              <>
                {/* Success icon */}
                <div
                  className={
                    'w-16 h-16 rounded-full flex items-center justify-center mb-1 ' +
                    'bg-[rgba(201,169,110,0.15)] dark:bg-[rgba(201,169,110,0.15)] ' +
                    'border-[rgba(201,169,110,0.3)] dark:border-[rgba(201,169,110,0.3)]'
                  }
                >
                  <Check className="w-8 h-8 text-[#c9a96e]" strokeWidth={2.5} />
                </div>

                <h3
                  className="font-serif text-[20px] text-[#1a1a1a] dark:text-[#e6d3a3]"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  You're in! 🎉
                </h3>
                <p className="text-[13px] text-[#1a1a1a]/70 dark:text-[#e6d3a3]/70">
                  Check your inbox — we've sent you a welcome email.
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-[8px]">
                  Didn't receive it? Check your spam folder.
                </p>
              </>
            ) : (
              <>
                {/* Duplicate icon */}
                <div
                  className={
                    'w-16 h-16 rounded-full flex items-center justify-center mb-1 ' +
                    'bg-[rgba(201,169,110,0.15)] dark:bg-[rgba(201,169,110,0.15)] ' +
                    'border-[rgba(201,169,110,0.3)] dark:border-[rgba(201,169,110,0.3)]'
                  }
                >
                  <CircleAlert className="w-8 h-8 text-[#c9a96e]" strokeWidth={2} />
                </div>

                <h3 className="text-[15px] font-medium text-[#1a1a1a] dark:text-[#e6d3a3]">
                  You're already subscribed!
                </h3>
                <p className="text-[13px] text-[#1a1a1a]/70 dark:text-[#e6d3a3]/70">
                  We'll keep sending you the good stuff.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}