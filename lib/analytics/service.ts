/**
 * Analytics Firestore Service — Bulletproof Edition
 * Fixed: missing date field, monthly counter, composite index issues,
 *        loop-based reads replaced with batch queries.
 */

import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  increment,
  Timestamp,
} from 'firebase/firestore';
import {
  VisitorSession,
  PageView,
  ProductView,
  DailyAnalytics,
  MonthlyAnalytics,
  AnalyticsSummary,
  DailyTrafficPoint,
  MonthlyTrafficPoint,
  YearlyTrafficPoint,
  DeviceDistribution,
} from './types';

const COLLECTIONS = {
  visitorSessions: 'visitor_sessions',
  pageViews: 'page_views',
  productViews: 'product_views',
  dailyAnalytics: 'analytics_daily',
  monthlyAnalytics: 'analytics_monthly',
} as const;

const MAX_LIMIT = 1000;

// ─── Helpers ────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function thisMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dateStrNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthStrNMonthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Track Session ──────────────────────────────────────────

export async function trackSession(
  session: Omit<VisitorSession, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.visitorSessions), {
    ...session,
    createdAt: nowISO(),
  });

  // Update both daily AND monthly counters
  await Promise.all([
    incrementDailyCounter('uniqueVisitors'),
    incrementMonthlyCounter('uniqueVisitors'),
  ]);

  return docRef.id;
}

export async function endSession(sessionId: string, exitPage: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.visitorSessions),
      where('sessionId', '==', sessionId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as VisitorSession;
    const duration = Math.floor(
      (Date.now() - new Date(data.sessionStart).getTime()) / 1000
    );

    await setDoc(
      doc(db, COLLECTIONS.visitorSessions, docSnap.id),
      { exitPage, duration, isActive: false, lastActivity: nowISO() },
      { merge: true }
    );
  } catch { /* silent */ }
}

export async function touchSession(sessionId: string, currentPage: string): Promise<void> {
  try {
    // Simplified: only query by sessionId to avoid composite index requirement
    const q = query(
      collection(db, COLLECTIONS.visitorSessions),
      where('sessionId', '==', sessionId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    await setDoc(
      doc(db, COLLECTIONS.visitorSessions, snapshot.docs[0].id),
      { lastActivity: nowISO(), exitPage: currentPage },
      { merge: true }
    );
  } catch { /* silent */ }
}

// ─── Track Page View ────────────────────────────────────────

export async function trackPageView(pageView: Omit<PageView, 'id'>): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.pageViews), {
    ...pageView,
    timestamp: pageView.timestamp || nowISO(),
  });
  await Promise.all([
    incrementDailyCounter('pageViews'),
    incrementMonthlyCounter('pageViews'),
  ]);
}

// ─── Track Product View ─────────────────────────────────────

export async function trackProductView(productView: Omit<ProductView, 'id'>): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.productViews), {
    ...productView,
    timestamp: productView.timestamp || nowISO(),
  });
  await Promise.all([
    incrementDailyCounter('productViews'),
    incrementMonthlyCounter('productViews'),
  ]);
}

// ─── Counter Helpers ─────────────────────────────────────────

async function incrementDailyCounter(field: string): Promise<void> {
  const dateId = todayDateStr();
  try {
    await setDoc(
      doc(db, COLLECTIONS.dailyAnalytics, dateId),
      {
        // FIX: always write 'date' field so orderBy('date') works
        date: dateId,
        [field]: increment(1),
        updatedAt: nowISO(),
      },
      { merge: true }
    );
  } catch { /* silent */ }
}

async function incrementMonthlyCounter(field: string): Promise<void> {
  const monthId = thisMonthStr();
  try {
    await setDoc(
      doc(db, COLLECTIONS.monthlyAnalytics, monthId),
      {
        // FIX: always write 'month' field so orderBy('month') works
        month: monthId,
        [field]: increment(1),
        updatedAt: nowISO(),
      },
      { merge: true }
    );
  } catch { /* silent */ }
}

// ─── Active Visitors ─────────────────────────────────────────

export async function getActiveVisitorCount(): Promise<number> {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    // FIX: removed isActive filter — avoids composite index requirement
    // Only filter by lastActivity (single field, no index needed)
    const q = query(
      collection(db, COLLECTIONS.visitorSessions),
      where('lastActivity', '>=', fiveMinAgo),
      limit(500)
    );
    const snapshot = await getDocs(q);
    // Filter isActive in memory
    return snapshot.docs.filter(d => d.data().isActive === true).length;
  } catch {
    return 0;
  }
}

// ─── Analytics Summary ───────────────────────────────────────

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  try {
    const today = todayDateStr();
    const month = thisMonthStr();

    const [dailySnap, monthlySnap, activeVisitors, totalVisitors, returningVisitors] =
      await Promise.all([
        getDoc(doc(db, COLLECTIONS.dailyAnalytics, today)),
        getDoc(doc(db, COLLECTIONS.monthlyAnalytics, month)),
        getActiveVisitorCount(),
        getTotalUniqueVisitors(),
        getReturningVisitorCount(),
      ]);

    const daily = dailySnap.exists() ? (dailySnap.data() as DailyAnalytics) : null;
    const monthly = monthlySnap.exists() ? (monthlySnap.data() as MonthlyAnalytics) : null;

    return {
      totalVisitors,
      activeVisitors,
      todayVisitors: daily?.uniqueVisitors ?? 0,
      monthlyVisitors: monthly?.uniqueVisitors ?? 0,
      returningVisitors,
      totalPageViews: daily?.pageViews ?? 0,
      totalProductViews: daily?.productViews ?? 0,
      avgSessionDuration: daily?.avgSessionDuration ?? 0,
    };
  } catch {
    return {
      totalVisitors: 0,
      activeVisitors: 0,
      todayVisitors: 0,
      monthlyVisitors: 0,
      returningVisitors: 0,
      totalPageViews: 0,
      totalProductViews: 0,
      avgSessionDuration: 0,
    };
  }
}

// ─── Total Unique Visitors ────────────────────────────────────

async function getTotalUniqueVisitors(): Promise<number> {
  try {
    // FIX: orderBy('date') now works because we write 'date' field on every increment
    const q = query(
      collection(db, COLLECTIONS.dailyAnalytics),
      orderBy('date', 'desc'),
      limit(MAX_LIMIT)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.reduce(
      (sum, d) => sum + ((d.data() as DailyAnalytics).uniqueVisitors || 0),
      0
    );
  } catch {
    // Fallback: sum without orderBy
    try {
      const snapshot = await getDocs(
        collection(db, COLLECTIONS.dailyAnalytics)
      );
      return snapshot.docs.reduce(
        (sum, d) => sum + ((d.data() as DailyAnalytics).uniqueVisitors || 0),
        0
      );
    } catch {
      return 0;
    }
  }
}

// ─── Returning Visitors ───────────────────────────────────────

async function getReturningVisitorCount(): Promise<number> {
  try {
    // FIX: no orderBy here — single where clause, no composite index needed
    const q = query(
      collection(db, COLLECTIONS.visitorSessions),
      where('visitCount', '>=', 2),
      limit(MAX_LIMIT)
    );
    const snapshot = await getDocs(q);
    const unique = new Set(snapshot.docs.map(d => d.data().visitorId));
    return unique.size;
  } catch {
    return 0;
  }
}

// ─── New: Fetch ALL dashboard data via Admin API (server-side) ──────────
// This is the recommended approach for Vercel deployments.
// Falls back to client SDK if API is unavailable.

export async function fetchDashboardDataViaAPI(
  filter: string = 'last-7-days',
  customStart?: string,
  customEnd?: string
): Promise<{
  summary: AnalyticsSummary | null;
  dailyTraffic: DailyTrafficPoint[];
  monthlyTraffic: MonthlyTrafficPoint[];
  yearlyTraffic: YearlyTrafficPoint[];
  deviceDistribution: DeviceDistribution[];
  topPages: { url: string; count: number }[];
  topProducts: { productId: string; productName: string; count: number }[];
} | null> {
  try {
    const params = new URLSearchParams({ filter });
    if (customStart) params.set('start', customStart);
    if (customEnd) params.set('end', customEnd);

    const res = await fetch(`/api/admin/analytics/dashboard?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;

    return {
      summary: json.summary as AnalyticsSummary,
      dailyTraffic: json.dailyTraffic as DailyTrafficPoint[],
      monthlyTraffic: json.monthlyTraffic as MonthlyTrafficPoint[],
      yearlyTraffic: json.yearlyTraffic as YearlyTrafficPoint[],
      deviceDistribution: json.deviceDistribution as DeviceDistribution[],
      topPages: json.topPages as { url: string; count: number }[],
      topProducts: json.topProducts as { productId: string; productName: string; count: number }[],
    };
  } catch {
    return null;
  }
}

// ─── Daily Traffic (FIX: batch query instead of 31 individual reads) ─────

export async function getDailyTraffic(days: number = 30): Promise<DailyTrafficPoint[]> {
  try {
    const startDate = dateStrNDaysAgo(days);
    const today = todayDateStr();

    // Single query instead of N individual doc reads
    const q = query(
      collection(db, COLLECTIONS.dailyAnalytics),
      where('date', '>=', startDate),
      where('date', '<=', today),
      orderBy('date', 'asc'),
      limit(days + 2)
    );
    const snapshot = await getDocs(q);

    // Build a map for O(1) lookup
    const dataMap = new Map<string, DailyAnalytics>();
    snapshot.docs.forEach(d => {
      const data = d.data() as DailyAnalytics;
      dataMap.set(data.date || d.id, data);
    });

    // Fill every date slot (including zeros for missing days)
    const points: DailyTrafficPoint[] = [];
    for (let i = days; i >= 0; i--) {
      const dateId = dateStrNDaysAgo(i);
      const data = dataMap.get(dateId);
      points.push({
        date: dateId,
        visitors: data?.uniqueVisitors ?? 0,
        pageViews: data?.pageViews ?? 0,
      });
    }
    return points;
  } catch {
    return [];
  }
}

// ─── Monthly Traffic (FIX: batch query) ──────────────────────

export async function getMonthlyTraffic(months: number = 12): Promise<MonthlyTrafficPoint[]> {
  try {
    const startMonth = monthStrNMonthsAgo(months);
    const currentMonth = thisMonthStr();

    const q = query(
      collection(db, COLLECTIONS.monthlyAnalytics),
      where('month', '>=', startMonth),
      where('month', '<=', currentMonth),
      orderBy('month', 'asc'),
      limit(months + 2)
    );
    const snapshot = await getDocs(q);

    const dataMap = new Map<string, MonthlyAnalytics>();
    snapshot.docs.forEach(d => {
      const data = d.data() as MonthlyAnalytics;
      dataMap.set(data.month || d.id, data);
    });

    const points: MonthlyTrafficPoint[] = [];
    for (let i = months; i >= 0; i--) {
      const monthId = monthStrNMonthsAgo(i);
      const data = dataMap.get(monthId);
      points.push({
        month: monthId,
        visitors: data?.uniqueVisitors ?? 0,
        pageViews: data?.pageViews ?? 0,
      });
    }
    return points;
  } catch {
    return [];
  }
}

// ─── Yearly Traffic (FIX: batch monthly reads per year) ───────

export async function getYearlyTraffic(): Promise<YearlyTrafficPoint[]> {
  try {
    const currentYear = new Date().getFullYear();
    const startMonth = `${currentYear - 4}-01`;
    const endMonth = `${currentYear}-12`;

    const q = query(
      collection(db, COLLECTIONS.monthlyAnalytics),
      where('month', '>=', startMonth),
      where('month', '<=', endMonth),
      orderBy('month', 'asc'),
      limit(60) // 5 years × 12 months
    );
    const snapshot = await getDocs(q);

    // Aggregate by year
    const yearMap = new Map<string, { visitors: number; pageViews: number }>();
    for (let y = currentYear - 4; y <= currentYear; y++) {
      yearMap.set(String(y), { visitors: 0, pageViews: 0 });
    }

    snapshot.docs.forEach(d => {
      const data = d.data() as MonthlyAnalytics;
      const year = (data.month || d.id).substring(0, 4);
      const entry = yearMap.get(year);
      if (entry) {
        entry.visitors += data.uniqueVisitors || 0;
        entry.pageViews += data.pageViews || 0;
      }
    });

    return Array.from(yearMap.entries()).map(([year, totals]) => ({
      year,
      visitors: totals.visitors,
      pageViews: totals.pageViews,
    }));
  } catch {
    return [];
  }
}

// ─── Device Distribution ──────────────────────────────────────

export async function getDeviceDistribution(
  startDate?: string,
  endDate?: string
): Promise<DeviceDistribution[]> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
    // FIX: avoid composite index — use single where clause, filter date in memory
    const q = startDate
      ? query(sessionsRef, where('sessionStart', '>=', startDate), limit(MAX_LIMIT))
      : query(sessionsRef, limit(MAX_LIMIT));

    const snapshot = await getDocs(q);
    const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    let total = 0;

    snapshot.docs.forEach(d => {
      const data = d.data();
      // Filter endDate in memory
      if (endDate && data.sessionStart > endDate) return;
      const device = data.deviceType as string;
      if (counts[device] !== undefined) {
        counts[device]++;
        total++;
      }
    });

    return (['desktop', 'mobile', 'tablet'] as const).map(name => ({
      name,
      count: counts[name],
      percentage: total > 0 ? Math.round((counts[name] / total) * 100) : 0,
    }));
  } catch {
    return [
      { name: 'desktop', count: 0, percentage: 0 },
      { name: 'mobile', count: 0, percentage: 0 },
      { name: 'tablet', count: 0, percentage: 0 },
    ];
  }
}

// ─── Top Pages ────────────────────────────────────────────────

export async function getTopPages(
  limitCount: number = 10,
  startDate?: string,
  endDate?: string
): Promise<{ url: string; count: number }[]> {
  try {
    const ref = collection(db, COLLECTIONS.pageViews);
    // FIX: single where clause to avoid composite index
    const q = startDate
      ? query(ref, where('timestamp', '>=', startDate), limit(MAX_LIMIT))
      : query(ref, orderBy('timestamp', 'desc'), limit(MAX_LIMIT));

    const snapshot = await getDocs(q);
    const counts = new Map<string, number>();

    snapshot.docs.forEach(d => {
      const data = d.data();
      if (endDate && data.timestamp > endDate) return;
      const url = data.pageUrl || '/';
      counts.set(url, (counts.get(url) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([url, count]) => ({ url, count }));
  } catch {
    return [];
  }
}

// ─── Top Products ─────────────────────────────────────────────

export async function getTopProducts(
  limitCount: number = 10,
  startDate?: string,
  endDate?: string
): Promise<{ productId: string; productName: string; count: number }[]> {
  try {
    const ref = collection(db, COLLECTIONS.productViews);
    const q = startDate
      ? query(ref, where('timestamp', '>=', startDate), limit(MAX_LIMIT))
      : query(ref, orderBy('timestamp', 'desc'), limit(MAX_LIMIT));

    const snapshot = await getDocs(q);
    const counts = new Map<string, { productId: string; productName: string; count: number }>();

    snapshot.docs.forEach(d => {
      const data = d.data();
      if (endDate && data.timestamp > endDate) return;
      const pid = data.productId;
      if (!counts.has(pid)) {
        counts.set(pid, { productId: pid, productName: data.productName || 'Unknown', count: 0 });
      }
      counts.get(pid)!.count++;
    });

    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limitCount);
  } catch {
    return [];
  }
}

// ─── Recent Sessions ──────────────────────────────────────────

export async function getRecentSessions(limitCount: number = 100): Promise<VisitorSession[]> {
  try {
    // If running in browser, use server-side admin API to avoid Firestore rules blocking reads
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/admin/analytics/sessions?limit=${limitCount}`);
      const json = await res.json();
      return (json.sessions || []).map((s: any) => ({ id: s.id, ...(s as VisitorSession) }));
    }

    const q = query(
      collection(db, COLLECTIONS.visitorSessions),
      orderBy('sessionStart', 'desc'),
      limit(Math.min(limitCount, MAX_LIMIT))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as VisitorSession) }));
  } catch {
    return [];
  }
}

export async function getSessionsByVisitorId(visitorId: string): Promise<VisitorSession[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.visitorSessions),
      where('visitorId', '==', visitorId),
      orderBy('sessionStart', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as VisitorSession) }));
  } catch {
    return [];
  }
}

export async function getPageViewsBySession(sessionId: string): Promise<PageView[]> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/admin/analytics/pageviews?sessionId=${encodeURIComponent(sessionId)}`);
      const json = await res.json();
      return (json.pageViews || []).map((p: any) => ({ id: p.id, ...(p as PageView) }));
    }

    const q = query(
      collection(db, COLLECTIONS.pageViews),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc'),
      limit(500)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as PageView) }));
  } catch {
    return [];
  }
}

export async function getProductViewsBySession(sessionId: string): Promise<ProductView[]> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/admin/analytics/productviews?sessionId=${encodeURIComponent(sessionId)}`);
      const json = await res.json();
      return (json.productViews || []).map((p: any) => ({ id: p.id, ...(p as ProductView) }));
    }

    const q = query(
      collection(db, COLLECTIONS.productViews),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as ProductView) }));
  } catch {
    return [];
  }
}

// ─── Date Range Helper ────────────────────────────────────────

export function getDateRange(
  filter: string,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString();

  switch (filter) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: end };
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      const yEnd = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: yEnd.toISOString() };
    }
    case 'last-7-days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString(), endDate: end };
    }
    case 'last-30-days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString(), endDate: end };
    }
    case 'this-month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: end };
    }
    case 'this-year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString(), endDate: end };
    }
    case 'custom':
      return {
        startDate: customStart || new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: customEnd || end,
      };
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString(), endDate: end };
    }
  }
}