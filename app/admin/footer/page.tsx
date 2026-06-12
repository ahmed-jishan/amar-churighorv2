'use client';
import { useEffect, useState } from 'react';
import {
  getAllFooterSections,
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
  reorderFooterSections,
} from '@/lib/firebase/footer';
import { FooterSection, FooterLink } from '@/types';
import { Plus, Pencil, Trash2, X, GripVertical, Eye, EyeOff, ExternalLink } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

/** Default empty link for the form */
const EMPTY_LINK: FooterLink = { label: '', url: '', open_in_new_tab: false };

/** Default form state */
const DEFAULT_FORM: Omit<FooterSection, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  links: [{ ...EMPTY_LINK }],
  is_visible: true,
  sort_order: 0,
};

export default function AdminFooterPage() {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => { loadSections(); }, []);

  async function loadSections() {
    setLoading(true);
    const data = await getAllFooterSections();
    setSections(data);
    setLoading(false);
  }

  function resetForm() {
    setForm({ ...DEFAULT_FORM, links: [{ ...EMPTY_LINK }] });
    setEditing(null);
  }

  function openEdit(section: FooterSection) {
    setEditing(section.id);
    setForm({
      title: section.title,
      links: section.links.length > 0 ? section.links.map(l => ({ ...l })) : [{ ...EMPTY_LINK }],
      is_visible: section.is_visible,
      sort_order: section.sort_order,
    });
    setShowForm(true);
  }

  // ─── Link helpers ──────────────────────────────────────────────

  function addLink() {
    setForm(f => ({ ...f, links: [...f.links, { ...EMPTY_LINK }] }));
  }

  function removeLink(index: number) {
    setForm(f => ({
      ...f,
      links: f.links.filter((_, i) => i !== index),
    }));
  }

  function updateLink(index: number, field: keyof FooterLink, value: string | boolean) {
    setForm(f => ({
      ...f,
      links: f.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    }));
  }

  // ─── CRUD ──────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Section title is required'); return; }

    // Filter out empty links
    const validLinks = form.links.filter(l => l.label.trim() && l.url.trim());
    if (validLinks.length === 0) { toast.error('At least one link with label and URL is required'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        links: validLinks,
        is_visible: form.is_visible,
        sort_order: form.sort_order,
      };

      if (editing) {
        await updateFooterSection(editing, payload);
        toast.success('Footer section updated!');
      } else {
        await createFooterSection(payload);
        toast.success('Footer section created!');
      }

      await loadSections();
      setShowForm(false);
      resetForm();
    } catch {
      toast.error('Error saving footer section');
    }
    setSaving(false);
  }

  async function handleDelete(section: FooterSection) {
    if (!confirm(`Delete section "${section.title}"?\nAll links inside will also be removed.`)) return;
    try {
      await deleteFooterSection(section.id);
      setSections(prev => prev.filter(s => s.id !== section.id));
      toast.success('Footer section deleted');
    } catch {
      toast.error('Error deleting footer section');
    }
  }

  async function toggleVisibility(section: FooterSection) {
    try {
      await updateFooterSection(section.id, { is_visible: !section.is_visible });
      setSections(prev =>
        prev.map(s => (s.id === section.id ? { ...s, is_visible: !s.is_visible } : s)),
      );
      toast.success(section.is_visible ? 'Section hidden' : 'Section visible');
    } catch {
      toast.error('Error updating visibility');
    }
  }

  // ─── Reorder ───────────────────────────────────────────────────

  async function moveUp(index: number) {
    if (index === 0) return;
    const items = [...sections];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    const reordered = items.map((item, i) => ({ ...item, sort_order: i }));
    setSections(reordered);
    try {
      await reorderFooterSections(reordered.map(s => s.id));
    } catch {
      toast.error('Error reordering');
      await loadSections();
    }
  }

  async function moveDown(index: number) {
    if (index >= sections.length - 1) return;
    const items = [...sections];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    const reordered = items.map((item, i) => ({ ...item, sort_order: i }));
    setSections(reordered);
    try {
      await reorderFooterSections(reordered.map(s => s.id));
    } catch {
      toast.error('Error reordering');
      await loadSections();
    }
  }

  // ─── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Footer Manager</h1>

      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-[#1f3334]">
          <div>
            <h2 className="font-bold text-white">Footer Sections</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {sections.length} section{sections.length !== 1 ? 's' : ''} &middot;{' '}
              {sections.filter(s => s.is_visible).length} visible
            </p>
          </div>
          <NeoButton
            text="Add Section"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm py-2 px-4"
          />
        </div>

        {/* List */}
        <div className="divide-y divide-[#1f3334]/50">
          {sections.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              No footer sections yet. Add your first section to display content in the footer.
            </div>
          )}

          {sections.map((section, index) => (
            <div key={section.id} className="p-5 hover:bg-[#051a1b]/40 transition">
              <div className="flex items-start gap-4">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={`text-xs leading-none ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:text-white'} text-gray-500`}
                  >
                    ▲
                  </button>
                  <span className="text-xs text-gray-500 text-center">{section.sort_order}</span>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index >= sections.length - 1}
                    className={`text-xs leading-none ${index >= sections.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:text-white'} text-gray-500`}
                  >
                    ▼
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium text-sm">{section.title}</h3>
                    <button
                      onClick={() => toggleVisibility(section)}
                      className={`p-1 rounded-lg transition ${
                        section.is_visible
                          ? 'text-green-400 hover:bg-green-900/20'
                          : 'text-gray-500 hover:bg-[#1f3334]'
                      }`}
                      title={section.is_visible ? 'Visible (click to hide)' : 'Hidden (click to show)'}
                    >
                      {section.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        section.is_visible
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-gray-500/15 text-gray-400'
                      }`}
                    >
                      {section.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {section.links.length} link{section.links.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Links preview */}
                  {section.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {section.links.slice(0, 4).map((link, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-[#1f3334] rounded-md text-gray-400"
                        >
                          {link.label}
                          {link.open_in_new_tab && <ExternalLink className="w-2.5 h-2.5" />}
                        </span>
                      ))}
                      {section.links.length > 4 && (
                        <span className="text-xs text-gray-600 px-1 self-center">
                          +{section.links.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(section)}
                    className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(section)}
                    className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ADD / EDIT FORM MODAL                                       */}
      {/* ════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334] sticky top-0 bg-[#051a1b] z-10">
              <h2 className="font-bold text-white">
                {editing ? 'Edit Footer Section' : 'Add Footer Section'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">
                  Section Title *
                </label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. About Us, Quick Links, Services"
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm"
                />
              </div>

              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-gray-500 uppercase">Links</label>
                  <button
                    onClick={addLink}
                    className="text-xs text-green-400 hover:text-green-300 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                </div>

                <div className="space-y-3">
                  {form.links.map((link, index) => (
                      <div
                        key={index}
                        className="bg-[#0b2a2b] rounded-xl border border-[#1f3334] p-2.5 space-y-1.5"
                      >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600 uppercase">Link #{index + 1}</span>
                        {form.links.length > 1 && (
                          <button
                            onClick={() => removeLink(index)}
                            className="text-red-400 hover:text-red-300 transition p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[10px] text-gray-600 uppercase mb-0.5">
                            Label
                          </label>
                          <input
                            value={link.label}
                            onChange={e => updateLink(index, 'label', e.target.value)}
                            placeholder="Privacy Policy"
                            className="w-full p-2 bg-[#051a1b] border border-[#1f3334] rounded-lg text-white text-sm outline-none focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-600 uppercase mb-0.5">
                            URL
                          </label>
                          <input
                            value={link.url}
                            onChange={e => updateLink(index, 'url', e.target.value)}
                            placeholder="/privacy or https://..."
                            className="w-full p-2 bg-[#051a1b] border border-[#1f3334] rounded-lg text-white text-sm outline-none focus:border-green-500"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={link.open_in_new_tab}
                          onChange={e => updateLink(index, 'open_in_new_tab', e.target.checked)}
                          className="accent-[#d7ffa4]"
                        />
                        Open in new tab
                      </label>
                    </div>
                  ))}
                </div>

                {form.links.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No links yet. Click "Add Link" to add one.
                  </p>
                )}
              </div>

              {/* Sort Order & Visibility */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm"
                  />
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_visible}
                      onChange={e => setForm(f => ({ ...f, is_visible: e.target.checked }))}
                      className="accent-[#d7ffa4]"
                    />
                    Visible on public site
                  </label>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton
                text="Cancel"
                onClick={() => setShowForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none"
              />
              <NeoButton
                text={saving ? 'Saving...' : editing ? 'Update Section' : 'Create Section'}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}