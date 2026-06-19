'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import {
  getAnnouncementConfig,
  saveAnnouncementConfig,
  DEFAULT_CONFIG,
  type AnnouncementConfig,
  type AnimationStyle,
  type AnimationSpeed,
  type BarStyle,
  type CustomMessage,
} from '@/lib/firebase/announcements';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { computeCampaignFields, CAMPAIGN_TYPE_LABELS, TYPE_COLORS } from '@/types/campaign';
import type { OfferCampaign, CampaignType } from '@/types/campaign';
import {
  Save, Plus, Trash2, GripVertical, Eye, EyeOff, X, Check,
  Megaphone, Clock, ArrowRight, Zap, Gift, Package, Star, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Bar style visual options ───────────────────────────────────

interface BarStyleOption {
  value: BarStyle;
  label: string;
  darkColor: string;
  lightColor: string;
}

const BAR_STYLE_OPTIONS: BarStyleOption[] = [
  { value: 'flash_red', label: 'Flash Red', darkColor: '#1a0808', lightColor: '#fff1f1' },
  { value: 'gold', label: 'Gold Premium', darkColor: '#1a1508', lightColor: '#fdf9f0' },
  { value: 'dark', label: 'Dark Minimal', darkColor: '#0a1a1b', lightColor: '#1a1a1a' },
  { value: 'success_green', label: 'Success Green', darkColor: '#071a09', lightColor: '#f0fff4' },
];

// ── Animation style options ────────────────────────────────────

interface AnimationOption {
  value: AnimationStyle;
  icon: string;
  label: string;
  description: string;
}

const ANIMATION_OPTIONS: AnimationOption[] = [
  { value: 'marquee', icon: '➡', label: 'Marquee', description: 'Text scrolls continuously from right to left' },
  { value: 'fade', icon: '◎', label: 'Fade', description: 'Messages fade in and out smoothly' },
  { value: 'typewriter', icon: '|', label: 'Typewriter', description: 'Text types character by character' },
  { value: 'slide_up', icon: '↑', label: 'Slide Up', description: 'Messages slide up vertically' },
];

// ── Speed options ──────────────────────────────────────────────

const SPEED_OPTIONS: { value: AnimationSpeed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

// ── Mini Announcement Bar Preview ──────────────────────────────

function MiniBarPreview({ config }: { config: AnnouncementConfig }) {
  if (!config.isEnabled) {
    return (
      <div className="rounded-xl border-2 border-dashed p-6 text-center" style={{ borderColor: 'rgba(201,169,110,0.18)', color: '#5a7070' }}>
        <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Bar is disabled. Enable it above to see preview.</p>
      </div>
    );
  }

  const barColors = BAR_STYLE_OPTIONS.find(o => o.value === config.barStyle) || BAR_STYLE_OPTIONS[0];
  const animLabel = ANIMATION_OPTIONS.find(o => o.value === config.animationStyle)?.label || config.animationStyle;
  const speedLabel = SPEED_OPTIONS.find(o => o.value === config.animationSpeed)?.label || config.animationSpeed;
  const msgCount = config.mode === 'campaign'
    ? config.linkedCampaignIds.length
    : config.customMessages.filter(m => m.isActive).length;

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: 'rgba(201,169,110,0.18)' }}
    >
      {/* Simulated bar */}
      <div
        className="px-4 py-2.5 flex items-center gap-3 text-xs"
        style={{
          backgroundColor: barColors.darkColor,
          color: '#f0ebe0',
          borderBottom: '1px solid rgba(201,169,110,0.18)',
        }}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#ef4444' }} />
        <span className="flex-1 truncate">
          {msgCount > 0
            ? `${config.mode === 'campaign' ? 'Campaign' : 'Custom'} — ${msgCount} active message${msgCount !== 1 ? 's' : ''}`
            : 'No active messages'}
        </span>
        <span className="shrink-0 font-mono text-[10px]" style={{ opacity: 0.7 }}>
          {animLabel} · {speedLabel}
        </span>
      </div>
      {/* Info */}
      <div className="p-3 text-xs space-y-1" style={{ backgroundColor: '#0a1a1b', color: '#9aada8' }}>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: '#c9a96e' }}>Style:</span>
          <span className="capitalize">{config.barStyle.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: '#c9a96e' }}>Animation:</span>
          <span>{animLabel} ({speedLabel})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: '#c9a96e' }}>Mode:</span>
          <span className="capitalize">{config.mode}</span>
          <span className="ml-auto" style={{ color: config.dismissible ? '#4ade80' : '#ef4444' }}>
            Dismissible: {config.dismissible ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const { admin } = useAdmin();
  const [config, setConfig] = useState<AnnouncementConfig>({ ...DEFAULT_CONFIG });
  const [activeCampaigns, setActiveCampaigns] = useState<OfferCampaign[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Fetch config on mount only (no polling — avoid overwriting local edits) ──
  useEffect(() => {
    getAnnouncementConfig().then((cfg) => {
      setConfig(cfg);
    });
  }, []);

  // Fetch campaigns without any orderBy (avoids composite index requirement)
  // then filter + sort client-side
  useEffect(() => {
    getDocs(query(collection(db, 'campaigns'))).then((snap) => {
      const campaigns = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OfferCampaign));
      const computed = campaigns.map(computeCampaignFields);
      setActiveCampaigns(computed.filter((c) => c.isActive && !c.isExpired && !c.isExhausted));
    }).catch(() => {});
  }, []);

  // ── Helpers ──
  function updateConfig(partial: Partial<AnnouncementConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }));
    setDirty(true);
    setErrors({});
  }

  function updateCustomMessage(id: string, partial: Partial<CustomMessage>) {
    setConfig((prev) => ({
      ...prev,
      customMessages: prev.customMessages.map((m) =>
        m.id === id ? { ...m, ...partial } : m
      ),
    }));
    setDirty(true);
  }

  function addCustomMessage() {
    const newMsg: CustomMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: '',
      linkText: '',
      linkUrl: '',
      isActive: true,
    };
    setConfig((prev) => ({
      ...prev,
      customMessages: [...(prev.customMessages || []), newMsg],
    }));
    setDirty(true);
  }

  function deleteCustomMessage(id: string) {
    setConfig((prev) => ({
      ...prev,
      customMessages: prev.customMessages.filter((m) => m.id !== id),
    }));
    setDirty(true);
  }

  const toggleCampaignLink = useCallback((campaignId: string) => {
    setConfig((prev) => {
      const ids = prev.linkedCampaignIds || [];
      const exists = ids.includes(campaignId);
      return {
        ...prev,
        linkedCampaignIds: exists
          ? ids.filter((id) => id !== campaignId)
          : [...ids, campaignId],
      };
    });
    setDirty(true);
  }, []);

  // ── Validation ──
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (config.mode === 'campaign' && (!config.linkedCampaignIds || config.linkedCampaignIds.length === 0)) {
      newErrors.campaign = 'Select at least 1 campaign';
    }
    if (config.mode === 'custom') {
      const active = (config.customMessages || []).filter((m) => m.isActive);
      if (active.length === 0) {
        newErrors.custom = 'At least 1 active message is required';
      }
      const emptyText = (config.customMessages || []).some((m) => !m.text.trim());
      if (emptyText) {
        newErrors.customText = 'All messages must have text content';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Save ──
  async function handleSave() {
    if (!validate()) return;
    if (!admin?.id) {
      toast.error('Admin session required');
      return;
    }

    setSaving(true);
    try {
      await saveAnnouncementConfig(config, admin.id);
      setDirty(false);
      toast.success('Announcement bar updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
    setSaving(false);
  }

  // ── Select all / none for campaigns ──
  function selectAllCampaigns() {
    setConfig((prev) => ({
      ...prev,
      linkedCampaignIds: activeCampaigns.map((c) => c.id),
    }));
    setDirty(true);
  }

  function selectNoCampaigns() {
    setConfig((prev) => ({
      ...prev,
      linkedCampaignIds: [],
    }));
    setDirty(true);
  }

  // ── Render ──
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
            Announcement Bar
          </h1>
          <p className="text-sm mt-1" style={{ color: '#5a7070' }}>
            Manage the promotional banner shown above the navigation
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-100
                     active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: dirty ? '#c9a96e' : 'rgba(201,169,110,0.18)',
            color: dirty ? '#c9a96e' : '#5a7070',
            backgroundColor: dirty ? 'rgba(201,169,110,0.12)' : 'transparent',
          }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : dirty ? 'Save Settings' : 'Saved'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left + Middle columns: settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Section 1: Enable/Disable ── */}
          <div className="border rounded-2xl p-5" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: '#f0ebe0' }}>Announcement Bar</h3>
                <p className="text-xs mt-0.5" style={{ color: '#5a7070' }}>Show promotional banner above the navigation</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: config.isEnabled ? 'rgba(74,222,128,0.12)' : 'rgba(154,173,168,0.12)',
                    color: config.isEnabled ? '#4ade80' : '#9aada8',
                  }}
                >
                  {config.isEnabled ? 'Currently Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => updateConfig({ isEnabled: !config.isEnabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    config.isEnabled ? 'bg-[#4ade80]' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      config.isEnabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ── Section 2: Bar Style ── */}
          <div className="border rounded-2xl p-5" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f0ebe0' }}>Bar Style</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BAR_STYLE_OPTIONS.map((opt) => {
                const selected = config.barStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateConfig({ barStyle: opt.value })}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all p-3 ${
                      selected ? 'border-[#c9a96e]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: '#0f2223' }}
                  >
                    {/* Color strip */}
                    <div
                      className="h-8 rounded-lg mb-2"
                      style={{ backgroundColor: opt.darkColor }}
                    />
                    <span className="text-xs font-medium" style={{ color: selected ? '#c9a96e' : '#9aada8' }}>
                      {opt.label}
                    </span>
                    {selected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#c9a96e] flex items-center justify-center">
                        <Check className="w-3 h-3" style={{ color: '#050d0e' }} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section 3: Content Mode ── */}
          <div className="border rounded-2xl p-5" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f0ebe0' }}>Content Mode</h3>

            {/* Radio toggle */}
            <div className="flex gap-2 mb-5">
              {(['campaign', 'custom'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateConfig({ mode })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    config.mode === mode
                      ? 'bg-[#c9a96e] text-[#050d0e]'
                      : 'border text-[#9aada8]'
                  }`}
                  style={config.mode !== mode ? { borderColor: 'rgba(201,169,110,0.18)' } : {}}
                >
                  {mode === 'campaign' ? 'Campaign Linked' : 'Custom Message'}
                </button>
              ))}
            </div>

            {/* Campaign mode */}
            {config.mode === 'campaign' && (
              <div>
                <p className="text-xs mb-3" style={{ color: '#5a7070' }}>
                  Select campaigns to feature in the announcement bar
                </p>

                {/* Select all / none */}
                <div className="flex gap-2 mb-3">
                  <button onClick={selectAllCampaigns}
                    className="text-xs px-3 py-1 rounded-lg border transition-colors hover:bg-[rgba(201,169,110,0.1)]"
                    style={{ borderColor: 'rgba(201,169,110,0.18)', color: '#9aada8' }}>
                    Select All
                  </button>
                  <button onClick={selectNoCampaigns}
                    className="text-xs px-3 py-1 rounded-lg border transition-colors hover:bg-[rgba(201,169,110,0.1)]"
                    style={{ borderColor: 'rgba(201,169,110,0.18)', color: '#9aada8' }}>
                    Clear
                  </button>
                  <span className="text-xs self-center ml-auto" style={{ color: '#5a7070' }}>
                    {(config.linkedCampaignIds || []).length} selected
                  </span>
                </div>

                {activeCampaigns.length === 0 ? (
                  <div className="text-center py-8 rounded-xl" style={{ backgroundColor: '#0f2223' }}>
                    <Megaphone className="w-8 h-8 mx-auto mb-2" style={{ color: '#5a7070' }} />
                    <p className="text-sm" style={{ color: '#5a7070' }}>
                      No active campaigns. Create campaigns in the Campaigns section first.
                    </p>
                    <a
                      href="/admin/marketing/campaigns"
                      className="inline-flex items-center gap-1 mt-3 text-xs font-medium"
                      style={{ color: '#c9a96e' }}
                    >
                      Go to Campaigns →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {activeCampaigns.map((campaign: OfferCampaign) => {
                      const selected = (config.linkedCampaignIds || []).includes(campaign.id);
                      const isExpiringSoon = campaign.endDate && (new Date(campaign.endDate).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;
                      return (
                        <label
                          key={campaign.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                            selected ? 'bg-[rgba(201,169,110,0.1)]' : 'hover:bg-[rgba(255,255,255,0.03)]'
                          }`}
                          style={{ border: '1px solid', borderColor: selected ? 'rgba(201,169,110,0.25)' : 'transparent' }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleCampaignLink(campaign.id)}
                            className="rounded"
                            style={{ accentColor: '#c9a96e' }}
                          />
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
                        style={{ backgroundColor: `${TYPE_COLORS[campaign.type as CampaignType] || '#c9a96e'}20`, color: TYPE_COLORS[campaign.type as CampaignType] || '#c9a96e' }}
                      >
                        {campaign.type === 'flash_sale' ? '⚡' : campaign.type === 'first_order' ? '🎁' : campaign.type === 'combo' ? '📦' : campaign.type === 'loyalty' ? '⭐' : campaign.type === 'festival' ? '🌙' : '✦'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#f0ebe0' }}>{campaign.title}</p>
                          </div>
                          <span
                            className="text-xs font-semibold shrink-0"
                            style={{ fontFamily: 'Georgia, serif', color: TYPE_COLORS[campaign.type as CampaignType] || '#c9a96e' }}
                          >
                            {campaign.discountLabel}
                          </span>
                          {isExpiringSoon && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                              Expiring soon
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Campaign options */}
                <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
                  <label className="flex items-center justify-between text-sm cursor-pointer" style={{ color: '#9aada8' }}>
                    <span>Show discount percentage</span>
                    <input
                      type="checkbox"
                      checked={config.showCampaignDiscount}
                      onChange={(e) => updateConfig({ showCampaignDiscount: e.target.checked })}
                      className="rounded"
                      style={{ accentColor: '#c9a96e' }}
                    />
                  </label>
                  <label className="flex items-center justify-between text-sm cursor-pointer" style={{ color: '#9aada8' }}>
                    <span>Show countdown timer</span>
                    <input
                      type="checkbox"
                      checked={config.showCampaignTimer}
                      onChange={(e) => updateConfig({ showCampaignTimer: e.target.checked })}
                      className="rounded"
                      style={{ accentColor: '#c9a96e' }}
                    />
                  </label>
                </div>

                {errors.campaign && (
                  <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{errors.campaign}</p>
                )}
              </div>
            )}

            {/* Custom mode */}
            {config.mode === 'custom' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: '#5a7070' }}>
                    Messages shown in the announcement bar
                    {(config.customMessages || []).length > 1 && (
                      <span className="ml-2">— Multiple messages rotate using the selected animation style</span>
                    )}
                  </p>
                  <button
                    onClick={addCustomMessage}
                    disabled={(config.customMessages || []).length >= 5}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'rgba(201,169,110,0.12)', color: '#c9a96e' }}
                  >
                    <Plus className="w-3 h-3" />
                    Add Message
                  </button>
                </div>

                {(!config.customMessages || config.customMessages.length === 0) ? (
                  <div className="text-center py-8 rounded-xl" style={{ backgroundColor: '#0f2223' }}>
                    <p className="text-sm" style={{ color: '#5a7070' }}>No custom messages yet. Click "Add Message" to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {config.customMessages.map((msg, idx) => (
                      <div
                        key={msg.id}
                        className="p-3 rounded-xl border"
                        style={{ backgroundColor: '#0f2223', borderColor: 'rgba(201,169,110,0.12)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical className="w-4 h-4 shrink-0" style={{ color: '#5a7070' }} />
                          <span className="text-xs font-mono" style={{ color: '#5a7070' }}>#{idx + 1}</span>
                          <button
                            onClick={() => updateCustomMessage(msg.id, { isActive: !msg.isActive })}
                            className="p-1 rounded-md transition-colors hover:bg-[rgba(201,169,110,0.1)]"
                          >
                            {msg.isActive ? (
                              <Eye className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" style={{ color: '#5a7070' }} />
                            )}
                          </button>
                          <button
                            onClick={() => deleteCustomMessage(msg.id)}
                            className="p-1 rounded-md transition-colors hover:bg-red-500/10 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-3">
                            <input
                              value={msg.text}
                              onChange={(e) => updateCustomMessage(msg.id, { text: e.target.value })}
                              placeholder="Message text"
                              className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-[#c9a96e] transition-colors"
                              style={{
                                backgroundColor: '#0a1a1b',
                                borderColor: 'rgba(201,169,110,0.18)',
                                color: '#f0ebe0',
                              }}
                            />
                          </div>
                          <input
                            value={msg.linkText || ''}
                            onChange={(e) => updateCustomMessage(msg.id, { linkText: e.target.value || undefined })}
                            placeholder="Link text (e.g. Shop Now)"
                            className="p-2.5 border rounded-lg text-sm outline-none focus:border-[#c9a96e] transition-colors"
                            style={{
                              backgroundColor: '#0a1a1b',
                              borderColor: 'rgba(201,169,110,0.18)',
                              color: '#f0ebe0',
                            }}
                          />
                          <input
                            value={msg.linkUrl || ''}
                            onChange={(e) => updateCustomMessage(msg.id, { linkUrl: e.target.value || undefined })}
                            placeholder="Link URL (e.g. /products)"
                            className="p-2.5 border rounded-lg text-sm outline-none focus:border-[#c9a96e] transition-colors sm:col-span-2"
                            style={{
                              backgroundColor: '#0a1a1b',
                              borderColor: 'rgba(201,169,110,0.18)',
                              color: '#f0ebe0',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(errors.custom || errors.customText) && (
                  <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
                    {errors.custom || errors.customText}
                  </p>
                )}

                {(config.customMessages || []).length >= 5 && (
                  <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>Maximum 5 messages allowed</p>
                )}
              </div>
            )}
          </div>

          {/* ── Section 4: Animation Settings ── */}
          <div className="border rounded-2xl p-5" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f0ebe0' }}>Animation Settings</h3>

            {/* Style */}
            <label className="block text-xs mb-2" style={{ color: '#9aada8' }}>Animation Style</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {ANIMATION_OPTIONS.map((opt) => {
                const selected = config.animationStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateConfig({ animationStyle: opt.value })}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-[#c9a96e] bg-[rgba(201,169,110,0.08)]'
                        : 'border-[rgba(201,169,110,0.12)] hover:bg-[rgba(255,255,255,0.03)]'
                    }`}
                  >
                    <span className="text-lg shrink-0">{opt.icon}</span>
                    <div className="min-w-0">
                      <span className="block text-sm font-medium" style={{ color: selected ? '#c9a96e' : '#f0ebe0' }}>
                        {opt.label}
                      </span>
                      <span className="block text-[11px] mt-0.5" style={{ color: '#5a7070' }}>
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Speed */}
            <label className="block text-xs mb-2" style={{ color: '#9aada8' }}>Animation Speed</label>
            <div className="flex gap-2">
              {SPEED_OPTIONS.map((opt) => {
                const selected = config.animationSpeed === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateConfig({ animationSpeed: opt.value })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selected
                        ? 'bg-[#c9a96e] text-[#050d0e]'
                        : 'border text-[#9aada8]'
                    }`}
                    style={!selected ? { borderColor: 'rgba(201,169,110,0.18)' } : {}}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section 5: Options ── */}
          <div className="border rounded-2xl p-5" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f0ebe0' }}>Options</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between text-sm cursor-pointer" style={{ color: '#9aada8' }}>
                <div>
                  <span>Allow users to dismiss the bar</span>
                  <p className="text-xs mt-0.5" style={{ color: '#5a7070' }}>Dismissed bar returns the next day</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.dismissible}
                  onChange={(e) => updateConfig({ dismissible: e.target.checked })}
                  className="rounded"
                  style={{ accentColor: '#c9a96e' }}
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer" style={{ color: '#9aada8' }}>
                <div>
                  <span>Show countdown timer for expiring campaigns</span>
                  <p className="text-xs mt-0.5" style={{ color: '#5a7070' }}>Only relevant when mode = campaign</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.showTimer}
                  onChange={(e) => updateConfig({ showTimer: e.target.checked })}
                  className="rounded"
                  style={{ accentColor: '#c9a96e' }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right column: Preview + quick info */}
        <div className="space-y-6">
          {/* ── Section 6: Preview ── */}
          <div className="border rounded-2xl p-5 sticky top-4" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f0ebe0' }}>
              Live Preview
              <span className="text-[10px] font-normal ml-2" style={{ color: '#5a7070' }}>
                (updated in real-time)
              </span>
            </h3>
            <MiniBarPreview config={config} />

            {/* Quick stats */}
            <div className="mt-4 space-y-2 pt-4 border-t" style={{ borderColor: 'rgba(201,169,110,0.12)' }}>
              <div className="flex justify-between text-xs" style={{ color: '#9aada8' }}>
                <span>Status</span>
                <span style={{ color: config.isEnabled ? '#4ade80' : '#ef4444' }}>
                  {config.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: '#9aada8' }}>
                <span>Messages</span>
                <span>
                  {config.mode === 'campaign'
                    ? (config.linkedCampaignIds || []).length
                    : (config.customMessages || []).filter(m => m.isActive).length
                  }
                </span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: '#9aada8' }}>
                <span>Last updated</span>
                <span>
                  {config.updatedAt
                    ? new Date(config.updatedAt).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}