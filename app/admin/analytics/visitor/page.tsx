'use client';

/**
 * Visitor Sessions Detail Page
 * 
 * Shows all visitor sessions with detailed information including:
 * - IP (masked), device type, browser, OS
 * - Pages visited per session
 * - Products viewed
 * - Session duration, entry, and exit pages
 * 
 * Admin-only access. Never exposes raw IP addresses.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Eye,
  ExternalLink,
  MapPin,
  Server,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { getRecentSessions, getPageViewsBySession, getProductViewsBySession } from '@/lib/analytics/service';
import type { VisitorSession, PageView, ProductView } from '@/lib/analytics/types';

// ─── Device Icon ────────────────────────────────────────────

function DeviceIcon({ deviceType }: { deviceType: string }) {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone className="w-4 h-4" />;
    case 'tablet':
      return <Tablet className="w-4 h-4" />;
    default:
      return <Monitor className="w-4 h-4" />;
  }
}

// ─── Session Duration Format ───────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'Active';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// ─── Session Card (collapsible) ────────────────────────────

function SessionCard({
  session,
  defaultOpen = false,
}: {
  session: VisitorSession;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [productViews, setProductViews] = useState<ProductView[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadDetail = useCallback(async () => {
    if (pageViews.length > 0 || loadingDetail) return;
    setLoadingDetail(true);
    try {
      const [pages, products] = await Promise.all([
        getPageViewsBySession(session.sessionId),
        getProductViewsBySession(session.sessionId),
      ]);
      setPageViews(pages);
      setProductViews(products);
    } catch (error) {
      console.error('[Session Detail] Error:', error);
    } finally {
      setLoadingDetail(false);
    }
  }, [session.sessionId, pageViews.length, loadingDetail]);

  const handleToggle = () => {
    if (!open) {
      loadDetail();
    }
    setOpen(!open);
  };

  const sessionDate = new Date(session.sessionStart).toLocaleString();
  const isActive = session.isActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden"
    >
      {/* Header (always visible) */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[#051a1b] transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Device icon */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            <DeviceIcon deviceType={session.deviceType} />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm truncate">
                {session.visitorId.slice(0, 12)}...
              </span>
              {isActive && (
                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Online</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{sessionDate}</span>
              <span>·</span>
              <span className="capitalize">{session.deviceType}</span>
              <span>·</span>
              <span className="capitalize">{session.browser}</span>
              {session.country && (
                <>
                  <span>·</span>
                  <span>{session.country}{session.city ? `, ${session.city}` : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400">{formatDuration(session.duration)}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Detail panel (collapsible) */}
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-[#1f3334]"
        >
          <div className="p-4 space-y-4">
            {/* Session Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">IP Address</p>
                <p className="text-sm text-gray-300 font-mono">{session.ip || 'N/A'}</p>
              </div>
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Device</p>
                <p className="text-sm text-gray-300 capitalize">{session.deviceType}</p>
              </div>
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Browser</p>
                <p className="text-sm text-gray-300 capitalize">{session.browser}</p>
              </div>
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">OS</p>
                <p className="text-sm text-gray-300 capitalize">{session.os}</p>
              </div>
              {session.country && (
                <div className="bg-[#051a1b] rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm text-gray-300">{session.country}{session.city ? `, ${session.city}` : ''}</p>
                </div>
              )}
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Visit Count</p>
                <p className="text-sm text-gray-300">{session.visitCount}</p>
              </div>
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Referral</p>
                <p className="text-sm text-gray-300 truncate">{session.referralSource || 'Direct'}</p>
              </div>
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Duration</p>
                <p className="text-sm text-gray-300">{formatDuration(session.duration)}</p>
              </div>
            </div>

            {/* Landing & Exit Pages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Landing Page</p>
                <p className="text-sm text-gray-300 truncate">{session.landingPage}</p>
              </div>
              <div className="bg-[#051a1b] rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Exit Page</p>
                <p className="text-sm text-gray-300 truncate">{session.exitPage || 'N/A'}</p>
              </div>
            </div>

            {/* Pages Visited */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-[#d7ffa4]" />
                <h4 className="text-sm font-medium text-white">Pages Visited ({pageViews.length})</h4>
              </div>
              {loadingDetail ? (
                <div className="animate-pulse space-y-2">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-8 bg-[#051a1b] rounded-lg" />
                  ))}
                </div>
              ) : pageViews.length > 0 ? (
                <div className="space-y-1">
                  {pageViews.map((pv, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#051a1b] text-sm"
                    >
                      <span className="text-gray-300 truncate">{pv.pageUrl}</span>
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                        {new Date(pv.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No page views recorded</p>
              )}
            </div>

            {/* Products Viewed */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-white">Products Viewed ({productViews.length})</h4>
              </div>
              {loadingDetail ? (
                <div className="animate-pulse space-y-2">
                  {Array(2).fill(0).map((_, i) => (
                    <div key={i} className="h-8 bg-[#051a1b] rounded-lg" />
                  ))}
                </div>
              ) : productViews.length > 0 ? (
                <div className="space-y-1">
                  {productViews.map((pv, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#051a1b] text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-gray-300 truncate">{pv.productName}</span>
                        {pv.productSlug && (
                          <Link
                            href={`/products/${pv.productSlug}`}
                            target="_blank"
                            className="text-[#d7ffa4] hover:underline shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                        {new Date(pv.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No products viewed</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function VisitorSessionsPage() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecentSessions(100);
      setSessions(data);
    } catch (error) {
      console.error('[Visitor Sessions] Error loading:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auto-refresh sessions every 60s
  useEffect(() => {
    const interval = setInterval(loadSessions, 60000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  // Filter sessions by visitorId
  const filteredSessions = searchTerm
    ? sessions.filter(s =>
        s.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.ip && s.ip.includes(searchTerm))
      )
    : sessions;

  const activeSessions = sessions.filter(s => s.isActive);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/analytics"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Visitor Sessions</h1>
            <p className="text-gray-500 text-sm mt-1">
              {sessions.length} total sessions · {activeSessions.length} currently active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search visitor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-gray-300 placeholder-gray-500 outline-none focus:border-[#d7ffa4]/30 transition-colors"
            />
          </div>
          <button
            onClick={loadSessions}
            className="flex items-center gap-2 px-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Active Sessions Summary */}
      {activeSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0b2a2b] rounded-2xl border border-green-500/20 p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">Currently Online ({activeSessions.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSessions.slice(0, 10).map(s => (
              <span
                key={s.sessionId}
                className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-lg capitalize"
              >
                {s.deviceType} · {s.browser}
              </span>
            ))}
            {activeSessions.length > 10 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{activeSessions.length - 10} more
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-3">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-[#0b2a2b] rounded-2xl" />
          ))}
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-2">
          {filteredSessions.map((session, i) => (
            <SessionCard
              key={session.sessionId + session.sessionStart}
              session={session}
              defaultOpen={i === 0 && activeSessions.length > 0} // Open first if active
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No visitor sessions found</p>
          <p className="text-gray-600 text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'Sessions will appear once visitors start browsing'}
          </p>
        </div>
      )}
    </div>
  );
}