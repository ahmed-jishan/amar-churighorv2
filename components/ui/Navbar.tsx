'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { setHydrated(true); }, []);

  // Focus search input when mobile search is opened
  useEffect(() => {
    if (showMobileSearch && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [showMobileSearch]);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setShowMobileSearch(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
      setShowMobileSearch(false);
    }
  }

  const links = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
    { href: '/offers', label: 'Offers' },
    { href: '/my-orders', label: 'My Orders' },
    { href: '/about', label: 'About' },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-[#051a1b]/90 backdrop-blur-md border-b border-[#1f3334] dark:border-green-400/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="relative shrink-0 group">
            {/* Bracelet SVG frame */}
            <svg
              viewBox="0 0 280 48"
              className="w-[140px] xs:w-[180px] sm:w-[220px] lg:w-[280px] h-10 lg:h-12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Subtle glow behind bracelet */}
              <defs>
                <radialGradient id="braceletGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="braceletGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="braceletGradientDark" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="textGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Glow effect */}
              <ellipse cx="140" cy="24" rx="130" ry="22" className="text-emerald-500 dark:text-emerald-400" fill="url(#braceletGlow)" />

              {/* Ornamental left end cap */}
              <circle cx="16" cy="24" r="4.5" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="24" r="1.8" fill="url(#braceletGradient)" className="dark:hidden" />
              <circle cx="16" cy="24" r="1.8" fill="url(#braceletGradientDark)" className="hidden dark:block" />

              {/* Ornamental right end cap */}
              <circle cx="264" cy="24" r="4.5" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="1.5" fill="none" />
              <circle cx="264" cy="24" r="1.8" fill="url(#braceletGradient)" className="dark:hidden" />
              <circle cx="264" cy="24" r="1.8" fill="url(#braceletGradientDark)" className="hidden dark:block" />

              {/* Small decorative dots flanking left */}
              <circle cx="27" cy="18" r="1.2" className="fill-emerald-400 dark:fill-emerald-400/60" />
              <circle cx="27" cy="30" r="1.2" className="fill-emerald-400 dark:fill-emerald-400/60" />

              {/* Small decorative dots flanking right */}
              <circle cx="253" cy="18" r="1.2" className="fill-emerald-400 dark:fill-emerald-400/60" />
              <circle cx="253" cy="30" r="1.2" className="fill-emerald-400 dark:fill-emerald-400/60" />

              {/* Top bracelet arc */}
              <path
                d="M22 24 C22 10, 40 6, 140 6 C240 6, 258 10, 258 24"
                className="stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />

              {/* Bottom bracelet arc */}
              <path
                d="M22 24 C22 38, 40 42, 140 42 C240 42, 258 38, 258 24"
                className="stroke-emerald-600/60 dark:stroke-emerald-400/60"
                strokeWidth="0.8"
                fill="none"
                strokeLinecap="round"
              />

              {/* Micro decorative notches on top arc */}
              <line x1="75" y1="8.5" x2="77" y2="10.5" className="stroke-emerald-400/50 dark:stroke-emerald-400/30" strokeWidth="0.6" />
              <line x1="140" y1="7" x2="140" y2="9" className="stroke-emerald-400/50 dark:stroke-emerald-400/30" strokeWidth="0.6" />
              <line x1="205" y1="8.5" x2="203" y2="10.5" className="stroke-emerald-400/50 dark:stroke-emerald-400/30" strokeWidth="0.6" />

              {/* Text */}
              <text
                x="140"
                y="27"
                textAnchor="middle"
                className="fill-emerald-600 dark:fill-emerald-400"
                fontSize="15"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="1.2"
              >
                Amar Churighor
              </text>
            </svg>

            {/* Subtle hover glow effect */}
            <span className="absolute inset-0 -inset-x-2 -inset-y-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-emerald-500/5 dark:bg-emerald-400/5 blur-xl" />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-green-600 dark:hover:text-green-400 transition font-medium whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Mobile search toggle */}
            <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
              <Search className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-1 border border-[#1f3334] rounded-lg px-3 py-1.5 text-sm">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none w-24 lg:w-32 placeholder:text-gray-400"
              />
            </form>

            <button id="navbar-cart-icon" onClick={openCart} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
              <ShoppingBag className="w-5 h-5" />
              {hydrated && totalItems > 0 && (
                <motion.span
                  id="navbar-cart-badge"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-[#d7ffa4] text-[#1a1a1a] text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </button>

            <ThemeToggle />

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition" aria-label="Toggle mobile menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar (collapsible) */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-[#1f3334] overflow-hidden"
          >
            <div className="px-4 py-3">
              <form onSubmit={handleSearch} className="flex items-center gap-2 border border-[#1f3334] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0b2a2b]">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  ref={mobileSearchRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="bg-transparent outline-none flex-1 min-w-0"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="md:hidden border-t border-[#1f3334] bg-white dark:bg-[#051a1b] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 px-2 font-medium hover:text-green-600 dark:hover:text-green-400 transition rounded-lg hover:bg-gray-50 dark:hover:bg-[#0b2a2b]"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-[#1f3334]/50">
                <Link
                  href="/my-orders"
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 px-2 font-medium text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition rounded-lg hover:bg-gray-50 dark:hover:bg-[#0b2a2b]"
                >
                  📦 My Orders
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
