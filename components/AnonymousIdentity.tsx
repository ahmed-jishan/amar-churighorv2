'use client';

import { useEffect } from 'react';
import { syncAnonymousId } from '@/lib/anonymousUser';

/**
 * Client component that syncs the anonymous identity cookie + localStorage on mount.
 * Injected once into the root layout — zero visual impact.
 */
export default function AnonymousIdentity() {
  useEffect(() => {
    syncAnonymousId();
  }, []);

  return null;
}