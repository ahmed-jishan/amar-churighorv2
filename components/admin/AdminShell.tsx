'use client';
import { useAdmin } from '@/context/AdminContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { logoutAdmin } from '@/lib/firebase/auth';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Tag, Home, ChevronRight,
  Layers, ImageIcon, ShieldCheck, FileText
} from 'lucide-react';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, admin, loading, isAdmin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !pathname.includes('/admin/login')) {
      router.push('/admin/login');
    }
  }, [user, loading, pathname]);

  if (pathname.includes('/admin/login')) return <>{children}</>;

  if (loading) return (
    <div className="min-h-screen bg-[#030f10] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#030f10] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#051a1b] border-r border-[#1f3334] flex flex-col">
        <div className="p-5 border-b border-[#1f3334]">
          <p className="font-bold text-white text-lg">Amar Churighor</p>
          <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
            { href: '/admin/products', icon: Package, label: 'Products', show: true },
            { href: '/admin/categories', icon: Layers, label: 'Categories', show: true },
            { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', show: true },
            { href: '/admin/customers', icon: Users, label: 'Customers', show: true },
            { href: '/admin/content', icon: Tag, label: 'Content', show: true },
            { href: '/admin/hero', icon: ImageIcon, label: 'Hero', show: true },
            { href: '/admin/footer', icon: FileText, label: 'Footer', show: true },
            { href: '/admin/settings', icon: Settings, label: 'Settings', show: isAdmin },
          ].filter(item => item.show).map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active ? 'bg-[#d7ffa4] text-[#1a1a1a] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#0b2a2b]'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1f3334]">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 bg-[#d7ffa4] rounded-full flex items-center justify-center text-[#1a1a1a] font-bold text-sm">
              {admin?.name?.[0] ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{admin?.name ?? 'Admin'}</p>
              <p className="text-xs text-gray-500 capitalize">{admin?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition px-3 py-2 rounded-lg hover:bg-[#0b2a2b]">
              <Home className="w-3 h-3" /> Store
            </Link>
            <button onClick={() => logoutAdmin()} className="flex-1 flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition px-3 py-2 rounded-lg hover:bg-[#0b2a2b]">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
