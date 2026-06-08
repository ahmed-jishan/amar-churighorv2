'use client';
import { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/lib/firebase/products';
import { uploadImage } from '@/lib/cloudinary';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Search, Upload } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

const CATEGORIES = ['Bangles', 'Earrings', 'Necklaces', 'Rings', 'Bracelets', 'Anklets', 'Sets', 'Others'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', category: CATEGORIES[0], description: '', price: '', discountPrice: '',
    sku: '', stock: '0', tags: '', isFeatured: false, isBestSeller: false, isActive: true,
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    getProducts().then(p => { setProducts(p); setLoading(false); });
  }, []);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function resetForm() {
    setForm({ name: '', slug: '', category: CATEGORIES[0], description: '', price: '', discountPrice: '',
      sku: '', stock: '0', tags: '', isFeatured: false, isBestSeller: false, isActive: true });
    setEditing(null);
    setNewImages([]);
    setExistingImages([]);
    setNewImagePreviews([]);
    setUploadProgress(null);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name, slug: product.slug, category: product.category, description: product.description,
      price: String(product.price), discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      sku: product.sku, stock: String(product.stock),
      tags: product.tags.join(', '), isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller, isActive: product.isActive,
    });
    setExistingImages(product.images || []);
    setNewImages([]);
    setNewImagePreviews([]);
    setUploadProgress(null);
    setShowForm(true);
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error('Name & price required'); return; }
    setSaving(true);
    setUploadingImages(true);
    try {
      let uploaded: string[] = [...existingImages];
      for (let idx = 0; idx < newImages.length; idx++) {
        const file = newImages[idx];
        setUploadProgress(`Uploading image ${idx + 1} of ${newImages.length}...`);
        const url = await uploadImage(file);
        uploaded.push(url);
      }
      setUploadProgress(null);
      setUploadingImages(false);

      const productData: Omit<Product, 'id'> = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        category: form.category,
        description: form.description,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        sku: form.sku || `SKU-${Date.now()}`,
        stock: Number(form.stock),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: uploaded,
        featuredImage: uploaded[0] || '',
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNewArrival: false,
        isActive: form.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editing) {
        await updateProduct(editing.id, productData);
        toast.success('Product updated!');
      } else {
        await createProduct(productData);
        toast.success('Product created!');
      }

      const updated = await getProducts();
      setProducts(updated);
      setShowForm(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message ?? 'Error saving product');
    }
    setSaving(false);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success('Product deleted');
    } catch {
      toast.error('Error deleting product');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Products</h1>
        <NeoButton text="Add Product" icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm" />
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-white outline-none focus:border-green-500" />
        </div>
        <span className="text-sm text-gray-500 self-center">{filtered.length} products</span>
      </div>

      {/* Products Table */}
      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">SKU</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-4"><div className="h-4 animate-pulse bg-[#1f3334] rounded" /></td></tr>
              )) : filtered.map(product => (
                <tr key={product.id} className="border-b border-[#1f3334]/40 hover:bg-[#051a1b] transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.featuredImage && (
                        <img src={product.featuredImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <span className="text-white font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-xs">{product.sku}</td>
                  <td className="p-4"><span className="text-xs bg-[#1f3334] text-gray-300 px-2 py-0.5 rounded-full">{product.category}</span></td>
                  <td className="p-4 text-green-400">{formatPrice(product.price)}</td>
                  <td className="p-4">
                    <span className={`${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product)} className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="text-center py-12 text-gray-500">No products found</div>}
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334] sticky top-0 bg-[#051a1b] z-10">
              <h2 className="font-bold text-white">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs text-gray-500 uppercase mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">SKU</label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Price *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Discount Price</label>
                  <input type="number" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {/* Existing images from DB */}
                  {existingImages.map((url, i) => (
                    <div key={`existing-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#1f3334] group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {!uploadingImages && (
                        <button onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                  {/* New image previews from file selection */}
                  {newImagePreviews.map((preview, i) => (
                    <div key={`new-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-500/50">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      {!uploadingImages && (
                        <button onClick={() => {
                          setNewImages(prev => prev.filter((_, idx) => idx !== i));
                          setNewImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                        }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Upload button — hide while uploading */}
                  {!uploadingImages && (
                    <label className="w-16 h-16 flex items-center justify-center border-2 border-dashed border-[#1f3334] rounded-lg cursor-pointer hover:border-green-500 transition">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                        const files = Array.from(e.target.files || []);
                        const previews = files.map(f => URL.createObjectURL(f));
                        setNewImages(prev => [...prev, ...files]);
                        setNewImagePreviews(prev => [...prev, ...previews]);
                      }} />
                    </label>
                  )}
                </div>
                {/* Upload progress indicator */}
                {uploadProgress && (
                  <div className="flex items-center gap-2 text-xs text-green-400 mt-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {uploadProgress}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="accent-[#d7ffa4]" /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.isBestSeller} onChange={e => setForm(f => ({ ...f, isBestSeller: e.target.checked }))}
                    className="accent-[#d7ffa4]" /> Best Seller
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="accent-[#d7ffa4]" /> Active
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'} onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}