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
          <Link href="/" className="relative shrink-0 group flex items-center gap-2 lg:gap-1">
            <img
              src="/luminnav.png"
              alt="Lumin"
              className="h-14 lg:h-20 w-auto object-contain"
            />
            <span className="text-xl lg:text-3xl font-bold tracking-[0.15em] lg:tracking-[0.2em] bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#C9A84C] bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]">
              LUMIN
            </span>
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
