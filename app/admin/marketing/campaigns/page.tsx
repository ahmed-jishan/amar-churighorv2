'use client';
import { useEffect, useState } from 'react';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from '@/lib/firebase/campaigns';
import { getProducts } from '@/lib/firebase/products';
import { getCategories } from '@/lib/firebase/categories';
import { Campaign, CampaignInput, CampaignType, DiscountType } from '@/lib/offers/campaignTypes';
import { getCampaignDiscountLabel, toCampaignCard, isCampaignExpired } from '@/lib/offers/campaignEngine';
import type { Product, ProductCategory } from '@/types';
import { Plus, Pencil, Trash2, X, Search, Megaphone, Flame, Gift, Tag, Award, Sparkles, Star } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

const CAMPAIGN_TYPE_OPTIONS: { value: CampaignType; label: string; icon: React.ReactNode }[] = [
  { value: 'flash_sale', label: 'Flash Sale', icon: <Flame className="w-4 h-4" /> },
  { value: 'first_customer', label: 'First Customer', icon: <Gift className="w-4 h-4" /> },
  { value: 'combo', label: 'Combo Offer', icon: <Tag className="w-4 h-4" /> },
  { value: 'loyalty_reward', label: 'Loyalty Reward', icon: <Award className="w-4 h-4" /> },
  { value: 'festival', label: 'Festival Campaign', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'custom', label: 'Custom Campaign', icon: <Star className="w-4 h-4" /> },
];

const TYPE_BADGE_STYLES: Record<string, string> = {
  flash_sale: 'bg-red-500/20 text-red-300',
  first_customer: 'bg-green-500/20 text-green-300',
  combo: 'bg-blue-500/20 text-blue-300',
  loyalty_reward: 'bg-purple-500/20 text-purple-300',
  festival: 'bg-amber-500/20 text-amber-300',
  custom: 'bg-cyan-500/20 text-cyan-300',
};

const DEFAULT_FORM: CampaignInput = {
  name: '',
  type: 'flash_sale',
  title: '',
  description: '',
  bannerImage: '',
  badgeText: '',
  startDate: new Date().toISOString().slice(0, 16),
  endDate: '',
  isActive: true,
  priority: 0,
  targetProductIds: [],
  targetCategoryNames: [],
  discountType: 'percentage',
  discountValue: 10,
  minQuantity: undefined,
  minCompletedOrders: undefined,
  isFirstOrderOnly: false,
  usageLimit: undefined,
  currentUsage: 0,
  comboLabel: '',
  themeColor: '',
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CampaignInput>({ ...DEFAULT_FORM });

  useEffect(() => {
    Promise.all([getCampaigns(), getProducts({ isActive: true }), getCategories()])
      .then(([c, p, cats]) => {
        setCampaigns(c);
        setProducts(p);
        setCategories(cats);
        setLoading(false);
      });
  }, []);

  const filtered = campaigns.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setForm({ ...DEFAULT_FORM, startDate: new Date().toISOString().slice(0, 16) });
    setEditing(null);
  }

  function openEdit(campaign: Campaign) {
    setEditing(campaign);
    setForm({
      name: campaign.name,
      type: campaign.type,
      title: campaign.title,
      description: campaign.description,
      bannerImage: campaign.bannerImage || '',
      badgeText: campaign.badgeText || '',
      startDate: campaign.startDate ? campaign.startDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: campaign.endDate ? campaign.endDate.slice(0, 16) : '',
      isActive: campaign.isActive,
      priority: campaign.priority,
      targetProductIds: campaign.targetProductIds || [],
      targetCategoryNames: campaign.targetCategoryNames || [],
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      minQuantity: campaign.minQuantity,
      minCompletedOrders: campaign.minCompletedOrders,
      isFirstOrderOnly: campaign.isFirstOrderOnly,
      usageLimit: campaign.usageLimit,
      currentUsage: campaign.currentUsage || 0,
      comboLabel: campaign.comboLabel || '',
      themeColor: campaign.themeColor || '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.title) { toast.error('Name & title required'); return; }
    setSaving(true);
    try {
      const payload: CampaignInput = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        discountValue: Number(form.discountValue),
        priority: Number(form.priority),
        minQuantity: form.minQuantity ? Number(form.minQuantity) : undefined,
        minCompletedOrders: form.minCompletedOrders ? Number(form.minCompletedOrders) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      };

      if (editing) {
        await updateCampaign(editing.id, payload);
        toast.success('Campaign updated!');
      } else {
        await createCampaign(payload);
        toast.success('Campaign created!');
      }

      const updated = await getCampaigns();
      setCampaigns(updated);
      setShowForm(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message ?? 'Error saving campaign');
    }
    setSaving(false);
  }

  async function handleDelete(campaign: Campaign) {
    if (!confirm(`Delete campaign "${campaign.name}"?`)) return;
    try {
      await deleteCampaign(campaign.id);
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      toast.success('Campaign deleted');
    } catch {
      toast.error('Error deleting campaign');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Offer Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage marketing promotions</p>
        </div>
        <NeoButton text="Create Campaign" icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm" />
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full pl-9 pr-4 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-white outline-none focus:border-green-500" />
        </div>
        <span className="text-sm text-gray-500 self-center">{filtered.length} campaigns</span>
      </div>

      {/* Campaigns Table */}
      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
        <div className="overflow-x-auto scrollbar-admin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                <th className="text-left p-4">Campaign</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Discount</th>
                <th className="text-left p-4">Priority</th>
                <th className="text-left p-4">Usage</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(3).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-4"><div className="h-4 animate-pulse bg-[#1f3334] rounded" /></td></tr>
              )) : filtered.map(campaign => {
                const card = toCampaignCard(campaign);
                const label = getCampaignDiscountLabel(card);
                const expired = isCampaignExpired(campaign);
                const statusLabel = expired ? 'Expired' : campaign.isActive ? 'Active' : 'Inactive';
                const statusColor = expired ? 'text-red-400' : campaign.isActive ? 'text-green-400' : 'text-gray-500';
                return (
                  <tr key={campaign.id} className="border-b border-[#1f3334]/40 hover:bg-[#051a1b] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1f3334] flex items-center justify-center">
                          <Megaphone className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <span className="text-white font-medium">{campaign.title}</span>
                          <p className="text-xs text-gray-500">{campaign.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE_STYLES[campaign.type] || 'bg-gray-500/20 text-gray-300'}`}>
                        {campaign.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                    </td>
                    <td className="p-4 text-green-400 font-semibold">{label}</td>
                    <td className="p-4 text-gray-300">P{campaign.priority}</td>
                    <td className="p-4 text-gray-400">
                      {campaign.currentUsage}{campaign.usageLimit ? ` / ${campaign.usageLimit}` : ''}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(campaign)} className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(campaign)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="text-center py-12 text-gray-500">No campaigns found</div>}
        </div>
      </div>

      {/* Campaign Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334] sticky top-0 bg-[#051a1b] z-10">
              <h2 className="font-bold text-white">{editing ? 'Edit Campaign' : 'Create Campaign'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Campaign Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="Internal name" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Campaign Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CampaignType }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                    {CAMPAIGN_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Campaign Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="Public title" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Badge Text</label>
                  <input value={form.badgeText} onChange={e => setForm(f => ({ ...f, badgeText: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="HOT / NEW / LIMITED" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 uppercase mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="Public description" />
                </div>
              </div>

              {/* Scheduling */}
              <div className="border-t border-[#1f3334] pt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Schedule & Status</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Start Date</label>
                    <input type="datetime-local" value={form.startDate.slice(0, 16)} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">End Date <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input type="datetime-local" value={form.endDate ? form.endDate.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                        className="accent-[#d7ffa4]" /> Active
                    </label>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Priority</label>
                      <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                        className="w-20 p-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount */}
              <div className="border-t border-[#1f3334] pt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Discount</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Discount Type</label>
                    <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as DiscountType }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Discount Value</label>
                    <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                  </div>
                </div>
              </div>

              {/* Conditional Fields */}
              {form.type === 'combo' && (
                <div className="border-t border-[#1f3334] pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Combo Settings</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Min Quantity</label>
                      <input type="number" value={form.minQuantity || ''} onChange={e => setForm(f => ({ ...f, minQuantity: Number(e.target.value) }))}
                        className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="e.g. 3" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Combo Label</label>
                      <input value={form.comboLabel || ''} onChange={e => setForm(f => ({ ...f, comboLabel: e.target.value }))}
                        className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="Buy 3 Get 10% OFF" />
                    </div>
                  </div>
                </div>
              )}

              {form.type === 'loyalty_reward' && (
                <div className="border-t border-[#1f3334] pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Loyalty Settings</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Min Completed Orders</label>
                      <input type="number" value={form.minCompletedOrders || ''} onChange={e => setForm(f => ({ ...f, minCompletedOrders: Number(e.target.value) }))}
                        className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="e.g. 10" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Coupon Code</label>
                      <input value={form.couponCode || ''} onChange={e => setForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))}
                        className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm font-mono font-bold" placeholder="e.g. VIP10" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Reward Validity (Days)</label>
                      <input type="number" value={form.expiresAfterDays || ''} onChange={e => setForm(f => ({ ...f, expiresAfterDays: Number(e.target.value) }))}
                        className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="e.g. 30" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Reward Label</label>
                      <input value={form.badgeText || ''} onChange={e => setForm(f => ({ ...f, badgeText: e.target.value }))}
                        className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" placeholder="e.g. VIP Customer Reward" />
                    </div>
                  </div>
                </div>
              )}

              {/* Targeting */}
              <div className="border-t border-[#1f3334] pt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Targeting</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Target Categories</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl min-h-[42px]">
                      {categories.filter(c => form.targetCategoryNames.includes(c.name)).length === 0 && (
                        <span className="text-xs text-gray-500 p-1">All categories eligible</span>
                      )}
                      {categories.filter(c => c.isActive).map(cat => {
                        const selected = form.targetCategoryNames.includes(cat.name);
                        return (
                          <button key={cat.id} onClick={() => setForm(f => ({
                            ...f,
                            targetCategoryNames: selected
                              ? f.targetCategoryNames.filter(n => n !== cat.name)
                              : [...f.targetCategoryNames, cat.name],
                          }))}
                            className={`text-xs px-2 py-1 rounded-full transition ${selected ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#1f3334] text-gray-400 hover:text-white'}`}>
                            {cat.icon}{cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Usage Limit <span className="text-gray-500 font-normal">(optional)</span></label>
                    <input type="number" value={form.usageLimit || ''} onChange={e => setForm(f => ({ ...f, usageLimit: Number(e.target.value) }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer mt-3">
                  <input type="checkbox" checked={form.isFirstOrderOnly} onChange={e => setForm(f => ({ ...f, isFirstOrderOnly: e.target.checked }))}
                    className="accent-[#d7ffa4]" /> First Order Only
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : editing ? 'Update Campaign' : 'Create Campaign'} onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}