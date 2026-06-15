'use client';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, ChevronDown, LayoutGrid } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getActiveCategories } from '@/lib/firebase/categories';
import type { ProductCategory } from '@/types';

interface NavLink {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  // Match exact or sub-path (e.g., /categories/foo matches /categories)
  return pathname === href || pathname.startsWith(href + '/');
}

// ── Shared Dropdown Component ──
function DropdownMenu({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -3, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -3, scale: 0.97 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="absolute top-full left-0 mt-1 min-w-[200px] bg-white dark:bg-[#0b2a2b] border border-[#1f3334] rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Dropdown Link Item ──
function DropdownLink({ href, label, childActive, onClick }: { href: string; label: string; childActive?: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block px-4 py-2 text-sm font-medium transition-all duration-150 ${
        childActive
          ? 'text-[#1a1a1a] dark:text-[#d7ffa4] bg-[#d7ffa4]/10 dark:bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
          : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-[#0b2a2b]/60 border-l-2 border-transparent'
      }`}
    >
      {label}
    </Link>
  );
}

// ── Circular Dot Active Indicator ──
function ActiveDot() {
  return (
    <motion.span
      layoutId="nav-active-dot"
      className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#d7ffa4] dark:bg-[#d7ffa4] shadow-[0_0_6px_rgba(215,255,164,0.5)]"
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    />
  );
}

// ── NavLinkItem with dropdown support ──
function NavLinkItem({ link, pathname, onNavigate }: { link: NavLink; pathname: string; onNavigate: () => void }) {
  const active = isActiveRoute(pathname, link.href);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const hasChildren = link.children && link.children.length > 0;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasChildren) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hasChildren]);

  const linkClasses = `relative flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
    active
      ? 'text-[#1a1a1a] dark:text-[#d7ffa4]'
      : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
  }`;

  if (hasChildren && link.children) {
    return (
      <div ref={dropdownRef} className="relative" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={linkClasses}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          {link.label}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          {active && <ActiveDot />}
        </button>
        <DropdownMenu isOpen={dropdownOpen}>
          <div className="py-1.5">
            {link.children.map(child => {
              const childActive = isActiveRoute(pathname, child.href);
              return (
                <DropdownLink
                  key={child.href}
                  href={child.href}
                  label={child.label}
                  childActive={childActive}
                  onClick={onNavigate}
                />
              );
            })}
          </div>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={linkClasses}
      aria-current={active ? 'page' : undefined}
    >
      {link.label}
      {active && <ActiveDot />}
      {!active && (
        <span className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-green-400/5 to-emerald-400/5 dark:from-green-400/10 dark:to-emerald-400/10" />
      )}
    </Link>
  );
}

// ── Category Dropdown (dynamic from Firestore) ──
function CategoryDropdown({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const active = isActiveRoute(pathname, '/categories');

  useEffect(() => {
    getActiveCategories().then(setCategories);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
      <Link
        href="/categories"
        onClick={onNavigate}
        className={`relative flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          active
            ? 'text-[#1a1a1a] dark:text-[#d7ffa4]'
            : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
        }`}
        aria-current={active ? 'page' : undefined}
        onMouseEnter={() => setDropdownOpen(true)}
      >
        Categories
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        {active && <ActiveDot />}
      </Link>
      <DropdownMenu isOpen={dropdownOpen}>
        <div className="py-1.5 max-h-[60vh] overflow-y-auto">
          {categories.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No categories yet</div>
          ) : (
            categories.map(cat => {
              const catPath = `/products?category=${encodeURIComponent(cat.name)}`;
              const childActive = pathname === '/products' && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('category') === cat.name;
              return (
                <DropdownLink
                  key={cat.id}
                  href={catPath}
                  label={cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                  childActive={childActive}
                  onClick={() => { setDropdownOpen(false); onNavigate(); }}
                />
              );
            })
          )}
        </div>
      </DropdownMenu>
    </div>
  );
}

export default function Navbar() {
  const { totalItems, openCart } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mobileCategories, setMobileCategories] = useState<ProductCategory[]>([]);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (showMobileSearch && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [showMobileSearch]);

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

  useEffect(() => {
    setMobileOpen(false);
    setShowMobileSearch(false);
  }, [pathname]);

  useEffect(() => {
    getActiveCategories().then(setMobileCategories);
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

  function closeMobile() {
    setMobileOpen(false);
    setShowMobileSearch(false);
  }

  const links: NavLink[] = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Shop' },
    {
      href: '/collections',
      label: 'Collections',
      children: [
        { href: '/collections/featured', label: 'Featured Collection' },
      ],
    },
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
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="relative shrink-0 group flex items-center gap-2 lg:gap-1" aria-label="Home">
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            <NavLinkItem link={links[0]} pathname={pathname} onNavigate={closeMobile} />
            <NavLinkItem link={links[1]} pathname={pathname} onNavigate={closeMobile} />
            <CategoryDropdown pathname={pathname} onNavigate={closeMobile} />
            <NavLinkItem link={links[2]} pathname={pathname} onNavigate={closeMobile} />
            <NavLinkItem link={links[3]} pathname={pathname} onNavigate={closeMobile} />
            <NavLinkItem link={links[4]} pathname={pathname} onNavigate={closeMobile} />
            <NavLinkItem link={links[5]} pathname={pathname} onNavigate={closeMobile} />
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition" aria-label="Toggle search">
              <Search className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-1 border border-[#1f3334] rounded-lg px-3 py-1.5 text-sm" role="search">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent outline-none w-24 lg:w-32 placeholder:text-gray-400"
                aria-label="Search products"
              />
            </form>

            <button id="navbar-cart-icon" onClick={openCart} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition" aria-label={`Shopping cart${hydrated && totalItems > 0 ? ` (${totalItems} items)` : ''}`}>
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

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition" aria-label={mobileOpen ? 'Close mobile menu' : 'Open mobile menu'}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
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

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="md:hidden border-t border-[#1f3334] bg-white dark:bg-[#051a1b] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-0.5">
              {/* Home */}
              <MobileNavLink href="/" label="Home" pathname={pathname} onClick={closeMobile} />
              {/* Shop */}
              <MobileNavLink href="/products" label="Shop" pathname={pathname} onClick={closeMobile} />

              {/* Categories (dynamic) */}
              <div className="mb-1">
                <div className={`block py-3 px-2 font-medium rounded-lg transition text-sm ${
                  isActiveRoute(pathname, '/categories')
                    ? 'text-[#d7ffa4] bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
                    : 'text-gray-600 dark:text-gray-300 border-l-2 border-transparent'
                }`}>
                  Categories
                </div>
                <div className="ml-4 space-y-0.5 border-l border-[#1f3334]/50 pl-3">
                  {mobileCategories.length === 0 ? (
                    <div className="py-2 px-2 text-xs text-gray-400">No categories yet</div>
                  ) : (
                    mobileCategories.map(cat => {
                      const catPath = `/products?category=${encodeURIComponent(cat.name)}`;
                      const childActive = pathname === '/products' && new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('category') === cat.name;
                      return (
                        <Link
                          key={cat.id}
                          href={catPath}
                          onClick={closeMobile}
                          className={`block py-2.5 px-2 font-medium rounded-lg transition text-sm ${
                            childActive
                              ? 'text-[#d7ffa4] bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
                              : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-[#0b2a2b] border-l-2 border-transparent'
                          }`}
                        >
                          {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Collections */}
              <div className="mb-1">
                <div className={`block py-3 px-2 font-medium rounded-lg transition text-sm ${
                  isActiveRoute(pathname, '/collections')
                    ? 'text-[#d7ffa4] bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
                    : 'text-gray-600 dark:text-gray-300 border-l-2 border-transparent'
                }`}>
                  Collections
                </div>
                <div className="ml-4 space-y-0.5 border-l border-[#1f3334]/50 pl-3">
                  <Link
                    href="/collections/featured"
                    onClick={closeMobile}
                    className={`block py-2.5 px-2 font-medium rounded-lg transition text-sm ${
                      isActiveRoute(pathname, '/collections/featured')
                        ? 'text-[#d7ffa4] bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
                        : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-[#0b2a2b] border-l-2 border-transparent'
                    }`}
                  >
                    Featured Collection
                  </Link>
                </div>
              </div>

              <MobileNavLink href="/offers" label="Offers" pathname={pathname} onClick={closeMobile} />
              <MobileNavLink href="/my-orders" label="My Orders" pathname={pathname} onClick={closeMobile} />
              <MobileNavLink href="/about" label="About" pathname={pathname} onClick={closeMobile} />

              <div className="pt-2 mt-2 border-t border-[#1f3334]/50">
                <Link
                  href="/my-orders"
                  onClick={closeMobile}
                  className={`block py-3 px-2 font-medium rounded-lg transition text-sm ${
                    isActiveRoute(pathname, '/my-orders')
                      ? 'text-[#d7ffa4] bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
                      : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-[#0b2a2b] border-l-2 border-transparent'
                  }`}
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

// ── Mobile Nav Link helper ──
function MobileNavLink({ href, label, pathname, onClick }: { href: string; label: string; pathname: string; onClick: () => void }) {
  const active = isActiveRoute(pathname, href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-3 px-2 font-medium rounded-lg transition text-sm ${
        active
          ? 'text-[#d7ffa4] bg-[#d7ffa4]/5 border-l-2 border-[#d7ffa4]'
          : 'text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-[#0b2a2b] border-l-2 border-transparent'
      }`}
    >
      {label}
    </Link>
  );
}