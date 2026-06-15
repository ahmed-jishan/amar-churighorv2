/**
 * Admin Analytics Dashboard API — Server-side Aggregation
 *
 * Fetches ALL analytics data in a single endpoint using Admin SDK.
 * This bypasses client SDK issues on Vercel deployments.
 * Admin auth is verified via Firebase Auth token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/adminConfig';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTIONS = {
  visitorSessions: 'visitor_sessions',
  pageViews: 'page_views',
  productViews: 'product_views',
  dailyAnalytics: 'analytics_daily',
  monthlyAnalytics: 'analytics_monthly',
} as const;

const MAX_LIMIT = 1000;

// ─── Helpers ────────────────────────────────────────────────────

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

function nowISO(): string {
  return new Date().toISOString();
}

// ─── GET /api/admin/analytics/dashboard?filter=last-7-days&start=&end= ───

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') || 'last-7-days';
    const customStart = url.searchParams.get('start') || undefined;
    const customEnd = url.searchParams.get('end') || undefined;

    const { startDate, endDate } = getDateRange(filter, customStart, customEnd);

    const today = todayDateStr();
    const month = thisMonthStr();

    // ─── Parallel reads ──────────────────────────────────────
    const [
      dailySnap,
      monthlySnap,
      activeVisitors,
      totalUniqueVisitors,
      returningVisitorCount,
      dailyTrafficData,
      monthlyTrafficData,
      yearlyTrafficData,
      deviceData,
      topPagesData,
      topProductsData,
    ] = await Promise.all([
      // Today's daily doc
      db.collection(COLLECTIONS.dailyAnalytics).doc(today).get(),
      // This month's doc
      db.collection(COLLECTIONS.monthlyAnalytics).doc(month).get(),
      // Active visitors (last 5 min)
      getActiveVisitorCount(db),
      // Total unique visitors aggregated from all daily docs
      getTotalUniqueVisitors(db),
      // Returning visitors count
      getReturningVisitorCount(db),
      // Daily traffic for chart
      getDailyTrafficData(db, 30),
      // Monthly traffic for chart
      getMonthlyTrafficData(db, 12),
      // Yearly traffic
      getYearlyTrafficData(db),
      // Device distribution
      getDeviceDistributionData(db, startDate, endDate),
      // Top pages
      getTopPagesData(db, 10, startDate, endDate),
      // Top products
      getTopProductsData(db, 10, startDate, endDate),
    ]);

    const daily = dailySnap.exists ? dailySnap.data() : null;
    const monthly = monthlySnap.exists ? monthlySnap.data() : null;

    return NextResponse.json({
      success: true,
      summary: {
        totalVisitors: totalUniqueVisitors,
        activeVisitors,
        todayVisitors: (daily as any)?.uniqueVisitors ?? 0,
        monthlyVisitors: (monthly as any)?.uniqueVisitors ?? 0,
        returningVisitors: returningVisitorCount,
        totalPageViews: (daily as any)?.pageViews ?? 0,
        totalProductViews: (daily as any)?.productViews ?? 0,
        avgSessionDuration: (daily as any)?.avgSessionDuration ?? 0,
      },
      dailyTraffic: dailyTrafficData,
      monthlyTraffic: monthlyTrafficData,
      yearlyTraffic: yearlyTrafficData,
      deviceDistribution: deviceData,
      topPages: topPagesData,
      topProducts: topProductsData,
    });
  } catch (err) {
    console.error('[/api/admin/analytics/dashboard] error', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

// ─── Active Visitors (last 5 minutes) ──────────────────────────

async function getActiveVisitorCount(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const snap = await db
      .collection(COLLECTIONS.visitorSessions)
      .where('lastActivity', '>=', fiveMinAgo)
      .limit(500)
      .get();
    return snap.docs.filter(d => d.data().isActive === true).length;
  } catch {
    return 0;
  }
}

// ─── Total Unique Visitors ─────────────────────────────────────

async function getTotalUniqueVisitors(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    const snap = await db
      .collection(COLLECTIONS.dailyAnalytics)
      .orderBy('date', 'desc')
      .limit(MAX_LIMIT)
      .get();
    return snap.docs.reduce(
      (sum, d) => sum + ((d.data().uniqueVisitors as number) || 0),
      0
    );
  } catch {
    try {
      const snap = await db.collection(COLLECTIONS.dailyAnalytics).limit(MAX_LIMIT).get();
      return snap.docs.reduce(
        (sum, d) => sum + ((d.data().uniqueVisitors as number) || 0),
        0
      );
    } catch {
      return 0;
    }
  }
}

// ─── Returning Visitors ────────────────────────────────────────

async function getReturningVisitorCount(db: FirebaseFirestore.Firestore): Promise<number> {
  try {
    const snap = await db
      .collection(COLLECTIONS.visitorSessions)
      .where('visitCount', '>=', 2)
      .limit(MAX_LIMIT)
      .get();
    const unique = new Set(snap.docs.map(d => d.data().visitorId));
    return unique.size;
  } catch {
    return 0;
  }
}

// ─── Daily Traffic ─────────────────────────────────────────────

async function getDailyTrafficData(
  db: FirebaseFirestore.Firestore,
  days: number
): Promise<{ date: string; visitors: number; pageViews: number }[]> {
  try {
    const startDate = dateStrNDaysAgo(days);
    const today = todayDateStr();

    const snap = await db
      .collection(COLLECTIONS.dailyAnalytics)
      .where('date', '>=', startDate)
      .where('date', '<=', today)
      .orderBy('date', 'asc')
      .limit(days + 2)
      .get();

    const dataMap = new Map<string, any>();
    snap.docs.forEach(d => {
      const data = d.data();
      dataMap.set(data.date || d.id, data);
    });

    const points: { date: string; visitors: number; pageViews: number }[] = [];
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

// ─── Monthly Traffic ───────────────────────────────────────────

async function getMonthlyTrafficData(
  db: FirebaseFirestore.Firestore,
  months: number
): Promise<{ month: string; visitors: number; pageViews: number }[]> {
  try {
    const startMonth = monthStrNMonthsAgo(months);
    const currentMonth = thisMonthStr();

    const snap = await db
      .collection(COLLECTIONS.monthlyAnalytics)
      .where('month', '>=', startMonth)
      .where('month', '<=', currentMonth)
      .orderBy('month', 'asc')
      .limit(months + 2)
      .get();

    const dataMap = new Map<string, any>();
    snap.docs.forEach(d => {
      const data = d.data();
      dataMap.set(data.month || d.id, data);
    });

    const points: { month: string; visitors: number; pageViews: number }[] = [];
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

// ─── Yearly Traffic ────────────────────────────────────────────

async function getYearlyTrafficData(
  db: FirebaseFirestore.Firestore
): Promise<{ year: string; visitors: number; pageViews: number }[]> {
  try {
    const currentYear = new Date().getFullYear();
    const startMonth = `${currentYear - 4}-01`;
    const endMonth = `${currentYear}-12`;

    const snap = await db
      .collection(COLLECTIONS.monthlyAnalytics)
      .where('month', '>=', startMonth)
      .where('month', '<=', endMonth)
      .orderBy('month', 'asc')
      .limit(60)
      .get();

    const yearMap = new Map<string, { visitors: number; pageViews: number }>();
    for (let y = currentYear - 4; y <= currentYear; y++) {
      yearMap.set(String(y), { visitors: 0, pageViews: 0 });
    }

    snap.docs.forEach(d => {
      const data = d.data();
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

async function getDeviceDistributionData(
  db: FirebaseFirestore.Firestore,
  startDate?: string,
  endDate?: string
): Promise<{ name: string; count: number; percentage: number }[]> {
  try {
    const q = startDate
      ? db.collection(COLLECTIONS.visitorSessions).where('sessionStart', '>=', startDate).limit(MAX_LIMIT)
      : db.collection(COLLECTIONS.visitorSessions).limit(MAX_LIMIT);

    const snap = await q.get();
    const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    let total = 0;

    snap.docs.forEach(d => {
      const data = d.data();
      if (endDate && data.sessionStart > endDate) return;
      const device = data.deviceType as string;
      if (counts[device] !== undefined) {
        counts[device]++;
        total++;
      }
    });

    return ['desktop', 'mobile', 'tablet'].map(name => ({
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

// ─── Top Pages ─────────────────────────────────────────────────

async function getTopPagesData(
  db: FirebaseFirestore.Firestore,
  limitCount: number = 10,
  startDate?: string,
  endDate?: string
): Promise<{ url: string; count: number }[]> {
  try {
    const ref = db.collection(COLLECTIONS.pageViews);
    const q = startDate
      ? ref.where('timestamp', '>=', startDate).limit(MAX_LIMIT)
      : ref.orderBy('timestamp', 'desc').limit(MAX_LIMIT);

    const snap = await q.get();
    const counts = new Map<string, number>();

    snap.docs.forEach(d => {
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

// ─── Top Products ──────────────────────────────────────────────

async function getTopProductsData(
  db: FirebaseFirestore.Firestore,
  limitCount: number = 10,
  startDate?: string,
  endDate?: string
): Promise<{ productId: string; productName: string; count: number }[]> {
  try {
    const ref = db.collection(COLLECTIONS.productViews);
    const q = startDate
      ? ref.where('timestamp', '>=', startDate).limit(MAX_LIMIT)
      : ref.orderBy('timestamp', 'desc').limit(MAX_LIMIT);

    const snap = await q.get();
    const counts = new Map<string, { productId: string; productName: string; count: number }>();

    snap.docs.forEach(d => {
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

// ─── Date Range Helper ─────────────────────────────────────────

function getDateRange(
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