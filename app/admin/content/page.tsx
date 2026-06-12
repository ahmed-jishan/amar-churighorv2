'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getFAQs, saveFAQ, updateFAQ, deleteFAQ,
  getReviews, saveReview, updateReview, deleteReview,
  getReviewAnimationConfig, saveReviewAnimationConfig,
} from '@/lib/firebase/content';
import { uploadImage } from '@/lib/cloudinary';
import { FaqItem, Review, ReviewAnimationConfig, DEFAULT_REVIEW_ANIMATION_CONFIG, REVIEW_ANIMATION_TYPES, REVIEW_ANIMATION_SPEEDS } from '@/types';
import { Plus, Pencil, Trash2, X, Star, Upload, Settings, Search, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

type AdminContentTab = 'reviews' | 'review-settings' | 'faqs';

export default function AdminContentPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminContentTab) || 'faqs';
  const [activeTab, setActiveTab] = useState<AdminContentTab>(initialTab);
  const [saving, setSaving] = useState(false);

  // ── FAQ State ──
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', isActive: true, sortOrder: 0 });
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const [showFaqForm, setShowFaqForm] = useState(false);

  // ── Review State ──
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({
    name: '', rating: 5, comment: '', avatar: '', designation: '', location: '', isActive: true, displayOrder: 0,
  });
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewReviewId, setPreviewReviewId] = useState<string | null>(null);

  // ── Review Animation Config State ──
  const [animConfig, setAnimConfig] = useState<ReviewAnimationConfig>(DEFAULT_REVIEW_ANIMATION_CONFIG);
  const [showCustomSpeed, setShowCustomSpeed] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [faqsData, reviewsData, animData] = await Promise.all([
        getFAQs(),
        getReviews(),
        getReviewAnimationConfig(),
      ]);
      setFaqs(faqsData);
      setReviews(reviewsData);
      setAnimConfig(animData);
      setShowCustomSpeed(animData.customSpeed !== undefined && animData.customSpeed !== REVIEW_ANIMATION_SPEEDS[animData.speed].value);
    } catch (e) {
      toast.error('Failed to load data');
      console.error(e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtered FAQs ──
  const filteredFaqs = faqs.filter(f =>
    !faqSearch ||
    f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // ══════════════════════════════════════════════
  // FAQ Handlers
  // ══════════════════════════════════════════════

  function openFaqForm(faq?: FaqItem) {
    if (faq) {
      setEditingFaq(faq.id);
      setFaqForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive, sortOrder: faq.sortOrder ?? 0 });
    } else {
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', isActive: true, sortOrder: faqs.length });
    }
    setShowFaqForm(true);
  }

  async function handleSaveFaq() {
    if (!faqForm.question || !faqForm.answer) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      if (editingFaq) {
        await updateFAQ(editingFaq, { question: faqForm.question, answer: faqForm.answer, isActive: faqForm.isActive, sortOrder: faqForm.sortOrder });
      } else {
        await saveFAQ({ question: faqForm.question, answer: faqForm.answer, isActive: faqForm.isActive, sortOrder: faqForm.sortOrder });
      }
      await loadData();
      setShowFaqForm(false);
      toast.success(editingFaq ? 'FAQ updated!' : 'FAQ saved!');
    } catch { toast.error('Error saving FAQ'); }
    setSaving(false);
  }

  async function handleDeleteFaq(id: string) {
    if (!confirm('Delete this FAQ?')) return;
    try { await deleteFAQ(id); setFaqs(prev => prev.filter(f => f.id !== id)); toast.success('FAQ deleted'); }
    catch { toast.error('Error deleting FAQ'); }
  }

  async function toggleFaqActive(faq: FaqItem) {
    try { await updateFAQ(faq.id, { isActive: !faq.isActive }); setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f)); }
    catch { toast.error('Error updating FAQ'); }
  }

  async function reorderFaq(id: string, direction: 'up' | 'down') {
    const idx = faqs.findIndex(f => f.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;
    const current = faqs[idx];
    const target = faqs[targetIdx];
    try {
      await updateFAQ(id, { sortOrder: target.sortOrder });
      await updateFAQ(target.id, { sortOrder: current.sortOrder });
      await loadData();
    } catch { toast.error('Error reordering'); }
  }

  // ══════════════════════════════════════════════
  // Review Handlers
  // ══════════════════════════════════════════════

  function openReviewForm(review?: Review) {
    if (review) {
      setEditingReview(review.id);
      setReviewForm({
        name: review.name, rating: review.rating, comment: review.comment,
        avatar: review.avatar || '', designation: review.designation || '',
        location: review.location || '', isActive: review.isActive, displayOrder: review.displayOrder ?? 0,
      });
    } else {
      setEditingReview(null);
      setReviewForm({ name: '', rating: 5, comment: '', avatar: '', designation: '', location: '', isActive: true, displayOrder: reviews.length });
    }
    setShowReviewForm(true);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setReviewForm(f => ({ ...f, avatar: url }));
      toast.success('Image uploaded to Cloudinary!');
    } catch { toast.error('Image upload failed'); }
    setUploadingAvatar(false);
  }

  async function handleSaveReview() {
    if (!reviewForm.name || !reviewForm.comment) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      const data = {
        name: reviewForm.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        avatar: reviewForm.avatar || '',
        designation: reviewForm.designation || '',
        location: reviewForm.location || '',
        isActive: reviewForm.isActive,
        displayOrder: reviewForm.displayOrder ?? 0,
      };
      if (editingReview) {
        await updateReview(editingReview, data);
      } else {
        await saveReview(data);
      }
      await loadData();
      setShowReviewForm(false);
      toast.success(editingReview ? 'Review updated!' : 'Review saved!');
    } catch { toast.error('Error saving review'); }
    setSaving(false);
  }

  async function handleDeleteReview(id: string) {
    if (!confirm('Delete this review?')) return;
    try { await deleteReview(id); setReviews(prev => prev.filter(r => r.id !== id)); toast.success('Review deleted'); }
    catch { toast.error('Error deleting review'); }
  }

  async function toggleReviewActive(review: Review) {
    try { await updateReview(review.id, { isActive: !review.isActive }); setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isActive: !r.isActive } : r)); }
    catch { toast.error('Error updating review'); }
  }

  async function reorderReview(id: string, direction: 'up' | 'down') {
    const idx = reviews.findIndex(r => r.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= reviews.length) return;
    const current = reviews[idx];
    const target = reviews[targetIdx];
    try {
      await updateReview(id, { displayOrder: target.displayOrder });
      await updateReview(target.id, { displayOrder: current.displayOrder });
      await loadData();
    } catch { toast.error('Error reordering'); }
  }

  // ══════════════════════════════════════════════
  // Animation Config Handler
  // ══════════════════════════════════════════════

  async function handleSaveAnimationConfig() {
    setSaving(true);
    try {
      const payload = { ...animConfig };
      if (!showCustomSpeed) {
        delete payload.customSpeed;
      }
      await saveReviewAnimationConfig(payload);
      toast.success('Review animation settings saved!');
    } catch { toast.error('Error saving settings'); }
    setSaving(false);
  }

  // ══════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Content Management</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'faqs' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'
          }`}>
          <Search className="w-4 h-4" /> FAQs
        </button>
        <button onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'reviews' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'
          }`}>
          <Star className="w-4 h-4" /> Customer Reviews
        </button>
        <button onClick={() => setActiveTab('review-settings')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'review-settings' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'
          }`}>
          <Settings className="w-4 h-4" /> Review Settings
        </button>
      </div>

      {/*** ================================ **/}
      {/*** FAQS TAB **/}
      {/*** ================================ **/}
      {activeTab === 'faqs' && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-[#1f3334]">
            <div>
              <h2 className="font-bold text-white">FAQ Items</h2>
              <p className="text-xs text-gray-500 mt-0.5">{faqs.length} total</p>
            </div>
            <NeoButton text="Add FAQ" icon={<Plus className="w-4 h-4" />} onClick={() => openFaqForm()}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm py-2 px-4" />
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-[#1f3334]/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input value={faqSearch} onChange={e => setFaqSearch(e.target.value)}
                placeholder="Search FAQs by question or answer..."
                className="w-full pl-9 pr-4 py-2 bg-[#051a1b] border border-[#1f3334] rounded-xl text-sm text-white outline-none focus:border-green-500" />
            </div>
          </div>

          {/* FAQ List */}
          <div className="divide-y divide-[#1f3334]/50">
            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                {faqSearch ? 'No FAQs match your search.' : 'No FAQs yet. Create your first FAQ!'}
              </div>
            )}
            {filteredFaqs.map((faq, i) => (
              <div key={faq.id} className="p-4 hover:bg-[#051a1b]/40 transition">
                <div className="flex items-start gap-4">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 pt-1">
                    <button onClick={() => reorderFaq(faq.id, 'up')} disabled={i === 0}
                      className={`text-xs ${i === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:text-white'} text-gray-500`}>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => reorderFaq(faq.id, 'down')} disabled={i >= filteredFaqs.length - 1}
                      className={`text-xs ${i >= filteredFaqs.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:text-white'} text-gray-500`}>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium text-sm truncate">{faq.question}</p>
                      <button onClick={() => toggleFaqActive(faq)}
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          faq.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-2">{faq.answer}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openFaqForm(faq)}
                      className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*** ================================ **/}
      {/*** REVIEWS TAB **/}
      {/*** ================================ **/}
      {activeTab === 'reviews' && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-[#1f3334]">
            <div>
              <h2 className="font-bold text-white">Customer Reviews</h2>
              <p className="text-xs text-gray-500 mt-0.5">{reviews.length} total</p>
            </div>
            <NeoButton text="Add Review" icon={<Plus className="w-4 h-4" />} onClick={() => openReviewForm()}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm py-2 px-4" />
          </div>

          {/* Review Cards Grid */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {reviews.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 text-sm">No reviews yet. Add your first review!</div>
            )}
            {reviews.map((review, i) => (
              <div key={review.id} className="bg-[#051a1b] rounded-xl border border-[#1f3334] p-4 hover:border-[#2a4a4b] transition">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {review.avatar ? (
                      <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover border border-[#1f3334]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#d7ffa4] flex items-center justify-center text-[#1a1a1a] font-bold text-sm">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium text-sm">{review.name}</p>
                      {review.location && <p className="text-gray-500 text-xs">{review.location}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPreviewReviewId(previewReviewId === review.id ? null : review.id)}
                      className={`p-1 rounded-lg transition ${previewReviewId === review.id ? 'bg-[#d7ffa4]/20 text-[#d7ffa4]' : 'hover:bg-[#1f3334] text-gray-400'}`}>
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openReviewForm(review)}
                      className="p-1 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteReview(review.id)}
                      className="p-1 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`w-3.5 h-3.5 ${si < review.rating ? 'fill-[#d7ffa4] text-[#d7ffa4]' : 'text-[#1f3334]'}`} />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">&ldquo;{review.comment}&rdquo;</p>

                {/* Designation */}
                {review.designation && <p className="text-gray-500 text-xs mt-1">{review.designation}</p>}

                {/* Order & Status */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1f3334]/50">
                  <span className="text-xs text-gray-500">Order: {review.displayOrder}</span>
                  <button onClick={() => toggleReviewActive(review)}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      review.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {review.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Reorder */}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => reorderReview(review.id, 'up')} disabled={i === 0}
                    className={`text-xs px-2 py-1 rounded-lg ${i === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[#1f3334]'} text-gray-500 transition`}>
                    ↑ Move Up
                  </button>
                  <button onClick={() => reorderReview(review.id, 'down')} disabled={i >= reviews.length - 1}
                    className={`text-xs px-2 py-1 rounded-lg ${i >= reviews.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[#1f3334]'} text-gray-500 transition`}>
                    ↓ Move Down
                  </button>
                </div>

                {/* Preview */}
                {previewReviewId === review.id && (
                  <div className="mt-3 pt-3 border-t border-[#d7ffa4]/30 bg-[#0b2a2b] rounded-lg p-3">
                    <p className="text-[10px] text-[#d7ffa4] uppercase mb-1">Preview</p>
                    <div className="bg-white dark:bg-[#122b2c] rounded-lg p-3 border border-[#1f3334]">
                      <div className="flex gap-2 items-center mb-1">
                        {review.avatar ? (
                          <img src={review.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#d7ffa4] flex items-center justify-center text-[10px] font-bold text-[#1a1a1a]">{review.name.charAt(0)}</div>
                        )}
                        <p className="font-semibold text-[11px] text-gray-800 dark:text-gray-200">{review.name}</p>
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={si} className={`w-2.5 h-2.5 ${si < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400">&ldquo;{review.comment}&rdquo;</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/*** ================================ **/}
      {/*** REVIEW SETTINGS TAB **/}
      {/*** ================================ **/}
      {activeTab === 'review-settings' && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6 max-w-2xl">
          <h2 className="font-bold text-white mb-5 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#d7ffa4]" /> Review Animation Settings
          </h2>

          <div className="space-y-6">
            {/* Enable Animation */}
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-white font-medium text-sm">Enable Animation</p>
                <p className="text-xs text-gray-500">When disabled, reviews show as static cards</p>
              </div>
              <button onClick={() => setAnimConfig(f => ({ ...f, enabled: !f.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-all ${animConfig.enabled ? 'bg-green-500' : 'bg-[#1f3334]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${animConfig.enabled ? 'translate-x-6' : ''}`} />
              </button>
            </label>

            {/* Animation Type */}
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Animation Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {REVIEW_ANIMATION_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setAnimConfig(f => ({ ...f, animationType: type.value }))}
                    className={`text-left p-3 rounded-xl border text-sm transition ${
                      animConfig.animationType === type.value
                        ? 'border-[#d7ffa4] bg-[#d7ffa4]/10 text-white'
                        : 'border-[#1f3334] bg-[#051a1b] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <p className="font-medium text-xs mb-0.5">{type.label}</p>
                    <p className="text-[10px] opacity-60">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Speed */}
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Animation Speed</label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {(Object.entries(REVIEW_ANIMATION_SPEEDS) as [keyof typeof REVIEW_ANIMATION_SPEEDS, typeof REVIEW_ANIMATION_SPEEDS[keyof typeof REVIEW_ANIMATION_SPEEDS]][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => { setAnimConfig(f => ({ ...f, speed: key })); setShowCustomSpeed(false); }}
                    className={`p-2 rounded-xl border text-xs text-center transition ${
                      animConfig.speed === key && !showCustomSpeed
                        ? 'border-[#d7ffa4] bg-[#d7ffa4]/10 text-white'
                        : 'border-[#1f3334] bg-[#051a1b] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <p className="font-medium">{val.label}</p>
                    <p className="text-[10px] opacity-60">{val.value}s</p>
                  </button>
                ))}
              </div>

              {/* Custom Speed */}
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer mb-2">
                <input type="checkbox" checked={showCustomSpeed} onChange={() => {
                  setShowCustomSpeed(!showCustomSpeed);
                  if (!showCustomSpeed) {
                    setAnimConfig(f => ({ ...f, customSpeed: REVIEW_ANIMATION_SPEEDS[f.speed].value }));
                  }
                }} className="accent-[#d7ffa4]" /> Custom Speed (seconds)
              </label>
              {showCustomSpeed && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    step={0.5}
                    value={animConfig.customSpeed || 5}
                    onChange={e => setAnimConfig(f => ({ ...f, customSpeed: Number(e.target.value) }))}
                    className="w-24 p-2 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white text-sm text-center outline-none focus:border-green-500"
                  />
                  <span className="text-gray-500 text-sm">seconds</span>
                </div>
              )}
            </div>

            {/* Direction */}
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Animation Direction</label>
              <div className="flex gap-2">
                {(['left', 'right'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setAnimConfig(f => ({ ...f, direction: dir }))}
                    className={`px-4 py-2 rounded-xl border text-sm capitalize transition ${
                      animConfig.direction === dir
                        ? 'border-[#d7ffa4] bg-[#d7ffa4]/10 text-white'
                        : 'border-[#1f3334] bg-[#051a1b] text-gray-400'
                    }`}
                  >
                    {dir === 'left' ? '← Left' : 'Right →'}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3">
              {([
                { key: 'pauseOnHover', label: 'Pause On Hover', desc: 'Pause animation when user hovers' },
                { key: 'autoPlay', label: 'Auto Play', desc: 'Automatically animate through reviews' },
                { key: 'loop', label: 'Loop Animation', desc: 'Continuously loop the animation' },
                { key: 'mobileOptimized', label: 'Mobile Optimization', desc: 'Optimize animation for mobile devices' },
                { key: 'desktopOptimized', label: 'Desktop Optimization', desc: 'Optimize animation for desktop' },
              ] as const).map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-white font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <button onClick={() => setAnimConfig(f => ({ ...f, [key]: !(f as any)[key] }))}
                    className={`relative w-12 h-6 rounded-full transition-all ${(animConfig as any)[key] ? 'bg-green-500' : 'bg-[#1f3334]'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(animConfig as any)[key] ? 'translate-x-6' : ''}`} />
                  </button>
                </label>
              ))}
            </div>

            <NeoButton text={saving ? 'Saving...' : 'Save Animation Settings'} onClick={handleSaveAnimationConfig} disabled={saving}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
          </div>
        </div>
      )}

      {/*** ================================ **/}
      {/*** FAQ FORM MODAL **/}
      {/*** ================================ **/}
      {showFaqForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-lg">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="font-bold text-white">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button onClick={() => setShowFaqForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Question *</label>
                <input value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Answer *</label>
                <textarea value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} rows={4}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Display Order</label>
                  <input type="number" min={0} value={faqForm.sortOrder} onChange={e => setFaqForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={faqForm.isActive} onChange={e => setFaqForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="accent-[#d7ffa4]" /> Active
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowFaqForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Save FAQ'} onClick={handleSaveFaq} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}

      {/*** ================================ **/}
      {/*** REVIEW FORM MODAL **/}
      {/*** ================================ **/}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334] sticky top-0 bg-[#051a1b] z-10">
              <h2 className="font-bold text-white">{editingReview ? 'Edit Review' : 'Add Review'}</h2>
              <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Customer Image Upload */}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Customer Image</label>
                {reviewForm.avatar ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border border-[#1f3334] mb-2">
                    <img src={reviewForm.avatar} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setReviewForm(f => ({ ...f, avatar: '' }))}
                      className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-[#1f3334] rounded-full cursor-pointer hover:border-green-500 transition mb-2">
                    {uploadingAvatar ? <span className="text-xs text-green-400 animate-pulse">Uploading...</span> : <Upload className="w-5 h-5 text-gray-500" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                )}
                <p className="text-[10px] text-gray-500">Upload to Cloudinary. Recommended: 200x200px</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Customer Name *</label>
                <input value={reviewForm.name} onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>

              {/* Designation & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Designation (optional)</label>
                  <input value={reviewForm.designation} onChange={e => setReviewForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. CEO, Company"
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Location (optional)</label>
                  <input value={reviewForm.location} onChange={e => setReviewForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Dhaka"
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Rating *</label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map(n => (
                    <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition"
                      style={{ borderColor: reviewForm.rating === n ? '#d7ffa4' : '#1f3334', background: reviewForm.rating === n ? 'rgba(215,255,164,0.1)' : '#051a1b' }}>
                      <Star className={`w-3.5 h-3.5 ${n <= reviewForm.rating ? 'fill-[#d7ffa4] text-[#d7ffa4]' : 'text-gray-500'}`} />
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Review Comment *</label>
                <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} rows={3}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Display Order</label>
                  <input type="number" min={0} value={reviewForm.displayOrder} onChange={e => setReviewForm(f => ({ ...f, displayOrder: Number(e.target.value) }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={reviewForm.isActive} onChange={e => setReviewForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="accent-[#d7ffa4]" /> Active
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowReviewForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : editingReview ? 'Update Review' : 'Save Review'} onClick={handleSaveReview} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}