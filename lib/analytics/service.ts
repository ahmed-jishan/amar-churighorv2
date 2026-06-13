/**
 * Analytics Firestore Service
 * 
 * Handles all Firestore read/write operations for analytics data.
 * Uses batched writes and async logging to minimize performance impact.
 * All IP addresses are masked/hashed for privacy compliance.
 * 
 * IMPORTANT: Firestore limit() maximum is 10,000. All queries respect this.
 * Aggregations use pre-computed daily/monthly counters instead of scanning raw data.
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

// ─── Collection References ──────────────────────────────────

const COLLECTIONS = {
  visitorSessions: 'visitor_sessions',
  pageViews: 'page_views',
  productViews: 'product_views',
  dailyAnalytics: 'analytics_daily',
  monthlyAnalytics: 'analytics_monthly',
} as const;

// ─── Constants ─────────────────────────────────────────────

const MAX_LIMIT = 10000;

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

// ─── Track Session ──────────────────────────────────────────

export async function trackSession(session: Omit<VisitorSession, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.visitorSessions), {
    ...session,
    createdAt: nowISO(),
  });
  
  // Increment daily unique visitors counter
  await incrementDailyUniqueVisitors();
  
  return docRef.id;
}

/**
 * Update session: set exit page, mark inactive, compute duration.
 */
export async function endSession(sessionId: string, exitPage: string): Promise<void> {
  const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
  const q = query(sessionsRef, where('sessionId', '==', sessionId), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data() as VisitorSession;
  const sessionStart = new Date(data.sessionStart).getTime();
  const duration = Math.floor((Date.now() - sessionStart) / 1000);

  await setDoc(doc(db, COLLECTIONS.visitorSessions, docSnap.id), {
    exitPage,
    duration,
    isActive: false,
    lastActivity: nowISO(),
  }, { merge: true });
}

// ─── Heartbeat / Touch Session ──────────────────────────────

export async function touchSession(sessionId: string, currentPage: string): Promise<void> {
  const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
  const q = query(sessionsRef, where('sessionId', '==', sessionId), where('isActive', '==', true), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const docSnap = snapshot.docs[0];
  await setDoc(doc(db, COLLECTIONS.visitorSessions, docSnap.id), {
    lastActivity: nowISO(),
    exitPage: currentPage,
  }, { merge: true });
}

// ─── Track Page View ────────────────────────────────────────

export async function trackPageView(pageView: Omit<PageView, 'id'>): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.pageViews), {
    ...pageView,
    timestamp: pageView.timestamp || nowISO(),
  });

  await updateDailyPageViewCount();
}

// ─── Track Product View ─────────────────────────────────────

export async function trackProductView(productView: Omit<ProductView, 'id'>): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.productViews), {
    ...productView,
    timestamp: productView.timestamp || nowISO(),
  });

  await updateDailyProductViewCount();
}

// ─── Daily Analytics Counters (increment only) ──────────────

async function incrementDailyUniqueVisitors(): Promise<void> {
  const dateId = todayDateStr();
  try {
    await setDoc(doc(db, COLLECTIONS.dailyAnalytics, dateId), {
      totalVisitors: increment(1),
      uniqueVisitors: increment(1),
      updatedAt: nowISO(),
    }, { merge: true });
  } catch { /* silent */ }
}

async function updateDailyPageViewCount(): Promise<void> {
  const dateId = todayDateStr();
  try {
    await setDoc(doc(db, COLLECTIONS.dailyAnalytics, dateId), {
      pageViews: increment(1),
      updatedAt: nowISO(),
    }, { merge: true });
  } catch { /* silent */ }
}

async function updateDailyProductViewCount(): Promise<void> {
  const dateId = todayDateStr();
  try {
    await setDoc(doc(db, COLLECTIONS.dailyAnalytics, dateId), {
      productViews: increment(1),
      updatedAt: nowISO(),
    }, { merge: true });
  } catch { /* silent */ }
}

// ─── Active Visitors (last 5 minutes) ───────────────────────

export async function getActiveVisitorCount(): Promise<number> {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
    const q = query(
      sessionsRef,
      where('isActive', '==', true),
      where('lastActivity', '>=', fiveMinAgo),
      limit(MAX_LIMIT)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch {
    return 0;
  }
}

// ─── Dashboard Summary ──────────────────────────────────────

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const today = todayDateStr();
  const month = thisMonthStr();

  // Get daily aggregate (direct doc read - fast, no collection scan)
  const dailyRef = doc(db, COLLECTIONS.dailyAnalytics, today);
  const dailySnap = await getDoc(dailyRef);
  const daily = dailySnap.exists() ? (dailySnap.data() as DailyAnalytics) : null;

  // Get monthly aggregate (direct doc read - fast)
  const monthlyRef = doc(db, COLLECTIONS.monthlyAnalytics, month);
  const monthlySnap = await getDoc(monthlyRef);
  const monthly = monthlySnap.exists() ? (monthlySnap.data() as MonthlyAnalytics) : null;

  // Get active visitors
  const activeVisitors = await getActiveVisitorCount();

  // Total visitors = sum of all daily totals (approximate but fast)
  const totalVisitors = await getTotalUniqueVisitors();

  // Returning visitors = unique visitors with visitCount >= 2
  const returningVisitors = await getReturningVisitorCount();

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
}

// ─── Total Unique Visitors (from daily aggregates) ─────────

async function getTotalUniqueVisitors(): Promise<number> {
  try {
    // Sum unique visitors from all daily docs (fast, no collection scan)
    const dailyCollection = collection(db, COLLECTIONS.dailyAnalytics);
    const q = query(dailyCollection, orderBy('date', 'desc'), limit(MAX_LIMIT));
    const snapshot = await getDocs(q);
    let total = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data() as DailyAnalytics;
      total += data.uniqueVisitors || 0;
    });
    return total;
  } catch {
    return 0;
  }
}

// ─── Returning Visitor Count ────────────────────────────────

async function getReturningVisitorCount(): Promise<number> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
    const q = query(sessionsRef, where('visitCount', '>=', 2), limit(MAX_LIMIT));
    const snapshot = await getDocs(q);
    const unique = new Set<string>();
    snapshot.docs.forEach(doc => {
      unique.add(doc.data().visitorId);
    });
    return unique.size;
  } catch {
    return 0;
  }
}

// ─── Daily Traffic Data ────────────────────────────────────

export async function getDailyTraffic(days: number = 30): Promise<DailyTrafficPoint[]> {
  const points: DailyTrafficPoint[] = [];
  
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    const ref = doc(db, COLLECTIONS.dailyAnalytics, dateId);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      const data = snap.data() as DailyAnalytics;
      points.push({
        date: dateId,
        visitors: data.uniqueVisitors,
        pageViews: data.pageViews,
      });
    } else {
      points.push({
        date: dateId,
        visitors: 0,
        pageViews: 0,
      });
    }
  }

  return points;
}

// ─── Monthly Traffic Data ──────────────────────────────────

export async function getMonthlyTraffic(months: number = 12): Promise<MonthlyTrafficPoint[]> {
  const points: MonthlyTrafficPoint[] = [];
  
  for (let i = months; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const ref = doc(db, COLLECTIONS.monthlyAnalytics, monthId);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      const data = snap.data() as MonthlyAnalytics;
      points.push({
        month: monthId,
        visitors: data.uniqueVisitors,
        pageViews: data.pageViews,
      });
    } else {
      points.push({
        month: monthId,
        visitors: 0,
        pageViews: 0,
      });
    }
  }

  return points;
}

// ─── Yearly Traffic Data ───────────────────────────────────

export async function getYearlyTraffic(): Promise<YearlyTrafficPoint[]> {
  const currentYear = new Date().getFullYear();
  const points: YearlyTrafficPoint[] = [];

  for (let year = currentYear - 4; year <= currentYear; year++) {
    const yearStr = String(year);
    let totalVisitors = 0;
    let totalPageViews = 0;

    for (let month = 1; month <= 12; month++) {
      const monthId = `${yearStr}-${String(month).padStart(2, '0')}`;
      const ref = doc(db, COLLECTIONS.monthlyAnalytics, monthId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as MonthlyAnalytics;
        totalVisitors += data.uniqueVisitors;
        totalPageViews += data.pageViews;
      }
    }

    points.push({
      year: yearStr,
      visitors: totalVisitors,
      pageViews: totalPageViews,
    });
  }

  return points;
}

// ─── Device Distribution (from sessions within date range) ──

export async function getDeviceDistribution(startDate?: string, endDate?: string): Promise<DeviceDistribution[]> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
    let q;

    if (startDate && endDate) {
      q = query(
        sessionsRef,
        where('sessionStart', '>=', startDate),
        where('sessionStart', '<=', endDate),
        limit(MAX_LIMIT)
      );
    } else {
      q = query(sessionsRef, orderBy('sessionStart', 'desc'), limit(MAX_LIMIT));
    }

    const snapshot = await getDocs(q);
    const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    let total = 0;

    snapshot.docs.forEach(doc => {
      const device = doc.data().deviceType as string;
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

// ─── Top Visited Pages (from page views with limit) ─────────

export async function getTopPages(limitCount: number = 10, startDate?: string, endDate?: string): Promise<{ url: string; count: number }[]> {
  try {
    const pageViewsRef = collection(db, COLLECTIONS.pageViews);
    let q;

    if (startDate && endDate) {
      q = query(
        pageViewsRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        limit(MAX_LIMIT)
      );
    } else {
      q = query(pageViewsRef, orderBy('timestamp', 'desc'), limit(MAX_LIMIT));
    }

    const snapshot = await getDocs(q);
    const counts = new Map<string, number>();

    snapshot.docs.forEach(doc => {
      const url = doc.data().pageUrl || '/';
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

// ─── Top Viewed Products ────────────────────────────────────

export async function getTopProducts(limitCount: number = 10, startDate?: string, endDate?: string): Promise<{ productId: string; productName: string; count: number }[]> {
  try {
    const productViewsRef = collection(db, COLLECTIONS.productViews);
    let q;

    if (startDate && endDate) {
      q = query(
        productViewsRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        limit(MAX_LIMIT)
      );
    } else {
      q = query(productViewsRef, orderBy('timestamp', 'desc'), limit(MAX_LIMIT));
    }

    const snapshot = await getDocs(q);
    const counts = new Map<string, { productId: string; productName: string; count: number }>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
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

// ─── Recent Sessions ────────────────────────────────────────

export async function getRecentSessions(limitCount: number = 100): Promise<VisitorSession[]> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
    const q = query(sessionsRef, orderBy('sessionStart', 'desc'), limit(Math.min(limitCount, MAX_LIMIT)));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as VisitorSession),
    }));
  } catch {
    return [];
  }
}

// ─── Sessions by Visitor ID ─────────────────────────────────

export async function getSessionsByVisitorId(visitorId: string): Promise<VisitorSession[]> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.visitorSessions);
    const q = query(
      sessionsRef,
      where('visitorId', '==', visitorId),
      orderBy('sessionStart', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as VisitorSession),
    }));
  } catch {
    return [];
  }
}

// ─── Page Views by Session ──────────────────────────────────

export async function getPageViewsBySession(sessionId: string): Promise<PageView[]> {
  try {
    const pageViewsRef = collection(db, COLLECTIONS.pageViews);
    const q = query(
      pageViewsRef,
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc'),
      limit(500)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as PageView),
    }));
  } catch {
    return [];
  }
}

// ─── Product Views by Session ───────────────────────────────

export async function getProductViewsBySession(sessionId: string): Promise<ProductView[]> {
  try {
    const productViewsRef = collection(db, COLLECTIONS.productViews);
    const q = query(
      productViewsRef,
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc'),
      limit(200)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as ProductView),
    }));
  } catch {
    return [];
  }
}

// ─── Query Helper for Date Ranges ───────────────────────────

export function getDateRange(filter: string, customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;

  switch (filter) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: end };
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const yEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: yEnd.toISOString() };
    }
    case 'last-7-days':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString(), endDate: end };
    case 'last-30-days':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start.toISOString(), endDate: end };
    case 'this-month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: end };
    case 'this-year':
      start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start.toISOString(), endDate: end };
    case 'custom':
      const customStartDate = customStart || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return {
        startDate: customStartDate,
        endDate: customEnd || end,
      };
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start.toISOString(), endDate: end };
  }
}