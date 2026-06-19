'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  toggleCampaignActive, uploadCampaignImage,
} from '@/lib/firebase/campaigns';
import { useAdmin } from '@/context/AdminContext';
import type { OfferCampaign, CampaignFormData, CampaignType, DiscountType } from '@/types/campaign';
import { computeCampaignFields, CAMPAIGN_TYPE_LABELS, TYPE_COLORS } from '@/types/campaign';
import { Plus, Pencil, Trash2, X, Search, Eye, EyeOff, Upload, Loader2, Tag, Megaphone, Clock, Calendar, Globe, Zap, Gift, Sparkles, Star, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ── Constants ──────────────────────────────────────────────────

const TYPE_OPTIONS: { value: CampaignType; label: string; icon: React.ReactNode }[] = [
  { value: 'flash_sale', label: 'Flash Sale', icon: <Zap className="w-4 h-4" /> },
  { value: 'first_order', label: 'First Order', icon: <Gift className="w-4 h-4" /> },
  { value: 'combo', label: 'Combo', icon: <Tag className="w-4 h-4" /> },
  { value: 'loyalty', label: 'Loyalty', icon: <Award className="w-4 h-4" /> },
  { value: 'festival', label: 'Festival', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'custom', label: 'Custom', icon: <Star className="w-4 h-4" /> },
];

const CATEGORIES = ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Churi', 'Gift Sets'];

const EMPTY_FORM: CampaignFormData = {
  title: '',
  description: '',
  type: 'flash_sale',
  discountType: 'percentage',
  discountValue: 10,
  image: undefined,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: undefined,
  isActive: true,
  priority: 50,
  targetCategories: [],
  usageLimit: null,
  minOrderAmount: null,
  comboMinQty: null,
  loyaltyMinOrders: null,
  couponCode: undefined,
  expiresAfterDays: undefined,
  rewardLabel: undefined,
  firstOrderOnly: false,
};

type SortKey = 'priority-desc' | 'newest' | 'ending-soon' | 'most-used';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'priority-desc', label: 'Priority (High-Low)' },
  { key: 'newest', label: 'Newest First' },
  { key: 'ending-soon', label: 'Ending Soon' },
  { key: 'most-used', label: 'Most Used' },
];

// ── Status Helpers ─────────────────────────────────────────────

type StatusType = 'active' | 'inactive' | 'expired' | 'exhausted' | 'scheduled';

function getCampaignStatus(c: OfferCampaign & { computed?: ReturnType<typeof computeCampaignFields> }): StatusType {
  // Use raw Firestore dates, not computed fields, for admin status
  if (c.usageLimit !== null && (c.usageCount || 0) >= c.usageLimit) return 'exhausted';
  if (!c.isActive) return 'inactive';
  if (new Date(c.startDate) > new Date()) return 'scheduled';
  // Check endDate raw — only show expired if endDate is past AND campaign was unscheduled (no upcoming start)
  if (c.endDate && new Date(c.endDate).getTime() < Date.now()) return 'expired';
  return 'active';
}

const STATUS_STYLES: Record<StatusType, string> = {
  active: 'text-green-400 bg-green-500/10 border-green-500/20',
  inactive: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  expired: 'text-red-400 bg-red-500/10 border-red-500/20',
  exhausted: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  scheduled: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const STATUS_LABELS: Record<StatusType, string> = {
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
  exhausted: 'Exhausted',
  scheduled: 'Scheduled',
};

// ── Main Page ──────────────────────────────────────────────────

export default function AdminCampaignsPage() {
  const { admin } = useAdmin();
  const [campaigns, setCampaigns] = useState<OfferCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('priority-desc');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OfferCampaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CampaignFormData>({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (err) {
      toast.error('Failed to load campaigns');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // ── Stats ──
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => getCampaignStatus(c) === 'active').length,
    expired: campaigns.filter(c => getCampaignStatus(c) === 'expired').length,
    totalUses: campaigns.reduce((sum, c) => sum + (c.usageCount || 0), 0),
  };

  // ── Filter & Sort ──
  const filtered = campaigns
    .filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'all' && getCampaignStatus(c) !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'ending-soon': {
          const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return aEnd - bEnd;
        }
        case 'most-used': return (b.usageCount || 0) - (a.usageCount || 0);
        default: return (b.priority || 0) - (a.priority || 0);
      }
    });

  // ── Form Validation ──
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    else if (form.description.length > 200) errors.description = 'Max 200 characters';
    if (!form.discountValue || form.discountValue <= 0) errors.discountValue = 'Value must be > 0';
    if (form.discountType === 'percentage' && form.discountValue > 100) errors.discountValue = 'Max 100%';
    if (!form.startDate) errors.startDate = 'Start date is required';
    if (form.type === 'combo' && (!form.comboMinQty || form.comboMinQty < 1)) errors.comboMinQty = 'Min items required for combo';
    if (form.type === 'loyalty' && (!form.loyaltyMinOrders || form.loyaltyMinOrders < 1)) errors.loyaltyMinOrders = 'Min orders required for loyalty';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM, startDate: new Date().toISOString().slice(0, 16) });
    setEditing(null);
    setFormErrors({});
    setDeleteConfirm(null);
  }

  function openEdit(campaign: OfferCampaign) {
    setEditing(campaign);
    setForm({
      title: campaign.title,
      description: campaign.description,
      type: campaign.type,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      image: campaign.image,
      startDate: campaign.startDate ? campaign.startDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: campaign.endDate ? campaign.endDate.slice(0, 16) : undefined,
      isActive: campaign.isActive,
      priority: campaign.priority,
      targetCategories: campaign.targetCategories || [],
      usageLimit: campaign.usageLimit,
      minOrderAmount: campaign.minOrderAmount,
      comboMinQty: campaign.comboMinQty,
      loyaltyMinOrders: campaign.loyaltyMinOrders,
      couponCode: campaign.couponCode,
      expiresAfterDays: campaign.expiresAfterDays,
      rewardLabel: campaign.rewardLabel,
      firstOrderOnly: campaign.firstOrderOnly,
    });
    setFormErrors({});
    setShowForm(true);
  }

  function handleCategoryToggle(cat: string) {
    setForm(f => {
      if (cat === 'All') {
        return { ...f, targetCategories: f.targetCategories.includes('All') ? [] : ['All'] };
      }
      let cats = f.targetCategories.filter(c => c !== 'All');
      if (cats.includes(cat)) {
        return { ...f, targetCategories: cats.filter(c => c !== cat) };
      }
      return { ...f, targetCategories: [...cats, cat] };
    });
  }

  async function handleImageUpload(file: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Image file only'); return; }
    setUploadingImage(true);
    try {
      const url = await uploadCampaignImage(file);
      setForm(f => ({ ...f, image: url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Image upload failed. Try again.');
    }
    setUploadingImage(false);
  }

  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCampaign(editing.id, form);
        toast.success('Campaign updated!');
      } else {
        await createCampaign(form, admin?.id || 'unknown');
        toast.success('Campaign created!');
      }
      setShowForm(false);
      resetForm();
      await loadCampaigns();
    } catch (e: any) {
      toast.error(e.message || 'Error saving campaign');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
      toast.success('Campaign deleted');
    } catch {
      toast.error('Error deleting campaign');
    }
  }

  async function handleToggle(campaign: OfferCampaign) {
    const newState = !campaign.isActive;
    // Optimistic update
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, isActive: newState } : c));
    try {
      await toggleCampaignActive(campaign.id, newState);
      toast.success(newState ? 'Campaign activated' : 'Campaign deactivated');
    } catch {
      // Revert on failure
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, isActive: !newState } : c));
      toast.error('Failed to toggle status');
    }
  }

  function formatDate(iso: string | undefined) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Render ──
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#f0ebe0]" style={{ fontFamily: 'Georgia, serif' }}>Offer Campaigns</h1>
          <p className="text-sm mt-1" style={{ color: '#5a7070' }}>Manage promotional campaigns</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-100
                     active:translate-y-0.5 hover:-translate-y-0.5"
          style={{ borderColor: '#c9a96e', color: '#c9a96e', backgroundColor: 'rgba(201,169,110,0.12)' }}>
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#f0ebe0' },
          { label: 'Active', value: stats.active, color: '#4ade80' },
          { label: 'Expired', value: stats.expired, color: '#ef4444' },
          { label: 'Total Uses', value: stats.totalUses, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}
            className="border rounded-xl p-3 md:p-4">
            <p className="text-xs uppercase tracking-wider" style={{ color: '#5a7070' }}>{s.label}</p>
            <p className="text-xl md:text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#5a7070' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title..."
            style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:border-[#c9a96e] transition-colors" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as CampaignType | 'all')}
          style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#9aada8' }}
          className="px-3 py-2 border rounded-xl text-sm outline-none focus:border-[#c9a96e]">
          <option value="all">All Types</option>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusType | 'all')}
          style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#9aada8' }}
          className="px-3 py-2 border rounded-xl text-sm outline-none focus:border-[#c9a96e]">
          <option value="all">All Status</option>
          {(['active', 'inactive', 'expired', 'exhausted', 'scheduled'] as StatusType[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
          style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#9aada8' }}
          className="px-3 py-2 border rounded-xl text-sm outline-none focus:border-[#c9a96e]">
          {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <span className="text-xs self-center whitespace-nowrap" style={{ color: '#5a7070' }}>{filtered.length} campaigns</span>
      </div>

      {/* Campaign Table */}
      <div style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}
        className="border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-admin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                <th className="text-left p-3 md:p-4 text-xs uppercase tracking-wider" style={{ color: '#5a7070' }}>Campaign</th>
                <th className="text-left p-3 md:p-4 text-xs uppercase tracking-wider" style={{ color: '#5a7070' }}>Discount</th>
                <th className="text-left p-3 md:p-4 text-xs uppercase tracking-wider" style={{ color: '#5a7070' }}>Status</th>
                <th className="text-left p-3 md:p-4 text-xs uppercase tracking-wider" style={{ color: '#5a7070' }}>Usage</th>
                <th className="text-left p-3 md:p-4 text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: '#5a7070' }}>Dates</th>
                <th className="text-left p-3 md:p-4 text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: '#5a7070' }}>Priority</th>
                <th className="text-right p-3 md:p-4 text-xs uppercase tracking-wider" style={{ color: '#5a7070' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(4).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="p-4">
                    <div className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(201,169,110,0.08)' }} />
                  </td>
                </tr>
              )) : filtered.map(campaign => {
                const status = getCampaignStatus(campaign);
                const computed = computeCampaignFields(campaign);
                return (
                  <motion.tr
                    key={campaign.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b transition-colors" style={{ borderColor: 'rgba(201,169,110,0.06)' }}
                  >
                    <td className="p-3 md:p-4">
                      <div className="flex items-center gap-3">
                        {/* Image thumbnail */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                          style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}>
                          {campaign.image ? (
                            <img src={campaign.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Megaphone className="w-4 h-4" style={{ color: '#5a7070' }} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium break-words leading-snug" style={{ color: '#f0ebe0', wordBreak: 'break-word' }}>{campaign.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span style={{ color: TYPE_COLORS[campaign.type], backgroundColor: `${TYPE_COLORS[campaign.type]}20` }}
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize">
                              {CAMPAIGN_TYPE_LABELS[campaign.type]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <span className="font-semibold" style={{ color: '#c9a96e' }}>{computed.discountLabel}</span>
                    </td>
                    <td className="p-3 md:p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="p-3 md:p-4">
                      <span style={{ color: '#9aada8' }}>
                        {campaign.usageCount || 0}
                        {campaign.usageLimit ? ` / ${campaign.usageLimit}` : ''}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 hidden md:table-cell">
                      <div className="text-xs" style={{ color: '#9aada8' }}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(campaign.startDate)}
                        </div>
                        {campaign.endDate && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(campaign.endDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 md:p-4 hidden md:table-cell">
                      <span className="text-sm" style={{ color: '#9aada8' }}>P{campaign.priority}</span>
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(campaign)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(201,169,110,0.12)]"
                          style={{ color: '#9aada8' }}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggle(campaign)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(201,169,110,0.12)]"
                          style={{ color: campaign.isActive ? '#9aada8' : '#f0ebe0' }}>
                          {campaign.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <div className="relative">
                          {deleteConfirm === campaign.id ? (
                            <div className="flex items-center gap-1 bg-red-500/10 rounded-lg p-1">
                              <span className="text-xs px-1" style={{ color: '#ef4444' }}>Confirm?</span>
                              <button onClick={() => handleDelete(campaign.id)}
                                className="px-2 py-1 rounded-md text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                                Yes
                              </button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded-md text-xs font-medium" style={{ color: '#9aada8', backgroundColor: 'rgba(201,169,110,0.12)' }}>
                                No
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(campaign.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                              style={{ color: '#5a7070' }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: '#5a7070' }}>
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No campaigns found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Create/Edit Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 md:pt-12 overflow-y-auto"
            style={{ backgroundColor: 'rgba(5,13,14,0.85)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl border rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b sticky top-0 z-10"
                style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.12)' }}>
                <h2 className="text-lg font-bold" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
                  {editing ? 'Edit Campaign' : 'Create Campaign'}
                </h2>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(201,169,110,0.12)]" style={{ color: '#5a7070' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh]">
                {/* ── Basic Info Section ── */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Basic Info</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Title *</label>
                      <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(prev => { const n = { ...prev }; delete n.title; return n; }); }}
                        placeholder="e.g. Summer Flash Sale"
                        style={{ backgroundColor: '#0f2223', borderColor: formErrors.title ? '#ef4444' : 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm transition-colors" />
                      {formErrors.title && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{formErrors.title}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Description *</label>
                      <textarea value={form.description} onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFormErrors(prev => { const n = { ...prev }; delete n.description; return n; }); }}
                        rows={2} maxLength={200} placeholder="Short description shown on card"
                        style={{ backgroundColor: '#0f2223', borderColor: formErrors.description ? '#ef4444' : 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm transition-colors resize-none" />
                      <div className="flex justify-between mt-1">
                        {formErrors.description ? <p className="text-xs" style={{ color: '#ef4444' }}>{formErrors.description}</p> : <span />}
                        <span className="text-xs" style={{ color: form.description.length > 180 ? '#ef4444' : '#5a7070' }}>{form.description.length}/200</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Campaign Type *</label>
                      <select value={form.type} onChange={e => {
                        const newType = e.target.value as CampaignType;
                        setForm(f => ({
                          ...f,
                          type: newType,
                          comboMinQty: newType === 'combo' ? 2 : null,
                          loyaltyMinOrders: newType === 'loyalty' ? 10 : null,
                          firstOrderOnly: newType === 'first_order' ? true : false,
                        }));
                      }}
                        style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm">
                        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Priority (1-100)</label>
                      <input type="number" min={1} max={100} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                        style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#9aada8' }}>
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                          className="rounded" style={{ accentColor: '#c9a96e' }} />
                        Active (visible to customers)
                      </label>
                    </div>
                  </div>
                </div>

                {/* ── Campaign Image Section ── */}
                <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Campaign Image (Optional)</h3>
                  <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-xl transition-colors"
                    style={{ borderColor: 'rgba(201,169,110,0.18)', backgroundColor: 'rgba(201,169,110,0.03)' }}>
                    {form.image ? (
                      <div className="relative w-full max-w-sm">
                        <img src={form.image} alt="Campaign preview" className="w-full h-40 object-cover rounded-lg" />
                        <button onClick={() => setForm(f => ({ ...f, image: undefined }))}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}>
                          {uploadingImage ? (
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#c9a96e' }} />
                          ) : (
                            <Upload className="w-6 h-6" style={{ color: '#c9a96e' }} />
                          )}
                        </div>
                        <div className="text-center">
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}
                            className="text-sm font-medium underline underline-offset-2 hover:no-underline transition-colors"
                            style={{ color: '#c9a96e' }}>
                            {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                          </button>
                          <p className="text-xs mt-1" style={{ color: '#5a7070' }}>Recommended: 800×400px, JPG/PNG, max 2MB</p>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                      </>
                    )}
                  </div>
                </div>

                {/* ── Discount Settings ── */}
                <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Discount Settings</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Discount Type</label>
                      <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as DiscountType }))}
                        style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm">
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (৳)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>
                        Discount Value {form.discountType === 'percentage' ? '(%)' : '(৳)'} *
                      </label>
                      <input type="number" min={1} max={form.discountType === 'percentage' ? 100 : undefined}
                        value={form.discountValue || ''} onChange={e => { setForm(f => ({ ...f, discountValue: Number(e.target.value) })); setFormErrors(prev => { const n = { ...prev }; delete n.discountValue; return n; }); }}
                        style={{ backgroundColor: '#0f2223', borderColor: formErrors.discountValue ? '#ef4444' : 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" />
                      {formErrors.discountValue && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{formErrors.discountValue}</p>}
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Min Order Amount (৳, optional)</label>
                      <input type="number" min={0} value={form.minOrderAmount || ''} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="Leave blank = no minimum"
                        style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" />
                    </div>
                  </div>
                </div>

                {/* ── Schedule ── */}
                <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Schedule</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Start Date *</label>
                      <input type="datetime-local" value={form.startDate.slice(0, 16) || ''}
                        onChange={e => { setForm(f => ({ ...f, startDate: e.target.value })); setFormErrors(prev => { const n = { ...prev }; delete n.startDate; return n; }); }}
                        style={{ backgroundColor: '#0f2223', borderColor: formErrors.startDate ? '#ef4444' : 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" />
                      {formErrors.startDate && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{formErrors.startDate}</p>}
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>End Date <span className="font-normal">(optional — blank = no expiry)</span></label>
                      <input type="datetime-local" value={form.endDate ? form.endDate.slice(0, 16) : ''}
                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value || undefined }))}
                        style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" />
                    </div>
                  </div>
                  {/* Date preview */}
                  <div className="mt-3 p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(201,169,110,0.06)', color: '#9aada8' }}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    Active from {new Date(form.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {form.endDate ? ` to ${new Date(form.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ' (no expiry)'}
                  </div>
                </div>

                {/* ── Usage Limits ── */}
                <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Usage Limits</h3>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Usage Limit <span className="font-normal">(optional — blank = unlimited)</span></label>
                    <input type="number" min={1} value={form.usageLimit || ''} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : null }))}
                      style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                      className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm max-w-xs" />
                    {form.usageLimit && (
                      <p className="text-xs mt-1" style={{ color: '#9aada8' }}>
                        {form.usageLimit} use{form.usageLimit !== 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Targeting ── */}
                <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Targeting</h3>
                  <div>
                    <label className="block text-xs mb-2" style={{ color: '#9aada8' }}>Target Categories</label>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => {
                        setForm(f => ({ ...f, targetCategories: f.targetCategories.includes('All') ? [] : ['All'] }));
                      }}
                        style={{
                          backgroundColor: form.targetCategories.includes('All') ? '#c9a96e' : 'transparent',
                          color: form.targetCategories.includes('All') ? '#050d0e' : '#9aada8',
                          borderColor: form.targetCategories.includes('All') ? '#c9a96e' : 'rgba(201,169,110,0.18)',
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors">
                        All Categories
                      </button>
                      {CATEGORIES.filter(c => c !== 'All').map(cat => {
                        const selected = form.targetCategories.includes(cat) || form.targetCategories.includes('All');
                        return (
                          <button key={cat} onClick={() => handleCategoryToggle(cat)} disabled={form.targetCategories.includes('All')}
                            style={{
                              backgroundColor: selected ? '#c9a96e' : 'transparent',
                              color: selected ? '#050d0e' : '#9aada8',
                              borderColor: selected ? '#c9a96e' : 'rgba(201,169,110,0.18)',
                              opacity: form.targetCategories.includes('All') ? 0.5 : 1,
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:cursor-not-allowed">
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                    {form.targetCategories.length === 0 && (
                      <p className="text-xs mt-1" style={{ color: '#5a7070' }}>No categories selected — applies to all products</p>
                    )}
                  </div>
                </div>

                {/* ── Type-Specific Settings ── */}
                {form.type === 'combo' && (
                  <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Combo Settings</h3>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Minimum Items in Cart *</label>
                      <input type="number" min={1} value={form.comboMinQty || ''} onChange={e => { setForm(f => ({ ...f, comboMinQty: Number(e.target.value) })); setFormErrors(prev => { const n = { ...prev }; delete n.comboMinQty; return n; }); }}
                        style={{ backgroundColor: '#0f2223', borderColor: formErrors.comboMinQty ? '#ef4444' : 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                        className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm max-w-xs" placeholder="e.g. 3" />
                      {formErrors.comboMinQty && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{formErrors.comboMinQty}</p>}
                    </div>
                  </div>
                )}

                {form.type === 'loyalty' && (
                  <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>Loyalty Settings</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Minimum Completed Orders *</label>
                        <input type="number" min={1} value={form.loyaltyMinOrders || ''} onChange={e => { setForm(f => ({ ...f, loyaltyMinOrders: Number(e.target.value) })); setFormErrors(prev => { const n = { ...prev }; delete n.loyaltyMinOrders; return n; }); }}
                          style={{ backgroundColor: '#0f2223', borderColor: formErrors.loyaltyMinOrders ? '#ef4444' : 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                          className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" placeholder="e.g. 10" />
                        {formErrors.loyaltyMinOrders && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{formErrors.loyaltyMinOrders}</p>}
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Coupon Code *</label>
                        <div className="relative">
                          <input value={form.couponCode || ''} onChange={e => setForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))}
                            placeholder="e.g. VIP10"
                            style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                            className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm font-mono font-bold tracking-wider uppercase" />
                        </div>
                        <p className="text-[10px] mt-1" style={{ color: '#5a7070' }}>Customers enter this code at checkout</p>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Reward Validity (Days)</label>
                        <input type="number" min={1} value={form.expiresAfterDays || ''} onChange={e => setForm(f => ({ ...f, expiresAfterDays: e.target.value ? Number(e.target.value) : undefined }))}
                          placeholder="e.g. 30"
                          style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                          className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" />
                        <p className="text-[10px] mt-1" style={{ color: '#5a7070' }}>How many days the reward is valid after unlock</p>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#9aada8' }}>Reward Label</label>
                        <input value={form.rewardLabel || ''} onChange={e => setForm(f => ({ ...f, rewardLabel: e.target.value }))}
                          placeholder="e.g. VIP Customer Reward"
                          style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                          className="w-full p-3 border rounded-xl outline-none focus:border-[#c9a96e] text-sm" />
                        <p className="text-[10px] mt-1" style={{ color: '#5a7070' }}>Display label shown to customer (e.g. "VIP Customer Reward")</p>
                      </div>
                    </div>
                    {/* Summary */}
                    {form.couponCode && form.discountValue && (
                      <div className="mt-3 p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
                        <Award className="w-3 h-3 inline mr-1.5" />
                        Customers get <strong>{form.discountValue}{form.discountType === 'percentage' ? '%' : '৳'} OFF</strong> with code <strong className="font-mono">{form.couponCode}</strong>
                        {form.loyaltyMinOrders ? ` after ${form.loyaltyMinOrders} completed orders` : ''}
                        {form.expiresAfterDays ? ` (valid ${form.expiresAfterDays} days)` : ''}
                      </div>
                    )}
                  </div>
                )}

                {form.type === 'first_order' && (
                  <div className="border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                    <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: '#c9a96e' }}>First Order Settings</h3>
                    <div className="p-3 rounded-xl text-sm border" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.2)' }}>
                      <Globe className="w-4 h-4 inline mr-1.5" />
                      This campaign will only apply to first-time customers (auto-detected)
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'rgba(201,169,110,0.12)', backgroundColor: '#0f2223' }}>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-5 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-100
                             active:translate-y-0.5"
                  style={{ backgroundColor: 'transparent', color: '#9aada8', borderColor: 'rgba(201,169,110,0.18)' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || uploadingImage}
                  className="flex-1 px-5 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-100
                             active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#c9a96e', color: '#050d0e', borderColor: '#c9a96e' }}>
                  {saving ? 'Saving...' : editing ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}