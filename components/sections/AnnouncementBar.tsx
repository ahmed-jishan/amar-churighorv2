'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ArrowRight, Circle } from 'lucide-react';
import {
  subscribeToAnnouncementConfig,
  getAnnouncementConfig,
  type AnnouncementConfig,
  type AnimationStyle,
  type AnimationSpeed,
  type BarStyle,
} from '@/lib/firebase/announcements';
import { getCampaigns } from '@/lib/firebase/campaigns';
import type { OfferCampaign } from '@/types/campaign';
import { computeCampaignFields } from '@/types/campaign';

// ── Speed mappings ─────────────────────────────────────────────

const MARQUEE_SPEEDS: Record<AnimationSpeed, number> = {
  slow: 35,
  normal: 22,
  fast: 12,
};

const TYPEWRITER_SPEEDS: Record<AnimationSpeed, number> = {
  slow: 80,
  normal: 50,
  fast: 25,
};

// ── Bar style color maps ───────────────────────────────────────

interface BarStyleColors {
  bg: string;
  border: string;
  text: string;
  lightBg: string;
  lightBorder: string;
  lightText: string;
  dot: string;
}

const BAR_STYLES: Record<BarStyle, BarStyleColors> = {
  flash_red: {
    bg: '#1a0808',
    border: 'rgba(239,68,68,0.3)',
    text: '#f0ebe0',
    lightBg: '#fff1f1',
    lightBorder: 'rgba(220,38,38,0.2)',
    lightText: '#1a1a1a',
    dot: '#ef4444',
  },
  gold: {
    bg: '#1a1508',
    border: 'rgba(201,169,110,0.3)',
    text: '#f0ebe0',
    lightBg: '#fdf9f0',
    lightBorder: 'rgba(184,146,74,0.25)',
    lightText: '#1a1a1a',
    dot: '#c9a96e',
  },
  dark: {
    bg: '#0a1a1b',
    border: 'rgba(201,169,110,0.18)',
    text: '#f0ebe0',
    lightBg: '#1a1a1a',
    lightBorder: 'transparent',
    lightText: '#ffffff',
    dot: '#9aada8',
  },
  success_green: {
    bg: '#071a09',
    border: 'rgba(74,222,128,0.25)',
    text: '#f0ebe0',
    lightBg: '#f0fff4',
    lightBorder: 'rgba(22,163,74,0.2)',
    lightText: '#1a1a1a',
    dot: '#4ade80',
  },
};

// ── Helper: format countdown ───────────────────────────────────

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ended';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

// ── CSS for seamless marquee ──
// Content is duplicated for seamless loop, overflow hidden hides the duplicate

function MarqueeStyles({ speed }: { speed: AnimationSpeed }) {
  const duration = MARQUEE_SPEEDS[speed];
  return (
    <style>{`
      @keyframes ann-marquee-scroll {
        0% { transform: translateX(100vw); }
        100% { transform: translateX(-100%); }
      }
      .ann-marquee-track {
        display: inline-block;
        white-space: nowrap;
        animation: ann-marquee-scroll ${duration}s linear infinite;
        padding-left: 0;
      }
      .ann-marquee-track:hover {
        animation-play-state: paused;
      }
    `}</style>
  );
}

// ── Countdown Timer Sub-component ─────────────────────────────

function CountdownTimer({ endDate }: { endDate: string }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const end = new Date(endDate).getTime();
      const diff = end - now;
      setDisplay(formatCountdown(diff));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono whitespace-nowrap shrink-0" style={{ opacity: 0.85 }}>
      <Clock className="w-3 h-3" />
      <span>Ends in: {display}</span>
    </span>
  );
}

// ── Resolved message type ──────────────────────────────────────

interface ResolvedMessage {
  id: string;
  text: string;
  discount?: string;
  timer?: string | null;
  linkText?: string;
  linkUrl?: string;
}

// ── Main Component ─────────────────────────────────────────────

export default function AnnouncementBar() {
  const [config, setConfig] = useState<AnnouncementConfig | null>(null);
  const [campaigns, setCampaigns] = useState<OfferCampaign[]>([]);
  const [messages, setMessages] = useState<ResolvedMessage[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Typewriter state
  const [typewriterText, setTypewriterText] = useState('');
  const [typewriterMsgIndex, setTypewriterMsgIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fade/slide current message index
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);

  // ── Subscribe to announcement config (polls every 5s) ──
  useEffect(() => {
    setMounted(true);
    const unsub = subscribeToAnnouncementConfig((cfg) => {
      setConfig(cfg);
    });
    return () => unsub();
  }, []);

  // ── Fetch ALL campaigns without query constraints ──
  useEffect(() => {
    getCampaigns().then((all) => {
      const computed = all.map(computeCampaignFields);
      setCampaigns(computed);
    }).catch(() => {});
  }, []);

  // ── Check localStorage for dismissal (resets daily) ──
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`lumin_ann_dismissed_${today}`);
    if (stored === 'true') setDismissed(true);
  }, []);

  // ── Resolve messages based on config ──
  useEffect(() => {
    if (!config) { setMessages([]); return; }

    let resolved: ResolvedMessage[] = [];

    if (config.mode === 'campaign') {
      if (!config.linkedCampaignIds || config.linkedCampaignIds.length === 0) {
        setMessages([]);
        return;
      }

      const linked = config.linkedCampaignIds
        .map((id) => campaigns.find((c) => c.id === id))
        .filter(Boolean)
        .filter((c) => c && c.isAvailable) as OfferCampaign[];

      resolved = linked.map((c) => ({
        id: c.id,
        text: c.title,
        discount: config.showCampaignDiscount ? c.discountLabel || '' : '',
        timer: config.showCampaignTimer && c.endDate ? c.endDate : null,
        linkText: 'Shop Now',
        linkUrl: '/offers',
      }));
    } else {
      const activeMessages = (config.customMessages || []).filter((m) => m.isActive);
      resolved = activeMessages.map((m) => ({
        id: m.id,
        text: m.text,
        linkText: m.linkText,
        linkUrl: m.linkUrl,
      }));
    }

    setMessages(resolved);
  }, [config, campaigns]);

  // ── Rotating messages for fade/slide ──
  useEffect(() => {
    if (!config || messages.length <= 1) return;
    const isRotating = config.animationStyle === 'fade' || config.animationStyle === 'slide_up';
    if (!isRotating) return;

    const interval = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [config, messages.length]);

  // ── Typewriter effect ──
  useEffect(() => {
    if (!config || config.animationStyle !== 'typewriter') {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      return;
    }
    if (messages.length === 0) return;

    const currentMsg = messages[typewriterMsgIndex % messages.length];
    if (!currentMsg) return;

    const speed = TYPEWRITER_SPEEDS[config.animationSpeed];
    let charIndex = 0;
    let isDeleting = false;
    const fullText = currentMsg.text;

    typewriterRef.current = setInterval(() => {
      if (!isDeleting) {
        if (charIndex <= fullText.length) {
          setTypewriterText(fullText.slice(0, charIndex));
          charIndex++;
        } else {
          isDeleting = true;
          setTimeout(() => {
            const deleteInterval = setInterval(() => {
              if (charIndex >= 0) {
                setTypewriterText(fullText.slice(0, charIndex));
                charIndex--;
              } else {
                clearInterval(deleteInterval);
                setTypewriterMsgIndex((prev) => (prev + 1) % messages.length);
              }
            }, speed / 2);
          }, 2000);
          if (typewriterRef.current) clearInterval(typewriterRef.current);
        }
      }
    }, speed);

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [config, messages, typewriterMsgIndex]);

  // ── Cursor blink ──
  useEffect(() => {
    if (config?.animationStyle !== 'typewriter') return;
    const interval = setInterval(() => { setCursorVisible((prev) => !prev); }, 500);
    return () => clearInterval(interval);
  }, [config?.animationStyle]);

  // ── Dismiss handler ──
  const handleDismiss = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`lumin_ann_dismissed_${today}`, 'true');
    setDismissed(true);
  }, []);

  // ── Render nothing conditions ──
  if (!mounted) return null;
  if (!config) return null;
  if (!config.isEnabled) return null;
  if (dismissed) return null;
  if (messages.length === 0) return null;

  const colors = BAR_STYLES[config.barStyle];
  const currentMessage = messages[currentMsgIndex % messages.length];

  // ── Build text content for marquee (ONLY text scrolls, timer is excluded) ──
  function buildMarqueeText(): React.ReactNode {
    if (config!.animationStyle !== 'marquee') return null;

    return (
      <>
        {config!.mode === 'campaign' && messages.map((m) => (
          <span key={m.id} className="mr-12">
            <span>{m.text}</span>
            {m.discount && (
              <span className="ml-2 font-bold" style={{ fontFamily: 'Georgia, serif', color: colors.dot }}>
                {m.discount}
              </span>
            )}
            {/* NO timer here — timer is fixed on the right side */}
          </span>
        ))}
        {config!.mode === 'custom' && messages.map((m) => (
          <span key={m.id} className="mr-12">
            <span>{m.text}</span>
          </span>
        ))}
      </>
    );
  }

  // ── Render message content per animation ──
  function renderMessageContent() {
    const msg = currentMessage;
    if (!msg) return null;

    const animation = config!.animationStyle;

    // ── MARQUEE: single content, starts off-screen right, scrolls left, loops ──
    if (animation === 'marquee') {
      return (
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="ann-marquee-track">
            {buildMarqueeText()}
          </div>
        </div>
      );
    }

    // Typewriter
    if (animation === 'typewriter') {
      const typeMsg = messages[typewriterMsgIndex % messages.length];
      if (!typeMsg) return null;
      return (
        <span>
          {typewriterText}
          <span style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.1s' }}>|</span>
          {typeMsg.discount && (
            <span className="ml-2 font-bold" style={{ fontFamily: 'Georgia, serif', color: colors.dot }}>
              {typeMsg.discount}
            </span>
          )}
        </span>
      );
    }

    // Fade
    if (animation === 'fade') {
      return (
        <AnimatePresence mode="wait">
          <motion.span
            key={msg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {msg.text}
            {msg.discount && (
              <span className="ml-2 font-bold" style={{ fontFamily: 'Georgia, serif', color: colors.dot }}>
                {msg.discount}
              </span>
            )}
          </motion.span>
        </AnimatePresence>
      );
    }

    // Slide up
    if (animation === 'slide_up') {
      return (
        <AnimatePresence mode="wait">
          <motion.span
            key={msg.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {msg.text}
            {msg.discount && (
              <span className="ml-2 font-bold" style={{ fontFamily: 'Georgia, serif', color: colors.dot }}>
                {msg.discount}
              </span>
            )}
          </motion.span>
        </AnimatePresence>
      );
    }

    return <span>{msg.text}</span>;
  }

  // ── Render ──
  return (
    <>
      <MarqueeStyles speed={config.animationSpeed} />
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                backgroundColor: colors.bg,
                borderBottom: `1px solid ${colors.border}`,
                color: colors.text,
              }}
              className="dark-mode-bar"
            >
              <style>{`
                .light-mode .announcement-bar-inner,
                .light .announcement-bar-inner {
                  background-color: ${colors.lightBg} !important;
                  border-bottom-color: ${colors.lightBorder} !important;
                  color: ${colors.lightText} !important;
                }
              `}</style>
              <div
                className="announcement-bar-inner"
                style={{ backgroundColor: 'inherit', borderBottom: 'inherit', color: 'inherit' }}
              >
                <div
                  className="dark:bg-[var(--bar-bg)] dark:border-[var(--bar-border)]"
                  style={{ '--bar-bg': colors.bg, '--bar-border': colors.border } as React.CSSProperties}
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs md:text-sm">
                    {/* Left: dot + scrolling message */}
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                      <Circle
                        className="w-2 h-2 shrink-0"
                        style={{ color: colors.dot, fill: colors.dot, opacity: 1 }}
                      />
                      {/* Message area - ONLY text scrolls, timer is OUTSIDE for non-marquee */}
                      {config.animationStyle === 'marquee' ? (
                        <div className="flex-1 overflow-hidden">
                          {renderMessageContent()}
                        </div>
                      ) : (
                        <div className="flex-1" style={{ overflow: 'visible' }}>
                          {renderMessageContent()}
                        </div>
                      )}
                    </div>

                    {/* Right side (desktop) - FIXED timer, never scrolls */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                      {/* Timer - ALWAYS fixed on right side, never scrolls */}
                      {config.mode === 'campaign' && config.showCampaignTimer && currentMessage?.timer && (
                        <CountdownTimer endDate={currentMessage.timer} />
                      )}

                      {/* CTA Link */}
                      {currentMessage?.linkText && (
                        <a
                          href={currentMessage.linkUrl || '#'}
                          className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:no-underline whitespace-nowrap"
                          style={{ color: colors.dot, textUnderlineOffset: 2 }}
                        >
                          {currentMessage.linkText}
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}

                      {/* Dismiss */}
                      {config.dismissible && (
                        <button
                          onClick={handleDismiss}
                          className="p-1 rounded-full hover:bg-black/20 dark:hover:bg-white/10 transition-colors shrink-0"
                          aria-label="Dismiss announcement"
                          style={{ opacity: 0.6 }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Mobile dismiss */}
                    <div className="flex md:hidden items-center gap-2 shrink-0">
                      {config.dismissible && (
                        <button
                          onClick={handleDismiss}
                          className="p-1 rounded-full hover:bg-black/20 dark:hover:bg-white/10 transition-colors"
                          aria-label="Dismiss announcement"
                          style={{ opacity: 0.6 }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}