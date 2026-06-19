'use client';
import { useAdmin } from '@/context/AdminContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { logoutAdmin } from '@/lib/firebase/auth';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Tag, Home, ChevronRight,
  Layers, ImageIcon, ShieldCheck, FileText, MessageSquare, HelpCircle, Star, ChevronDown,
  Menu, X, BarChart3, Activity, Megaphone, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, admin, loading, isAdmin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user && !pathname.includes('/admin/login')) {
      router.push('/admin/login');
    }
  }, [user, loading, pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (pathname.includes('/admin/login')) return <>{children}</>;

  if (loading) return (
    <div className="min-h-screen bg-[#030f10] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  const sidebarContent = (
    <>
      <div className="p-4 md:p-5 border-b border-[#1f3334]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-base md:text-lg">Amar Churighor</p>
            <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
          </div>
          {/* Mobile close button */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto scrollbar-admin">
        {/* Main navigation */}
        {[
          { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
          { href: '/admin/products', icon: Package, label: 'Products', show: true },
          { href: '/admin/categories', icon: Layers, label: 'Categories', show: true },
          { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', show: true },
          { href: '/admin/customers', icon: Users, label: 'Customers', show: true },
          { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', show: true },
        ].filter(item => item.show).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
            </Link>
          );
        })}

        {/* ── Content Management Section ── */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <MessageSquare className="w-4 h-4 text-[#d7ffa4] shrink-0" />
            <span className="text-[10px] text-[#d7ffa4] uppercase tracking-wider font-semibold truncate">Content Management</span>
          </div>
        </div>

        {/* Content sub-items - use query param tab switching */}
        {[
          { href: '/admin/content?tab=reviews', icon: Star, label: 'Customer Reviews', tab: 'reviews' },
          { href: '/admin/content?tab=review-settings', icon: Settings, label: 'Review Settings', tab: 'review-settings' },
          { href: '/admin/content?tab=faqs', icon: HelpCircle, label: 'FAQs', tab: 'faqs' },
        ].map(({ href, icon: Icon, label, tab }) => {
          const currentTab = searchParams.get('tab');
          const isActive = pathname === '/admin/content' && currentTab === tab;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ml-2 ${
                isActive
                  ? 'bg-[#d7ffa4]/10 text-[#d7ffa4] font-medium border border-[#d7ffa4]/20'
                  : 'text-gray-500 hover:text-white hover:bg-[#0b2a2b]'
              }`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        {/* ── Marketing Section ── */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-3 py-1">
            <Megaphone className="w-4 h-4 text-[#d7ffa4] shrink-0" />
            <span className="text-[10px] text-[#d7ffa4] uppercase tracking-wider font-semibold truncate">Marketing</span>
          </div>
        </div>

        {[
          { href: '/admin/marketing/campaigns', icon: Megaphone, label: 'Offer Campaigns', show: true },
          { href: '/admin/marketing/announcements', icon: Megaphone, label: 'Announcements', show: true },
        ].filter(item => item.show).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ml-2 ${
                active ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
            </Link>
          );
        })}

        {/* Other standalone sections */}
        {[
          { href: '/admin/hero', icon: ImageIcon, label: 'Hero Slides', show: true },
          { href: '/admin/footer', icon: FileText, label: 'Footer', show: true },
          { href: '/admin/saved-urls', icon: LinkIcon, label: 'Saved URLs', show: true },
        ].filter(item => item.show).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
            </Link>
          );
        })}

        {/* Settings */}
        {isAdmin && (
          <Link href="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              pathname === '/admin/settings' ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
            }`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Settings</span>
            {pathname === '/admin/settings' && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
          </Link>
        )}
      </nav>

      <div className="p-3 md:p-4 border-t border-[#1f3334] sticky bottom-0 z-20">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 bg-[#d7ffa4] rounded-full flex items-center justify-center text-[#1a1a1a] font-bold text-sm shrink-0">
            {admin?.name?.[0] ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin?.name ?? 'Admin'}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{admin?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="flex-1 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition px-3 py-2 rounded-lg hover:bg-[#0b2a2b]">
            <Home className="w-3 h-3 shrink-0" /> Store
          </Link>
          <button onClick={() => logoutAdmin()} className="flex-1 flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition px-3 py-2 rounded-lg hover:bg-[#0b2a2b]">
            <LogOut className="w-3 h-3 shrink-0" /> Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-[#030f10] flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar (overlay) */}
      <motion.aside
        initial={false}
        animate={sidebarOpen ? 'open' : 'closed'}
        variants={{
          open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
          closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
        }}
        className="fixed inset-y-0 left-0 z-50 w-64 md:w-60 bg-[#051a1b] border-r border-[#1f3334] flex flex-col md:hidden"
      >
        {sidebarContent}
      </motion.aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden md:flex md:flex-col md:w-60 bg-[#051a1b] border-r border-[#1f3334]">
        <div className="p-5 border-b border-[#1f3334]">
          <p className="font-bold text-white text-lg">Amar Churighor</p>
          <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-admin">
          {/* Main navigation */}
          {[
            { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
            { href: '/admin/products', icon: Package, label: 'Products', show: true },
            { href: '/admin/categories', icon: Layers, label: 'Categories', show: true },
            { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', show: true },
            { href: '/admin/customers', icon: Users, label: 'Customers', show: true },
            { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', show: true },
          ].filter(item => item.show).map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
              </Link>
            );
          })}

          {/* ── Content Management Section ── */}
          <div className="pt-4 pb-1">
            <div className="flex items-center gap-2 px-3 py-1">
              <MessageSquare className="w-4 h-4 text-[#d7ffa4]" />
              <span className="text-[10px] text-[#d7ffa4] uppercase tracking-wider font-semibold">Content Management</span>
            </div>
          </div>

          {/* Content sub-items */}
          {[
            { href: '/admin/content?tab=reviews', icon: Star, label: 'Customer Reviews', tab: 'reviews' },
            { href: '/admin/content?tab=review-settings', icon: Settings, label: 'Review Settings', tab: 'review-settings' },
            { href: '/admin/content?tab=faqs', icon: HelpCircle, label: 'FAQs', tab: 'faqs' },
          ].map(({ href, icon: Icon, label, tab }) => {
            const currentTab = searchParams.get('tab');
            const isActive = pathname === '/admin/content' && currentTab === tab;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ml-2 ${
                  isActive
                    ? 'bg-[#d7ffa4]/10 text-[#d7ffa4] font-medium border border-[#d7ffa4]/20'
                    : 'text-gray-500 hover:text-white hover:bg-[#0b2a2b]'
                }`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          {/* ── Marketing Section ── */}
          <div className="pt-4 pb-1">
            <div className="flex items-center gap-2 px-3 py-1">
              <Megaphone className="w-4 h-4 text-[#d7ffa4]" />
              <span className="text-[10px] text-[#d7ffa4] uppercase tracking-wider font-semibold">Marketing</span>
            </div>
          </div>

          {[
          { href: '/admin/marketing/campaigns', icon: Megaphone, label: 'Offer Campaigns', show: true },
          { href: '/admin/marketing/announcements', icon: Megaphone, label: 'Announcements', show: true },
        ].filter(item => item.show).map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ml-2 ${
                  active ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
              </Link>
            );
          })}

          {/* Other standalone sections */}
          {[
            { href: '/admin/hero', icon: ImageIcon, label: 'Hero Slides', show: true },
            { href: '/admin/footer', icon: FileText, label: 'Footer', show: true },
            { href: '/admin/saved-urls', icon: LinkIcon, label: 'Saved URLs', show: true },
          ].filter(item => item.show).map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
              </Link>
            );
          })}

          {/* Settings */}
          {isAdmin && (
            <Link href="/admin/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                pathname === '/admin/settings' ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
              }`}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">Settings</span>
              {pathname === '/admin/settings' && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-[#1f3334] sticky bottom-0 z-20">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 bg-[#d7ffa4] rounded-full flex items-center justify-center text-[#1a1a1a] font-bold text-sm shrink-0">
              {admin?.name?.[0] ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{admin?.name ?? 'Admin'}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{admin?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition px-3 py-2 rounded-lg hover:bg-[#0b2a2b]">
              <Home className="w-3 h-3 shrink-0" /> Store
            </Link>
            <button onClick={() => logoutAdmin()} className="flex-1 flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition px-3 py-2 rounded-lg hover:bg-[#0b2a2b]">
              <LogOut className="w-3 h-3 shrink-0" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile header with hamburger */}
        <div className="sticky top-0 z-30 md:hidden bg-[#030f10] border-b border-[#1f3334] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-1 -ml-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">Amar Churighor</p>
            <p className="text-[10px] text-gray-500 truncate">Admin Panel</p>
          </div>
          <div className="w-7 h-7 bg-[#d7ffa4] rounded-full flex items-center justify-center text-[#1a1a1a] font-bold text-xs shrink-0">
            {admin?.name?.[0] ?? 'A'}
          </div>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
