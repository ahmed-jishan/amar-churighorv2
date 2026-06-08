'use client';
import { useEffect, useState } from 'react';
import { getHeroSlides, saveHeroSlide, updateHeroSlide, deleteHeroSlide, getHeroConfig, saveHeroConfig } from '@/lib/firebase/content';
import { uploadImage } from '@/lib/cloudinary';
import { HeroSlide, HeroConfig, HeroTransition, DEFAULT_HERO_CONFIG } from '@/types';
import { Plus, Pencil, Trash2, X, Upload, Settings, Image as ImageIcon } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

const DEFAULT_SLIDE: Omit<HeroSlide, 'id' | 'createdAt'> = {
  title: '', subtitle: '', description: '',
  image: '', mobileImage: '', bgImage: '',
  buttonText: 'Shop Now', buttonLink: '/products',
  secondaryButtonText: '', secondaryButtonLink: '',
  badgeText: '', promoLabel: '', discountText: '',
  overlayOpacity: 50, textAlign: 'left', contentWidth: 'medium',
  bgPosition: 'center', bgFit: 'cover',
  transition: 'fade', sortOrder: 0, isActive: true,
  startDate: '', endDate: '',
  altText: '', metaTitle: '', metaDescription: '',
};

const TRANSITION_OPTIONS: { value: HeroTransition; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'zoom-out', label: 'Zoom Out' },
  { value: 'cross-fade', label: 'Cross Fade' },
];

const AUTOPLAY_SPEEDS = [
  { value: 3000, label: '3 Seconds' },
  { value: 5000, label: '5 Seconds' },
  { value: 7000, label: '7 Seconds' },
  { value: 10000, label: '10 Seconds' },
];

export default function AdminHeroPage() {
  const [activeTab, setActiveTab] = useState<'slides' | 'settings'>('slides');
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_SLIDE);
  const [uploadingFor, setUploadingFor] = useState<'image' | 'mobileImage' | 'bgImage' | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [slidesData, configData] = await Promise.all([
      getHeroSlides(),
      getHeroConfig(),
    ]);
    setSlides(slidesData);
    setConfig(configData);
    setLoading(false);
  }

  function resetForm() { setForm({ ...DEFAULT_SLIDE }); setEditing(null); }

  function openEdit(slide: HeroSlide) {
    setEditing(slide.id);
    setForm({
      title: slide.title, subtitle: slide.subtitle, description: slide.description || '',
      image: slide.image, mobileImage: slide.mobileImage || '', bgImage: slide.bgImage || '',
      buttonText: slide.buttonText, buttonLink: slide.buttonLink,
      secondaryButtonText: slide.secondaryButtonText || '', secondaryButtonLink: slide.secondaryButtonLink || '',
      badgeText: slide.badgeText || '', promoLabel: slide.promoLabel || '', discountText: slide.discountText || '',
      overlayOpacity: slide.overlayOpacity ?? 50, textAlign: slide.textAlign || 'left',
      contentWidth: slide.contentWidth || 'medium', bgPosition: slide.bgPosition || 'center',
      bgFit: slide.bgFit || 'cover', transition: slide.transition || 'fade',
      sortOrder: slide.sortOrder ?? 0, isActive: slide.isActive ?? true,
      startDate: slide.startDate || '', endDate: slide.endDate || '',
      altText: slide.altText || '', metaTitle: slide.metaTitle || '', metaDescription: slide.metaDescription || '',
    });
    setShowForm(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'mobileImage' | 'bgImage') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFor(field);
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, [field]: url }));
      toast.success('Image uploaded!');
    } catch {
      toast.error('Image upload failed');
    }
    setUploadingFor(null);
  }

  async function handleSave() {
    if (!form.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateHeroSlide(editing, form);
        toast.success('Hero slide updated!');
      } else {
        await saveHeroSlide({ ...form, createdAt: new Date().toISOString() });
        toast.success('Hero slide created!');
      }
      await loadData();
      setShowForm(false);
      resetForm();
    } catch { toast.error('Error saving hero slide'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this hero slide?')) return;
    try { await deleteHeroSlide(id); setSlides(prev => prev.filter(s => s.id !== id)); toast.success('Hero slide deleted'); }
    catch { toast.error('Error deleting'); }
  }

  async function toggleActive(slide: HeroSlide) {
    try {
      await updateHeroSlide(slide.id, { isActive: !slide.isActive });
      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, isActive: !s.isActive } : s));
    } catch { toast.error('Error updating'); }
  }

  async function handleSaveConfig() {
    setSaving(true);
    try {
      await saveHeroConfig(config);
      toast.success('Hero settings saved!');
      setSaving(false);
    } catch (e: any) {
      console.error('saveHeroConfig error:', e);
      toast.error(e?.message || 'Error saving settings. Check Firestore rules for hero_config collection.');
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Hero Section</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('slides')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'slides' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'}`}>
          <ImageIcon className="w-4 h-4" /> Slides
        </button>
        <button onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'settings' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'}`}>
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6 max-w-xl">
          <h2 className="font-bold text-white mb-5">Hero Global Settings</h2>
          <div className="space-y-5">
            {/* Hero Enable/Disable */}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-white font-medium text-sm">Hero Section Enabled</p>
                <p className="text-xs text-gray-500">When disabled, hero is hidden from user panel</p>
              </div>
              <button onClick={() => setConfig(f => ({ ...f, heroEnabled: !f.heroEnabled }))}
                className={`relative w-12 h-6 rounded-full transition-all ${config.heroEnabled ? 'bg-green-500' : 'bg-[#1f3334]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.heroEnabled ? 'translate-x-6' : ''}`} />
              </button>
            </label>

            {/* Autoplay */}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-white font-medium text-sm">Autoplay</p>
                <p className="text-xs text-gray-500">Automatically cycle through slides</p>
              </div>
              <button onClick={() => setConfig(f => ({ ...f, autoplay: !f.autoplay }))}
                className={`relative w-12 h-6 rounded-full transition-all ${config.autoplay ? 'bg-green-500' : 'bg-[#1f3334]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.autoplay ? 'translate-x-6' : ''}`} />
              </button>
            </label>

            {/* Autoplay Speed */}
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Slide Duration</label>
              <select value={config.autoplaySpeed} onChange={e => setConfig(f => ({ ...f, autoplaySpeed: Number(e.target.value) }))}
                className="w-full p-3 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                {AUTOPLAY_SPEEDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                <option value={4000}>4 Seconds</option>
                <option value={6000}>6 Seconds</option>
                <option value={8000}>8 Seconds</option>
              </select>
            </div>

            {/* Default Transition */}
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-1">Default Transition Effect</label>
              <select value={config.defaultTransition} onChange={e => setConfig(f => ({ ...f, defaultTransition: e.target.value as HeroTransition }))}
                className="w-full p-3 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                {TRANSITION_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Individual slides can override this</p>
            </div>

            <NeoButton text={saving ? 'Saving...' : 'Save Settings'} onClick={handleSaveConfig} disabled={saving}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
          </div>
        </div>
      )}

      {activeTab === 'slides' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Manage hero slides ({slides.length} total)</p>
            <NeoButton text="Add Slide" icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm" />
          </div>

          <div className="grid gap-3">
            {slides.length === 0 && (
              <div className="text-center py-16 text-gray-500 bg-[#0b2a2b] rounded-2xl border border-[#1f3334]">
                No hero slides yet. Create your first slide!
              </div>
            )}
            {slides.map((slide, index) => (
              <div key={slide.id} className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 pt-1">
                    <button onClick={async () => { try { await updateHeroSlide(slide.id, { sortOrder: (slide.sortOrder ?? 0) - 1 }); await loadData(); } catch {} }}
                      disabled={index === 0} className={`text-xs ${index === 0 ? 'opacity-20' : 'hover:text-white'} text-gray-500`}>▲</button>
                    <span className="text-xs text-gray-500 text-center">{slide.sortOrder}</span>
                    <button onClick={async () => { try { await updateHeroSlide(slide.id, { sortOrder: (slide.sortOrder ?? 0) + 1 }); await loadData(); } catch {} }}
                      disabled={index >= slides.length - 1} className={`text-xs ${index >= slides.length - 1 ? 'opacity-20' : 'hover:text-white'} text-gray-500`}>▼</button>
                  </div>
                  <div className="w-24 h-14 rounded-lg overflow-hidden bg-[#1f3334] flex-shrink-0">
                    {slide.image && <img src={slide.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate text-sm">{slide.title || 'Untitled'}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${slide.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {slide.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">{slide.subtitle || slide.description || slide.transition}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleActive(slide)}
                      className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-white transition text-xs">
                      {slide.isActive ? '🟢' : '🔴'}
                    </button>
                    <button onClick={() => openEdit(slide)}
                      className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(slide.id)}
                      className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hero Slide Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334] sticky top-0 bg-[#051a1b] z-10">
              <h2 className="font-bold text-white">{editing ? 'Edit Hero Slide' : 'Add Hero Slide'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Title & Subtitle */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Subtitle</label>
                  <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>

              {/* Images */}
              <div className="grid sm:grid-cols-3 gap-4">
                {(['image', 'mobileImage', 'bgImage'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs text-gray-500 uppercase mb-1">
                      {field === 'image' ? 'Hero Image *' : field === 'mobileImage' ? 'Mobile Image' : 'Background Image'}
                    </label>
                    {(form as any)[field] ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-[#1f3334]">
                        <img src={(form as any)[field]} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setForm(f => ({ ...f, [field]: '' }))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-24 flex items-center justify-center border-2 border-dashed border-[#1f3334] rounded-lg cursor-pointer hover:border-green-500 transition">
                        {uploadingFor === field ? <span className="text-xs text-green-400 animate-pulse">Uploading...</span> : <Upload className="w-5 h-5 text-gray-500" />}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, field)} />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Button Text</label>
                  <input value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Button URL</label>
                  <input value={form.buttonLink} onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Secondary Button Text</label>
                  <input value={form.secondaryButtonText} onChange={e => setForm(f => ({ ...f, secondaryButtonText: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Secondary Button URL</label>
                  <input value={form.secondaryButtonLink} onChange={e => setForm(f => ({ ...f, secondaryButtonLink: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
              </div>

              {/* Promotional */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Badge Text</label>
                  <input value={form.badgeText} onChange={e => setForm(f => ({ ...f, badgeText: e.target.value }))} placeholder="NEW"
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Promo Label</label>
                  <input value={form.promoLabel} onChange={e => setForm(f => ({ ...f, promoLabel: e.target.value }))} placeholder="Limited Offer"
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Discount Text</label>
                  <input value={form.discountText} onChange={e => setForm(f => ({ ...f, discountText: e.target.value }))} placeholder="Up to 30% off"
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
              </div>

              {/* Visual Settings */}
              <div className="border-t border-[#1f3334] pt-4">
                <p className="text-xs text-gray-500 uppercase mb-3 font-medium">Visual Settings</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Text Alignment</label>
                    <select value={form.textAlign} onChange={e => setForm(f => ({ ...f, textAlign: e.target.value as 'left' | 'center' | 'right' }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Content Width</label>
                    <select value={form.contentWidth} onChange={e => setForm(f => ({ ...f, contentWidth: e.target.value as 'narrow' | 'medium' | 'full' }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                      <option value="narrow">Narrow</option>
                      <option value="medium">Medium</option>
                      <option value="full">Full</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Overlay Opacity (0-100)</label>
                    <input type="number" min={0} max={100} value={form.overlayOpacity} onChange={e => setForm(f => ({ ...f, overlayOpacity: Number(e.target.value) }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Background Position</label>
                    <select value={form.bgPosition} onChange={e => setForm(f => ({ ...f, bgPosition: e.target.value as 'center' | 'top' | 'bottom' }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Background Fit</label>
                    <select value={form.bgFit} onChange={e => setForm(f => ({ ...f, bgFit: e.target.value as 'cover' | 'contain' }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-1">Sort Order</label>
                    <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                      className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="border-t border-[#1f3334] pt-4">
                <p className="text-xs text-gray-500 uppercase mb-3 font-medium">SEO</p>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Alt Text</label>
                  <input value={form.altText} onChange={e => setForm(f => ({ ...f, altText: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
              </div>

              {/* Status */}
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="accent-[#d7ffa4]" /> Active
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : editing ? 'Update Slide' : 'Create Slide'} onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}