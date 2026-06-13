'use client';
import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/firebase/categories';
import { uploadImage } from '@/lib/cloudinary';
import { ProductCategory } from '@/types';
import { Plus, Pencil, Trash2, X, GripVertical, Upload } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', icon: '', image: '', isActive: true, sortOrder: 0,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  }

  function resetForm() {
    setForm({ name: '', slug: '', icon: '', image: '', isActive: true, sortOrder: 0 });
    setEditing(null);
  }

  function openEdit(cat: ProductCategory) {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '',
      image: cat.image || '',
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSave() {
    if (!form.name) { toast.error('Category name required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: form.name,
          slug: form.slug || generateSlug(form.name),
          icon: form.icon || undefined,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
        });
        toast.success('Category updated!');
      } else {
        await createCategory({
          name: form.name,
          slug: form.slug || generateSlug(form.name),
          icon: form.icon || undefined,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
          createdAt: new Date().toISOString(),
        });
        toast.success('Category created!');
      }
      await loadCategories();
      setShowForm(false);
      resetForm();
    } catch {
      toast.error('Error saving category');
    }
    setSaving(false);
  }

  async function handleDelete(cat: ProductCategory) {
    if (!confirm(`Delete category "${cat.name}"?\nProducts using this category will not be affected.`)) return;
    try {
      await deleteCategory(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      toast.success('Category deleted');
    } catch {
      toast.error('Error deleting category');
    }
  }

  async function toggleActive(cat: ProductCategory) {
    try {
      await updateCategory(cat.id, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
      toast.success(`${cat.name} ${cat.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Error updating category');
    }
  }

  async function moveUp(index: number) {
    if (index === 0) return;
    const items = [...categories];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    const reordered = items.map((item, i) => ({ ...item, sortOrder: i }));
    setCategories(reordered);
    try {
      await Promise.all(reordered.map(item => updateCategory(item.id, { sortOrder: item.sortOrder })));
    } catch {
      toast.error('Error reordering');
      await loadCategories();
    }
  }

  async function moveDown(index: number) {
    if (index >= categories.length - 1) return;
    const items = [...categories];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    const reordered = items.map((item, i) => ({ ...item, sortOrder: i }));
    setCategories(reordered);
    try {
      await Promise.all(reordered.map(item => updateCategory(item.id, { sortOrder: item.sortOrder })));
    } catch {
      toast.error('Error reordering');
      await loadCategories();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        <NeoButton text="Add Category" icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm" />
      </div>

      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
        <div className="overflow-x-auto scrollbar-admin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                <th className="p-4 w-10"></th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Slug</th>
        <th className="text-left p-4">Image</th>
                <th className="text-left p-4">Order</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(3).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-4"><div className="h-4 animate-pulse bg-[#1f3334] rounded" /></td></tr>
              )) : categories.map((cat, index) => (
                <tr key={cat.id} className="border-b border-[#1f3334]/40 hover:bg-[#051a1b] transition">
                  <td className="p-4 text-gray-500">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveUp(index)} disabled={index === 0}
                        className={`text-xs leading-none ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:text-white'}`}>▲</button>
                      <button onClick={() => moveDown(index)} disabled={index >= categories.length - 1}
                        className={`text-xs leading-none ${index >= categories.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:text-white'}`}>▼</button>
                    </div>
                  </td>
                  <td className="p-4 text-white font-medium">{cat.name}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{cat.slug}</td>
                  <td className="p-4">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border border-[#1f3334]" />
                    ) : (
                      <span className="text-gray-500 text-xs">No image</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{cat.sortOrder}</td>
                  <td className="p-4">
                    <button onClick={() => toggleActive(cat)}
                      className={`text-xs px-2 py-0.5 rounded-full transition ${cat.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && categories.length === 0 && <div className="text-center py-12 text-gray-500">No categories yet. Add your first category!</div>}
        </div>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-lg">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334] sticky top-0 bg-[#051a1b]">
              <h2 className="font-bold text-white">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : generateSlug(e.target.value) }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Slug</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Icon (emoji)</label>
                <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="💍"
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Category Image</label>
                {form.image ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#1f3334] mb-2">
                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, image: '' }))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-[#1f3334] rounded-xl cursor-pointer hover:border-green-500 transition mb-2">
                    {uploadingImage ? <span className="text-xs text-green-400 animate-pulse">Uploading...</span> : <Upload className="w-6 h-6 text-gray-500" />}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      try {
                        const url = await uploadImage(file);
                        setForm(f => ({ ...f, image: url }));
                        toast.success('Image uploaded to Cloudinary!');
                      } catch { toast.error('Image upload failed'); }
                      setUploadingImage(false);
                    }} />
                  </label>
                )}
                <p className="text-[10px] text-gray-500">Upload to Cloudinary. Recommended: 400x400px</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="accent-[#d7ffa4]" /> Active
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'} onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}