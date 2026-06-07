'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAdminAuthChange, getAdminData } from '@/lib/firebase/auth';
import { Admin } from '@/types';

interface AdminContextType {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType>({ user: null, admin: null, loading: true });

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

  return <AdminContext.Provider value={{ user, admin, loading }}>{children}</AdminContext.Provider>;
}

export const useAdmin = () => useContext(AdminContext);
