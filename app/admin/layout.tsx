import { Suspense } from 'react';
import { AdminProvider } from '@/context/AdminContext';
import AdminShell from '@/components/admin/AdminShell';

function AdminLayoutFallback() {
  return (
    <div className="min-h-screen bg-[#030f10] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <Suspense fallback={<AdminLayoutFallback />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </AdminProvider>
  );
}