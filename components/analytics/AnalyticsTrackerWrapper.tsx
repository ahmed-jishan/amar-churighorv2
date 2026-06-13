'use client';

/**
 * Suspense wrapper for AnalyticsTracker.
 * Required because AnalyticsTracker uses useSearchParams() which needs Suspense boundary.
 */
import { Suspense, lazy } from 'react';

const AnalyticsTracker = lazy(() => import('./AnalyticsTracker'));

export default function AnalyticsTrackerWrapper() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}