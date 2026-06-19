'use client';

import { useEffect, useState } from 'react';
import {
  getSavedUrls, createSavedUrl, updateSavedUrl, deleteSavedUrl,
  type SavedUrl,
} from '@/lib/firebase/savedUrls';
import { Plus, Link as LinkIcon, Copy, Pencil, Trash2, X, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSavedUrlsPage() {
  const [urls, setUrls] = useState<SavedUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SavedUrl | null>(null);
  const [form, setForm] = useState({ title: '', url: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSavedUrls().then(d => { setUrls(d); setLoading(false); });
  }, []);

  const filtered = urls.filter(u =>
    !search || u.title.toLowerCase().includes(search.toLowerCase()) ||
    u.url.toLowerCase().includes(search.toLowerCase()) ||
    u.description.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ title: '', url: '', description: '' });
    setShowModal(true);
  }

  function openEdit(u: SavedUrl) {
    setEditing(u);
    setForm({ title: u.title, url: u.url, description: u.description });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateSavedUrl(editing.id, form);
        setUrls(prev => prev.map(u => u.id === editing.id ? { ...u, ...form, updatedAt: new Date().toISOString() } : u));
        toast.success('URL updated');
      } else {
        const id = await createSavedUrl(form);
        const now = new Date().toISOString();
        setUrls(prev => [{ id, title: form.title, url: form.url, description: form.description, createdAt: now, updatedAt: now }, ...prev]);
        toast.success('URL saved');
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved URL?')) return;
    try {
      await deleteSavedUrl(id);
      setUrls(prev => prev.filter(u => u.id !== id));
      toast.success('URL deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied successfully');
    } catch {
      toast.error('Failed to copy');
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#f0ebe0', fontFamily: 'Georgia, serif' }}>
            Saved URLs
          </h1>
          <p className="text-sm mt-1" style={{ color: '#5a7070' }}>
            Store frequently used URLs for quick access
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 border-2 rounded-xl font-semibold text-sm transition-all duration-100 active:translate-y-0.5"
          style={{ borderColor: '#c9a96e', color: '#c9a96e', backgroundColor: 'rgba(201,169,110,0.12)' }}
        >
          <Plus className="w-4 h-4" />
          Add URL
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#5a7070' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search URLs..."
          className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none transition-colors"
          style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
        />
      </div>

      {/* Table */}
      <div className="border rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.18)' }}>
        {loading ? (
          <div className="text-center py-12" style={{ color: '#5a7070' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#5a7070' }}>
            {search ? 'No URLs match your search' : 'No saved URLs yet. Click "Add URL" to create one.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase" style={{ borderColor: 'rgba(201,169,110,0.18)', color: '#5a7070' }}>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4 hidden md:table-cell">URL</th>
                  <th className="text-left p-4 hidden lg:table-cell">Description</th>
                  <th className="text-left p-4 hidden sm:table-cell">Created</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(url => (
                  <tr key={url.id} className="border-b" style={{ borderColor: 'rgba(201,169,110,0.08)' }}>
                    <td className="p-4 font-medium" style={{ color: '#f0ebe0' }}>{url.title}</td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-xs break-all" style={{ color: '#c9a96e' }}>{url.url}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell" style={{ color: '#5a7070' }}>
                      {url.description || '—'}
                    </td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: '#5a7070', fontSize: '11px' }}>
                      {new Date(url.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(url.url)}
                          className="p-2 rounded-lg transition-colors hover:bg-[rgba(201,169,110,0.12)]"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" style={{ color: '#c9a96e' }} />
                        </button>
                        <button
                          onClick={() => openEdit(url)}
                          className="p-2 rounded-lg transition-colors hover:bg-[rgba(74,222,128,0.12)]"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: '#9aada8' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(url.id)}
                          className="p-2 rounded-lg transition-colors hover:bg-[rgba(239,68,68,0.12)]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(3,15,16,0.8)' }}>
          <div className="w-full max-w-md border rounded-2xl p-6" style={{ backgroundColor: '#0a1a1b', borderColor: 'rgba(201,169,110,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: '#f0ebe0' }}>
                {editing ? 'Edit URL' : 'Add URL'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)]">
                <X className="w-5 h-5" style={{ color: '#5a7070' }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#9aada8' }}>Title</label>
                <input
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Homepage, Offers Page"
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-[#c9a96e] transition-colors"
                  style={{ backgroundColor: '#051a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#9aada8' }}>URL</label>
                <input
                  value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://domain.com/path"
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-[#c9a96e] transition-colors"
                  style={{ backgroundColor: '#051a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#9aada8' }}>Description (optional)</label>
                <textarea
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Why this URL is useful..."
                  rows={3}
                  className="w-full p-2.5 border rounded-lg text-sm outline-none focus:border-[#c9a96e] transition-colors resize-none"
                  style={{ backgroundColor: '#051a1b', borderColor: 'rgba(201,169,110,0.18)', color: '#f0ebe0' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors"
                style={{ borderColor: 'rgba(201,169,110,0.18)', color: '#9aada8' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: '#c9a96e', color: '#050d0e' }}
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}