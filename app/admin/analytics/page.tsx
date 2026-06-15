'use client';

/**
 * Analytics Dashboard - Admin Panel
 * 
 * Professional SaaS-style analytics dashboard with:
 * - Stat cards (Total Visitors, Active, Today's, Monthly, Returning)
 * - Charts (Daily, Monthly, Yearly traffic, Device distribution)
 * - Tables (Top pages, Top products)
 * - Date filter controls
 * - Real-time active visitor count
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  Eye,
  Activity,
  TrendingUp,
  Calendar,
  Filter,
  ChevronDown,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  getAnalyticsSummary,
  getDailyTraffic,
  getMonthlyTraffic,
  getYearlyTraffic,
  getDeviceDistribution,
  getTopPages,
  getTopProducts,
  getActiveVisitorCount,
  getDateRange,
  fetchDashboardDataViaAPI,
} from '@/lib/analytics/service';
import type {
  AnalyticsSummary,
  DailyTrafficPoint,
  MonthlyTrafficPoint,
  YearlyTrafficPoint,
  DeviceDistribution,
  AnalyticsDateFilter,
} from '@/lib/analytics/types';
import Link from 'next/link';

// ─── Color palette ─────────────────────────────────────────

const COLORS = {
  primary: '#d7ffa4',
  primaryDark: '#a3d96a',
  cyan: '#22d3ee',
  purple: '#a78bfa',
  orange: '#fb923c',
  pink: '#f472b6',
  gray: '#6b7280',
  teal: '#2dd4bf',
};

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMonthLabel(month: string) {
  // Expecting format 'YYYY-MM' or 'YYYY-MM-DD'
  if (!month) return '';
  const parts = month.split('-');
  if (parts.length >= 2) {
    const m = Number(parts[1]);
    if (!Number.isNaN(m) && m >= 1 && m <= 12) return MONTH_SHORT[m - 1];
  }
  // Fallback: try Date parse
  const d = new Date(month);
  if (!isNaN(d.getTime())) return MONTH_SHORT[d.getMonth()];
  return month;
}

function formatDayLabel(dateStr: string) {
  // Expecting format 'YYYY-MM-DD' or ISO string
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    // remove leading zeros: '08' -> '8'
    return String(Number(parts[2]));
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return String(d.getDate());
  return dateStr;
}

// ─── Date Filter Options ───────────────────────────────────

const DATE_FILTERS: { value: AnalyticsDateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-7-days', label: 'Last 7 Days' },
  { value: 'last-30-days', label: 'Last 30 Days' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
];

// ─── Animated Stat Card ────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay = 0,
  prefix = '',
  suffix = '',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4 }}
      className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5 hover:border-[#d7ffa4]/20 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-white">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </motion.div>
  );
}

// ─── Simple Bar Chart ──────────────────────────────────────

function SimpleBarChart({
  data,
  color = COLORS.primary,
  height = 120,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No data available</div>;
  }

  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <div className="flex items-end gap-1.5 h-full">
        {data.map((point, i) => {
          const h = (point.value / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1f3334] text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {point.value}
              </div>
              <div
                className="w-full rounded-sm transition-all duration-300 cursor-pointer hover:opacity-80"
                style={{
                  height: `${h}%`,
                  backgroundColor: color,
                  minHeight: point.value > 0 ? 4 : 0,
                }}
              />
              <span className="text-[10px] text-gray-400 whitespace-nowrap truncate w-full text-center mt-0.5">
                {point.label.length > 6 ? point.label.slice(0, 6) + '..' : point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Donut Chart (Device Distribution) ─────────────────────

function DonutChart({ data }: { data: DeviceDistribution[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No data available</div>;
  }

  const colors = ['#d7ffa4', '#22d3ee', '#a78bfa'];
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += d.count;
    const endAngle = (cumulative / total) * 360;
    return { ...d, startAngle, endAngle, color: colors[i % colors.length] };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const [x1, y1] = polarToCartesian(50, 50, 40, seg.startAngle);
            const [x2, y2] = polarToCartesian(50, 50, 40, seg.endAngle);
            const largeArc = seg.endAngle - seg.startAngle > 180 ? 1 : 0;
            return (
              <path
                key={i}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={seg.color}
                opacity={0.8}
              >
                <title>{seg.name}: {seg.count} ({seg.percentage}%)</title>
              </path>
            );
          })}
          <circle cx="50" cy="50" r="25" fill="#030f10" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={seg.name} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-400 capitalize">{seg.name}</span>
            <span className="text-white font-medium ml-auto">{seg.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// ─── Top Items Table ───────────────────────────────────────

function TopItemsTable({
  items,
  labelKey,
  countKey,
  linkPrefix,
}: {
  items: any[];
  labelKey: string;
  countKey: string;
  linkPrefix?: string;
}) {
  if (items.length === 0) {
    return <div className="text-center py-6 text-gray-500 text-sm">No data available</div>;
  }

  return (
    <div className="space-y-1">
      {items.slice(0, 8).map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#051a1b] transition-colors"
        >
          <div className="flex items-center gap-3 truncate">
            <span className="text-[10px] text-gray-600 font-mono w-4">{i + 1}.</span>
            <span className="text-sm text-gray-300 truncate">
              {item[labelKey] || item.url || item.productName || 'Unknown'}
            </span>
          </div>
          <span className="text-xs text-white font-medium ml-2 shrink-0">{item[countKey] || item.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Date Filter Dropdown ──────────────────────────────────

function DateFilterSelect({
  value,
  onChange,
}: {
  value: AnalyticsDateFilter;
  onChange: (v: AnalyticsDateFilter) => void;
}) {
  const [open, setOpen] = useState(false);

  const current = DATE_FILTERS.find(f => f.value === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span>{current?.label || 'Select'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-[#0b2a2b] border border-[#1f3334] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
            {DATE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { onChange(f.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === f.value
                    ? 'bg-[#d7ffa4]/10 text-[#d7ffa4]'
                    : 'text-gray-400 hover:text-white hover:bg-[#051a1b]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Dashboard Component ──────────────────────────────

export default function AnalyticsDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyTraffic, setDailyTraffic] = useState<DailyTrafficPoint[]>([]);
  const [monthlyTraffic, setMonthlyTraffic] = useState<MonthlyTrafficPoint[]>([]);
  const [yearlyTraffic, setYearlyTraffic] = useState<YearlyTrafficPoint[]>([]);
  const [deviceDistribution, setDeviceDistribution] = useState<DeviceDistribution[]>([]);
  const [topPages, setTopPages] = useState<{ url: string; count: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ productId: string; productName: string; count: number }[]>([]);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<AnalyticsDateFilter>('last-7-days');

  // ─── Load data ───────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Strategy: Try Admin API first (server-side, works on Vercel)
      // Fallback to client SDK if API fails (works locally)
      const apiData = await fetchDashboardDataViaAPI(dateFilter);

      if (apiData && apiData.summary) {
        // API succeeded — use server-side data
        setSummary(apiData.summary);
        setDailyTraffic(apiData.dailyTraffic);
        setMonthlyTraffic(apiData.monthlyTraffic);
        setYearlyTraffic(apiData.yearlyTraffic);
        setDeviceDistribution(apiData.deviceDistribution);
        setTopPages(apiData.topPages);
        setTopProducts(apiData.topProducts);
        setActiveVisitors(apiData.summary.activeVisitors);
      } else {
        // API failed — fallback to client SDK
        const range = getDateRange(dateFilter);
        const [
          summaryData,
          dailyData,
          monthlyData,
          yearlyData,
          deviceData,
          topPagesData,
          topProductsData,
          activeCount,
        ] = await Promise.all([
          getAnalyticsSummary(),
          getDailyTraffic(dateFilter === 'this-year' ? 365 : 30),
          getMonthlyTraffic(12),
          getYearlyTraffic(),
          getDeviceDistribution(range.startDate, range.endDate),
          getTopPages(10, range.startDate, range.endDate),
          getTopProducts(10, range.startDate, range.endDate),
          getActiveVisitorCount(),
        ]);

        setSummary(summaryData);
        setDailyTraffic(dailyData);
        setMonthlyTraffic(monthlyData);
        setYearlyTraffic(yearlyData);
        setDeviceDistribution(deviceData);
        setTopPages(topPagesData);
        setTopProducts(topProductsData);
        setActiveVisitors(activeCount);
      }
    } catch (error) {
      console.error('[Analytics Dashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Auto-refresh active visitors every 30s ─────────────

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await getActiveVisitorCount();
        setActiveVisitors(count);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Loading State ───────────────────────────────────────

  if (loading && !summary) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Website visitor analytics dashboard</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-28 animate-pulse bg-[#0b2a2b] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-64 animate-pulse bg-[#0b2a2b] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Website visitor analytics dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <DateFilterSelect value={dateFilter} onChange={setDateFilter} />
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Visitors"
          value={summary?.totalVisitors ?? 0}
          icon={Users}
          color="bg-[#d7ffa4]/20 text-[#d7ffa4]"
          delay={0}
        />
        <StatCard
          label="Currently Online"
          value={activeVisitors}
          icon={Activity}
          color="bg-green-500/20 text-green-400"
          delay={1}
        />
        <StatCard
          label="Today's Visitors"
          value={summary?.todayVisitors ?? 0}
          icon={BarChart3}
          color="bg-cyan-500/20 text-cyan-400"
          delay={2}
        />
        <StatCard
          label="Monthly Visitors"
          value={summary?.monthlyVisitors ?? 0}
          icon={TrendingUp}
          color="bg-purple-500/20 text-purple-400"
          delay={3}
        />
        <StatCard
          label="Returning Visitors"
          value={summary?.returningVisitors ?? 0}
          icon={RefreshCw}
          color="bg-orange-500/20 text-orange-400"
          delay={4}
        />
      </div>

      {/* ─── Charts Row 1 ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Traffic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
        >
          <h3 className="text-white font-semibold mb-4">Daily Traffic (30 days)</h3>
          <SimpleBarChart
            data={dailyTraffic.map(d => ({ label: formatDayLabel(d.date), value: d.visitors }))}
            color={COLORS.primary}
            height={150}
          />
        </motion.div>

        {/* Monthly Traffic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
        >
          <h3 className="text-white font-semibold mb-4">Monthly Traffic (12 months)</h3>
          <SimpleBarChart
            data={monthlyTraffic.map(d => ({ label: formatMonthLabel(d.month), value: d.visitors }))}
            color={COLORS.cyan}
            height={150}
          />
        </motion.div>
      </div>

      {/* ─── Charts Row 2 ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Yearly Traffic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
        >
          <h3 className="text-white font-semibold mb-4">Yearly Traffic</h3>
          <SimpleBarChart
            data={yearlyTraffic.map(d => ({ label: d.year, value: d.visitors }))}
            color={COLORS.purple}
            height={130}
          />
        </motion.div>

        {/* Device Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
        >
          <h3 className="text-white font-semibold mb-4">Device Distribution</h3>
          <DonutChart data={deviceDistribution} />
        </motion.div>

        {/* Traffic Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
        >
          <h3 className="text-white font-semibold mb-4">Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#1f3334]">
              <span className="text-gray-400 text-sm">Total Page Views</span>
              <span className="text-white font-medium">{(summary?.totalPageViews ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1f3334]">
              <span className="text-gray-400 text-sm">Product Views</span>
              <span className="text-white font-medium">{(summary?.totalProductViews ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1f3334]">
              <span className="text-gray-400 text-sm">Avg. Session</span>
              <span className="text-white font-medium">
                {summary?.avgSessionDuration ? `${Math.round(summary.avgSessionDuration / 60)} min` : '0 min'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400 text-sm">Return Rate</span>
              <span className="text-white font-medium">
                {summary && summary.totalVisitors > 0
                  ? `${Math.round((summary.returningVisitors / summary.totalVisitors) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Tables Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
        >
          <h3 className="text-white font-semibold mb-4">Top Visited Pages</h3>
          <TopItemsTable items={topPages} labelKey="url" countKey="count" />
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
        >
          <h3 className="text-white font-semibold mb-4">Top Viewed Products</h3>
          <TopItemsTable items={topProducts} labelKey="productName" countKey="count" />
        </motion.div>
      </div>

      {/* ─── Quick Links ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Visitor Sessions</h3>
          <Link
            href="/admin/analytics/visitor"
            className="text-sm text-[#d7ffa4] hover:underline flex items-center gap-1"
          >
            View Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-gray-500 text-sm">
          Browse detailed visitor sessions including device info, pages visited, and behavior patterns.
        </p>
      </motion.div>
    </div>
  );
}