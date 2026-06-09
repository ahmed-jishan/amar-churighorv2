'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { getAllAdmins } from '@/lib/firebase/admins';
import { createAdminViaFunction, deleteAdminViaFunction, updateAdminViaFunction } from '@/services/adminService';
import { getStoreConfig, saveStoreConfig, StoreConfig } from '@/lib/firebase/settings';
import { Admin } from '@/types';
import { Plus, UserX, UserCheck, Trash2, X, Search, ShieldCheck, Save, Mail, Phone, Truck, Pencil } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function AdminSettingsPage() {
  const { admin: currentAdmin, isSuperAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'admins' | 'store'>('admins');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ---- Admin List State ----
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ---- Create Admin Modal ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ displayName: '', email: '', password: '' });

  // ---- Edit Admin Modal ----
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Admin | null>(null);
  const [editName, setEditName] = useState('');

  // ---- Confirm Delete Modal ----
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // ---- Store Config ----
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    const [a, c] = await Promise.all([
      getAllAdmins(),
      getStoreConfig(),
    ]);
    setAdmins(a);
    setStoreConfig(c);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered + paginated admins
  const filtered = admins.filter(a =>
    !searchQuery ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ---- Create Admin ----
  async function handleCreateAdmin() {
    if (!createForm.displayName || !createForm.email || !createForm.password) {
      toast.error('Fill all fields'); return;
    }
    if (createForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      toast.error('Enter a valid email address'); return;
    }
    setSaving(true);
    try {
      await createAdminViaFunction({ name: createForm.displayName, email: createForm.email, password: createForm.password });
      await loadData();
      setShowCreateModal(false);
      setCreateForm({ displayName: '', email: '', password: '' });
      toast.success('Admin created successfully!');
    } catch (e: any) {
      const msg = e.code === 'functions/already-exists'
        ? 'This email is already registered.'
        : e.code === 'functions/invalid-argument'
        ? e.message || 'Invalid input'
        : e.code === 'functions/permission-denied'
        ? e.message || 'Permission denied'
        : e.message || 'Error creating admin';
      toast.error(msg);
    }
    setSaving(false);
  }

  // ---- Edit Admin ----
  function openEdit(a: Admin) {
    setEditTarget(a);
    setEditName(a.name);
    setShowEditModal(true);
  }

  async function handleEditAdmin() {
    if (!editTarget || !editName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await updateAdminViaFunction(editTarget.id, { name: editName.trim() });
      await loadData();
      setShowEditModal(false);
      setEditTarget(null);
      toast.success('Admin updated!');
    } catch (e: any) {
      toast.error(e.message || 'Error updating admin');
    }
    setSaving(false);
  }

  // ---- Suspend/Activate ----
  async function handleToggleSuspend(a: Admin) {
    try {
      await updateAdminViaFunction(a.id, { isSuspended: !a.isSuspended });
      await loadData();
      toast.success(a.isSuspended ? 'Admin activated' : 'Admin suspended');
    } catch (e: any) {
      toast.error(e.message || 'Error updating admin');
    }
  }

  // ---- Delete Admin ----
  async function handleDeleteAdmin(uid: string) {
    setSaving(true);
    try {
      await deleteAdminViaFunction(uid);
      await loadData();
      setShowDeleteConfirm(null);
      toast.success('Admin deleted');
    } catch (e: any) {
      toast.error(e.message || 'Error deleting admin');
    }
    setSaving(false);
  }

  // ---- Store Config ----
  function addEmail() {
    if (!storeConfig) return;
    setStoreConfig({ ...storeConfig, contactEmails: [...storeConfig.contactEmails, ''] });
  }
  function updateEmail(index: number, value: string) {
    if (!storeConfig) return;
    const emails = [...storeConfig.contactEmails];
    emails[index] = value;
    setStoreConfig({ ...storeConfig, contactEmails: emails });
  }
  function removeEmail(index: number) {
    if (!storeConfig) return;
    setStoreConfig({ ...storeConfig, contactEmails: storeConfig.contactEmails.filter((_, i) => i !== index) });
  }

  function addPhone() {
    if (!storeConfig) return;
    setStoreConfig({ ...storeConfig, contactPhones: [...storeConfig.contactPhones, ''] });
  }
  function updatePhone(index: number, value: string) {
    if (!storeConfig) return;
    const phones = [...storeConfig.contactPhones];
    phones[index] = value;
    setStoreConfig({ ...storeConfig, contactPhones: phones });
  }
  function removePhone(index: number) {
    if (!storeConfig) return;
    setStoreConfig({ ...storeConfig, contactPhones: storeConfig.contactPhones.filter((_, i) => i !== index) });
  }

  async function handleSaveStore() {
    if (!storeConfig) return;
    if (storeConfig.contactEmails.length === 0 || !storeConfig.contactEmails[0]) {
      toast.error('At least one contact email required'); return;
    }
    setSaving(true);
    try {
      await saveStoreConfig(storeConfig);
      toast.success('Store settings saved!');
    } catch { toast.error('Error saving settings'); }
    setSaving(false);
  }

  // Loading state
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#d7ffa4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'admins' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'}`}>
          <ShieldCheck className="w-4 h-4" /> Admin Management
        </button>
        <button onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'store' ? 'bg-[#d7ffa4] text-[#1a1a1a]' : 'bg-[#0b2a2b] text-gray-400 hover:text-white border border-[#1f3334]'}`}>
          <Truck className="w-4 h-4" /> Store Settings
        </button>
      </div>

      {/* ================================ */}
      {/* ADMIN MANAGEMENT TAB */}
      {/* ================================ */}
      {activeTab === 'admins' && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-[#1f3334]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#d7ffa4]" />
              <h2 className="font-bold text-white">Admin Management</h2>
              <span className="text-xs text-gray-500">({admins.length} total)</span>
            </div>
            {isSuperAdmin && (
              <NeoButton text="Add Admin" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}
                className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm py-2 px-4" />
            )}
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-[#1f3334]/50">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 bg-[#051a1b] border border-[#1f3334] rounded-xl text-sm text-white outline-none focus:border-green-500" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto scrollbar-admin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Created</th>
                  {isSuperAdmin && <th className="text-left p-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={isSuperAdmin ? 6 : 5} className="p-8 text-center text-gray-500">No admins found</td></tr>
                ) : paginated.map(a => (
                  <tr key={a.id} className="border-b border-[#1f3334]/40 hover:bg-[#051a1b] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#d7ffa4] flex items-center justify-center text-[#1a1a1a] font-bold text-sm">
                          {(a.name || a.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="text-white font-medium">{a.name}</span>
                          {a.id === currentAdmin?.id && <span className="ml-2 text-xs text-[#d7ffa4] bg-[#d7ffa4]/10 px-1.5 py-0.5 rounded-full">You</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{a.email}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${a.role === 'super_admin' ? 'bg-[#d7ffa4]/20 text-[#d7ffa4]' : 'bg-blue-500/20 text-blue-400'}`}>
                        {a.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.isSuspended ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {a.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                    </td>
                    {isSuperAdmin && (
                      <td className="p-4">
                        {a.id !== currentAdmin?.id && a.role !== 'super_admin' && (
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-blue-400 transition" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleToggleSuspend(a)}
                              className={`p-1.5 rounded-lg transition ${a.isSuspended ? 'text-green-400 hover:bg-green-900/20' : 'text-yellow-400 hover:bg-yellow-900/20'}`}
                              title={a.isSuspended ? 'Activate' : 'Suspend'}>
                              {a.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setShowDeleteConfirm(a.id)}
                              className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1f3334]">
              <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1 text-xs bg-[#1f3334] rounded-lg text-gray-400 disabled:opacity-40 hover:text-white transition">← Prev</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs bg-[#1f3334] rounded-lg text-gray-400 disabled:opacity-40 hover:text-white transition">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================ */}
      {/* STORE SETTINGS TAB */}
      {/* ================================ */}
      {activeTab === 'store' && storeConfig && (
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
          <h2 className="font-bold text-white mb-5 flex items-center gap-2"><Truck className="w-5 h-5 text-[#d7ffa4]" /> Store Settings</h2>
          <div className="space-y-6">
            {/* Emails */}
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2 flex items-center gap-1"><Mail className="w-3 h-3" /> Contact Emails</label>
              <div className="space-y-2">
                {storeConfig.contactEmails.map((email, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={email} onChange={e => updateEmail(i, e.target.value)}
                      className="flex-1 p-3 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white text-sm outline-none focus:border-green-500" placeholder="email@example.com" />
                    {storeConfig.contactEmails.length > 1 && (
                      <button onClick={() => removeEmail(i)} className="text-red-400 hover:text-red-600 transition p-1"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addEmail} className="mt-2 text-xs text-green-400 hover:text-green-300 transition">+ Add another email</button>
            </div>
            {/* Phones */}
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact Phones</label>
              <div className="space-y-2">
                {storeConfig.contactPhones.map((phone, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={phone} onChange={e => updatePhone(i, e.target.value)}
                      className="flex-1 p-3 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white text-sm outline-none focus:border-green-500" placeholder="+880 1XXXXXXXXX" />
                    {storeConfig.contactPhones.length > 1 && (
                      <button onClick={() => removePhone(i)} className="text-red-400 hover:text-red-600 transition p-1"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addPhone} className="mt-2 text-xs text-green-400 hover:text-green-300 transition">+ Add another phone</button>
            </div>
            {/* Delivery */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1 flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery (Inside Dhaka)</label>
                <div className="relative"><span className="absolute left-3 top-3 text-gray-400 text-sm">৳</span>
                  <input type="number" min={0} value={storeConfig.deliveryChargeInside}
                    onChange={e => setStoreConfig({ ...storeConfig, deliveryChargeInside: Number(e.target.value) })}
                    className="w-full pl-8 p-3 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white text-sm outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1 flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery (Outside Dhaka)</label>
                <div className="relative"><span className="absolute left-3 top-3 text-gray-400 text-sm">৳</span>
                  <input type="number" min={0} value={storeConfig.deliveryChargeOutside}
                    onChange={e => setStoreConfig({ ...storeConfig, deliveryChargeOutside: Number(e.target.value) })}
                    className="w-full pl-8 p-3 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white text-sm outline-none focus:border-green-500" />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <NeoButton text={saving ? 'Saving...' : 'Save'} icon={<Save className="w-4 h-4" />} onClick={handleSaveStore} disabled={saving}
                className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* CREATE ADMIN MODAL */}
      {/* ================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="font-bold text-white">Create Admin Account</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500">New admin will be created via Cloud Function. Your session will NOT be affected.</p>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Full Name *</label>
                <input value={createForm.displayName} onChange={e => setCreateForm(f => ({ ...f, displayName: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Password * (min 6 chars)</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowCreateModal(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Creating...' : 'Create Admin'} onClick={handleCreateAdmin} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* EDIT ADMIN MODAL */}
      {/* ================================ */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-sm">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="font-bold text-white">Edit Admin</h2>
              <button onClick={() => { setShowEditModal(false); setEditTarget(null); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div className="text-sm text-gray-400">
                <p>Email: <span className="text-white">{editTarget.email}</span></p>
                <p>Role: <span className="capitalize">{editTarget.role.replace('_', ' ')}</span></p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => { setShowEditModal(false); setEditTarget(null); }}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Saving...' : 'Save'} onClick={handleEditAdmin} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-sm">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="font-bold text-white">Confirm Delete</h2>
              <button onClick={() => setShowDeleteConfirm(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-gray-300 text-sm">Are you sure you want to delete this admin? This will also remove their authentication account.</p>
              <p className="text-red-400 text-xs mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowDeleteConfirm(null)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Deleting...' : 'Delete'} onClick={() => handleDeleteAdmin(showDeleteConfirm)} disabled={saving}
                className="flex-1 bg-red-600 text-white border-red-600 shadow-[3px_3px_0px_#7f1d1d] hover:shadow-[5px_5px_0px_#7f1d1d]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}