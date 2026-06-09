'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => { setHydrated(true); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  const links = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
    { href: '/offers', label: 'Offers' },
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
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent shrink-0">
            Amar Churighor
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-green-600 dark:hover:text-green-400 transition font-medium">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-1 border border-[#1f3334] rounded-lg px-3 py-1.5 text-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none w-32 placeholder:text-gray-400"
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

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-[#1f3334] bg-white dark:bg-[#051a1b] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              <form onSubmit={handleSearch} className="flex items-center gap-2 border border-[#1f3334] rounded-lg px-3 py-2 text-sm">
                <Search className="w-4 h-4 text-gray-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..." className="bg-transparent outline-none flex-1" />
              </form>
              {links.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2 font-medium hover:text-green-600 transition">
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
