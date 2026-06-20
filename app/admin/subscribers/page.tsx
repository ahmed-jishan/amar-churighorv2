'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import {
  getAllSubscribers, deleteSubscriber,
  toggleSubscriberActive, exportSubscribersAsCSV, Subscriber,
} from '@/lib/firebase/subscribers';
import {
  Search, Download, Mail, Trash2, ToggleLeft, X, Send, Loader2, Users,
  CheckCircle, AlertCircle, Eye, EyeOff, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

type FilterType = 'all' | 'active' | 'inactive' | 'discount_sent' | 'discount_not_sent';
type ModalMode = 'single' | 'selected' | 'all_active' | null;

// ── Helpers ──
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-BD', {
      day: 'numeric', month: 'short', year: 'numeric',
    } as Intl.DateTimeFormatOptions);
  } catch {
    return dateStr;
  }
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const ITEMS_PER_PAGE = 20;

export default function SubscribersPage() {
  const { user } = useAdmin();

  // ── State ──
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalSubject, setModalSubject] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalSending, setModalSending] = useState(false);
  const [modalPreview, setModalPreview] = useState(false);
  const [modalResult, setModalResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getAllSubscribers();
      setSubscribers(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = subscribers;
    if (filter === 'active') list = list.filter((s) => s.isActive);
    else if (filter === 'inactive') list = list.filter((s) => !s.isActive);
    else if (filter === 'discount_sent') list = list.filter((s) => s.discountSent);
    else if (filter === 'discount_not_sent') list = list.filter((s) => !s.discountSent);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.email.toLowerCase().includes(q));
    }
    return list;
  }, [subscribers, filter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [filter, search]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: subscribers.length,
    active: subscribers.filter((s) => s.isActive).length,
    inactive: subscribers.filter((s) => !s.isActive).length,
    thisMonth: subscribers.filter((s) => isThisMonth(s.subscribedAt)).length,
  }), [subscribers]);

  // ── Handlers ──
  const handleToggle = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await toggleSubscriberActive(id, !current);
      setSubscribers((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)));
      toast.success(current ? 'Unsubscribed' : 'Re-activated');
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success('Subscriber removed');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(paginated.map((s) => s.id)));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Export CSV ──
  const handleExport = () => {
    const csv = exportSubscribersAsCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const filterLabel = filter === 'all' ? 'all' : filter;
    a.download = `lumin-subscribers-${filterLabel}-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filtered.length} emails as CSV`);
  };

  // ── Send Email ──
  const handleSendEmail = async () => {
    if (!modalSubject.trim() || !modalMessage.trim()) return;
    setModalSending(true);
    setModalResult(null);

    let recipientEmails: string[];
    if (modalMode === 'single') {
      const sub = subscribers.find((s) => selected.has(s.id));
      recipientEmails = sub ? [sub.email] : [];
    } else if (modalMode === 'selected') {
      recipientEmails = subscribers.filter((s) => selected.has(s.id)).map((s) => s.email);
    } else {
      recipientEmails = subscribers.filter((s) => s.isActive).map((s) => s.email);
    }

    if (recipientEmails.length === 0) {
      setModalResult({ success: false, message: 'No recipients to send to.' });
      setModalSending(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: recipientEmails,
          subject: modalSubject.trim(),
          message: modalMessage.trim(),
          adminUid: user?.uid,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalResult({
          success: true,
          message: `✓ Email sent successfully to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}` +
            (data.failed > 0 ? ` (${data.failed} failed)` : ''),
        });
        toast.success('Email sent!');
        setTimeout(() => { closeModal(); }, 2500);
      } else {
        setModalResult({ success: false, message: data.error || 'Failed to send.' });
      }
    } catch {
      setModalResult({ success: false, message: 'Failed to send. Please try again.' });
    } finally {
      setModalSending(false);
    }
  };

  const openModal = (mode: ModalMode) => {
    setModalMode(mode);
    setModalSubject('');
    setModalMessage('');
    setModalPreview(false);
    setModalResult(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setModalSubject('');
    setModalMessage('');
    setModalSending(false);
    setModalPreview(false);
    setModalResult(null);
  };

  // ── Source badge ──
  const SourceBadge = ({ source }: { source: string }) => {
    let cls = 'text-[10px] px-1.5 py-0.5 rounded-full font-medium ';
    if (source === 'homepage') cls += 'bg-[rgba(215,255,164,0.1)] text-[#d7ffa4]';
    else if (source === 'footer') cls += 'bg-[rgba(96,165,250,0.1)] text-[#60a5fa]';
    else cls += 'bg-[rgba(255,255,255,0.05)] text-gray-400';
    return <span className={cls}>{source}</span>;
  };

  // ── All checked? ──
  const allSelected = paginated.length > 0 && paginated.every((s) => selected.has(s.id));

  // ── Determine modal recipients description ──
  const modalRecipientDesc = useMemo(() => {
    if (modalMode === 'single') {
      const sub = subscribers.find((s) => selected.has(s.id));
      return sub?.email || '';
    }
    if (modalMode === 'selected') {
      return `${selected.size} selected subscriber${selected.size !== 1 ? 's' : ''}`;
    }
    if (modalMode === 'all_active') {
      const count = subscribers.filter((s) => s.isActive).length;
      return `All active subscribers (${count})`;
    }
    return '';
  }, [modalMode, selected, subscribers]);

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Subscribers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your email subscriber list</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Subscribers', value: stats.total, icon: Users },
          { label: 'Active Subscribers', value: stats.active, icon: CheckCircle },
          { label: 'Unsubscribed', value: stats.inactive, icon: EyeOff },
          { label: 'This Month', value: stats.thisMonth, icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#0b2a2b] border border-[#1f3334] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-[#d7ffa4]" />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-400">Failed to load subscribers</p>
          </div>
          <button onClick={fetchData} className="text-sm text-red-400 hover:underline">Try again</button>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#0b2a2b] rounded-xl animate-pulse border border-[#1f3334]" />
          ))}
        </div>
      )}

      {/* ── Content (only when not loading and no error) ── */}
      {!loading && !error && (
        <>
          {/* ── Toolbar ── */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Left: Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email..."
                  className="w-full pl-9 pr-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#d7ffa4]/50 transition-colors"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="px-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-gray-300 outline-none focus:border-[#d7ffa4]/50"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Unsubscribed</option>
                <option value="discount_sent">Discount Sent</option>
                <option value="discount_not_sent">Discount Not Sent</option>
              </select>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {selected.size > 0 && (
                <>
                  <span className="text-xs text-gray-400 bg-[#0b2a2b] px-2.5 py-1 rounded-full border border-[#1f3334]">
                    {selected.size} selected
                  </span>
                  <button
                    onClick={() => openModal(selected.size === 1 ? 'single' : 'selected')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c9a96e] text-[#051a1b] hover:bg-[#d4b87a] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Email
                  </button>
                  <button
                    onClick={() => {
                      const ids = Array.from(selected);
                      if (ids.length === 1) {
                        setConfirmDeleteId(ids[0]);
                      } else {
                        Promise.all(ids.map((id) => deleteSubscriber(id))).then(() => {
                          setSubscribers((prev) => prev.filter((s) => !ids.includes(s.id)));
                          setSelected(new Set());
                          toast.success(`Removed ${ids.length} subscribers`);
                        }).catch(() => toast.error('Failed to delete'));
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected
                  </button>
                </>
              )}
              <button
                onClick={() => openModal('all_active')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0b2a2b] text-gray-300 border border-[#1f3334] hover:bg-[#1f3334] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Send to All Active
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0b2a2b] text-gray-300 border border-[#1f3334] hover:bg-[#1f3334] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export {filtered.length} emails
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-[#0b2a2b] border border-[#1f3334] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1f3334]">
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="accent-[#d7ffa4]"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Source</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Subscribed Date</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="p-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center">
                          {subscribers.length === 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <Users className="w-8 h-8 text-gray-500" />
                              <p className="text-gray-400 text-sm font-medium">No subscribers yet</p>
                              <p className="text-gray-500 text-xs">Subscribers will appear here when users sign up via your website.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 text-gray-500" />
                              <p className="text-gray-400 text-sm font-medium">No results for &lsquo;{search}&rsquo;</p>
                              <button
                                onClick={() => setSearch('')}
                                className="text-xs text-[#d7ffa4] hover:underline"
                              >
                                Clear search
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((sub) => (
                        <motion.tr
                          key={sub.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-[#1f3334] last:border-0 hover:bg-[#1f3334]/30 transition-colors"
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selected.has(sub.id)}
                              onChange={() => handleSelectOne(sub.id)}
                              className="accent-[#d7ffa4]"
                            />
                          </td>
                          <td className="p-3">
                            <p className="text-white font-mono text-xs">{sub.email}</p>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <SourceBadge source={sub.source} />
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <p className="text-gray-300 text-xs">{formatDate(sub.subscribedAt)}</p>
                            <p className="text-gray-500 text-[10px]">{relativeTime(sub.subscribedAt)}</p>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggle(sub.id, sub.isActive)}
                              disabled={togglingId === sub.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                                sub.isActive
                                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
                                  : 'bg-red-900/30 text-red-400 border border-red-900/50'
                              }`}
                            >
                              {togglingId === sub.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : null}
                              {sub.isActive ? 'Active' : 'Unsubscribed'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            {confirmDeleteId === sub.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-red-400">Delete?</span>
                                <button
                                  onClick={() => handleDelete(sub.id)}
                                  disabled={deletingId === sub.id}
                                  className="text-xs text-red-400 hover:text-red-300 font-medium"
                                >
                                  {deletingId === sub.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : 'Yes'}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs text-gray-400 hover:text-gray-300"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelected(new Set([sub.id]));
                                    openModal('single');
                                  }}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-[#d7ffa4] hover:bg-[#1f3334] transition-colors"
                                  title="Send email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleToggle(sub.id, sub.isActive)}
                                  disabled={togglingId === sub.id}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-[#1f3334] transition-colors"
                                  title={sub.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {togglingId === sub.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <ToggleLeft className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(sub.id)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-[#1f3334] transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} subscribers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#0b2a2b] border border-[#1f3334] text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1f3334] transition-colors"
                >
                  Prev
                </button>
                <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[#0b2a2b] border border-[#1f3334] text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1f3334] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Compose Email Modal ── */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#051a1b] border border-[#1f3334] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* ── Modal Header ── */}
              <div className="flex items-center justify-between p-5 border-b border-[#1f3334]">
                <h2 className="text-base font-semibold text-white">Compose Email</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ── Modal Body ── */}
              <div className="p-5 space-y-4">
                {/* To field */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">To</label>
                  <div className="px-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-lg text-sm text-gray-300">
                    {modalRecipientDesc}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Sending via SMTP</p>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalSubject}
                    onChange={(e) => setModalSubject(e.target.value.slice(0, 200))}
                    placeholder="Your exclusive offer from Lumin"
                    disabled={modalSending || !!modalResult}
                    className="w-full px-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#d7ffa4]/50 transition-colors disabled:opacity-50"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 text-right">{modalSubject.length}/200</p>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value.slice(0, 2000))}
                    rows={8}
                    placeholder="Write your message here..."
                    disabled={modalSending || !!modalResult}
                    className="w-full px-3 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#d7ffa4]/50 transition-colors resize-none disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-500">Plain text email. Links will be clickable.</p>
                    <p className="text-[10px] text-gray-500">{modalMessage.length}/2000</p>
                  </div>
                </div>

                {/* Preview toggle */}
                <button
                  onClick={() => setModalPreview(!modalPreview)}
                  disabled={modalSending || !!modalResult}
                  className="text-xs text-[#d7ffa4] hover:underline disabled:opacity-50"
                >
                  {modalPreview ? 'Hide Preview' : 'Preview Email'}
                </button>

                {modalPreview && (
                  <div className="bg-white rounded-lg p-4 text-xs text-[#1a1a1a] max-h-48 overflow-y-auto border">
                    <p className="font-bold text-[#c9a96e] text-sm mb-2">◈ LUMIN</p>
                    <p className="font-semibold mb-2">{modalSubject || '(No subject)'}</p>
                    {modalMessage.split('\n').filter(Boolean).map((line, i) => (
                      <p key={i} className="mb-1">{line}</p>
                    ))}
                    {!modalMessage && <p className="text-gray-400 italic">(No message)</p>}
                  </div>
                )}

                {/* Result */}
                {modalResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                    modalResult.success
                      ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/30'
                      : 'bg-red-900/20 text-red-400 border border-red-900/30'
                  }`}>
                    {modalResult.success ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    {modalResult.message}
                  </div>
                )}

                {/* Send button */}
                <button
                  onClick={handleSendEmail}
                  disabled={!modalSubject.trim() || !modalMessage.trim() || modalSending || !!modalResult}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#c9a96e] text-[#051a1b] hover:bg-[#d4b87a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : modalResult?.success ? (
                    'Sent ✓'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}