'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAdminAuthChange, getAdminData } from '@/lib/firebase/auth';
import { Admin } from '@/types';

interface AdminContextType {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canManageAdmins: boolean;
  canCreateAdmin: boolean;
  canEditAdmin: boolean;
  canDeleteAdmin: boolean;
  canSuspendAdmin: boolean;
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  admin: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  canManageAdmins: false,
  canCreateAdmin: false,
  canEditAdmin: false,
  canDeleteAdmin: false,
  canSuspendAdmin: false,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAdminAuthChange(async (u) => {
      setUser(u);
      if (u) {
        const data = await getAdminData(u.uid);
        setAdmin(data);
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const role = admin?.role || '';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Permission helpers
  const canManageAdmins = isSuperAdmin;
  const canCreateAdmin = isSuperAdmin;
  const canEditAdmin = isSuperAdmin;
  const canDeleteAdmin = isSuperAdmin;
  const canSuspendAdmin = isSuperAdmin;

  return (
    <AdminContext.Provider value={{
      user, admin, loading,
      isSuperAdmin, isAdmin,
      canManageAdmins, canCreateAdmin, canEditAdmin, canDeleteAdmin, canSuspendAdmin,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);