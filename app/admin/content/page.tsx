'use client';
import { useEffect, useState } from 'react';
import { getFAQs, saveFAQ, updateFAQ, deleteFAQ, getReviews, saveReview, updateReview, deleteReview } from '@/lib/firebase/content';
import { FaqItem, Review } from '@/types';
import { Plus, Pencil, Trash2, X, Star } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'faqs' | 'reviews'>('faqs');

  // FAQ state
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [editingFaq, setEditingFaq] = useState<string | null>(null);
  const [showFaqForm, setShowFaqForm] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFAQs().then(setFaqs);
    getReviews().then(setReviews);
  }, []);

  // FAQ handlers
  async function handleSaveFaq() {
    if (!faqForm.question || !faqForm.answer) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      if (editingFaq) {
        await updateFAQ(editingFaq, faqForm);
      } else {
        await saveFAQ({ ...faqForm, isActive: true });
      }
      setFaqs(await getFAQs());
      setShowFaqForm(false);
      setFaqForm({ question: '', answer: '' });
      setEditingFaq(null);
      toast.success('FAQ saved!');
    } catch { toast.error('Error saving FAQ'); }
    setSaving(false);
  }

  async function handleDeleteFaq(id: string) {
    if (!confirm('Delete this FAQ?')) return;
    await deleteFAQ(id);
    setFaqs(prev => prev.filter(f => f.id !== id));
    toast.success('FAQ deleted');
  }

  // Review handlers
  async function handleSaveReview() {
    if (!reviewForm.name || !reviewForm.comment) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      if (editingReview) {
        await updateReview(editingReview, reviewForm);
      } else {
        await saveReview({ ...reviewForm, isActive: true, createdAt: new Date().toISOString() });
      }
      setReviews(await getReviews());
      setShowReviewForm(false);
      setReviewForm({ name: '', rating: 5, comment: '' });
      setEditingReview(null);
      toast.success('Review saved!');
    } catch { toast.error('Error saving review'); }
    setSaving(false);
  }

  async function handleDeleteReview(id: string) {
    if (!confirm('Delete this review?')) return;
    await deleteReview(id);
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success('Review deleted');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Content</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('faqs')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'faqs' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'}`}>
          FAQs
        </button>
        <button onClick={() => setActiveTab('reviews')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'reviews' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'}`}>
          Reviews
        </button>
      </div>

      {/* FAQs */}
      {activeTab === 'faqs' && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
            <h2 className="font-bold text-white">FAQ Items</h2>
            <NeoButton text="Add FAQ" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingFaq(null); setFaqForm({ question: '', answer: '' }); setShowFaqForm(true); }}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm py-2 px-4" />
          </div>
          <div className="divide-y divide-[#1f3334]/50">
            {faqs.map(faq => (
              <div key={faq.id} className="p-5 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium">{faq.question}</p>
                  <p className="text-gray-400 text-sm mt-1">{faq.answer}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditingFaq(faq.id); setFaqForm({ question: faq.question, answer: faq.answer }); setShowFaqForm(true); }}
                    className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {faqs.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">No FAQs yet</div>}
          </div>
        </div>
      )}

      {/* Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
            <h2 className="font-bold text-white">Customer Reviews</h2>
            <NeoButton text="Add Review" icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingReview(null); setReviewForm({ name: '', rating: 5, comment: '' }); setShowReviewForm(true); }}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm py-2 px-4" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 p-5">
            {reviews.map(r => (
              <div key={r.id} className="bg-[#051a1b] rounded-xl border border-[#1f3334] p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-medium">{r.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array(r.rating).fill(0).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-[#d7ffa4] text-[#d7ffa4]" />)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingReview(r.id); setReviewForm({ name: r.name, rating: r.rating, comment: r.comment }); setShowReviewForm(true); }}
                      className="p-1 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteReview(r.id)}
                      className="p-1 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">"{r.comment}"</p>
              </div>
            ))}
            {reviews.length === 0 && <div className="col-span-2 text-center py-10 text-gray-500 text-sm">No reviews yet</div>}
          </div>
        </div>
      )}

      {/* FAQ Form Modal */}
      {showFaqForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-lg">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="font-bold text-white">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button onClick={() => setShowFaqForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Question</label>
                <input value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Answer</label>
                <textarea value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} rows={3}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowFaqForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : 'Save'} onClick={handleSaveFaq} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-lg">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="font-bold text-white">{editingReview ? 'Edit Review' : 'Add Review'}</h2>
              <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Name</label>
                <input value={reviewForm.name} onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Rating</label>
                <select value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Comment</label>
                <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} rows={3}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowReviewForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : 'Save'} onClick={handleSaveReview} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}