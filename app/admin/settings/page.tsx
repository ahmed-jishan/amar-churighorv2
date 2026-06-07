'use client';
import { useEffect, useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { getAllAdmins, createAdmin, suspendAdmin, removeAdmin } from '@/lib/firebase/admins';
import { Admin } from '@/types';
import { Plus, UserX, UserCheck, Trash2, X, ShieldCheck } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { admin: currentAdmin } = useAdmin();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  useEffect(() => {
    getAllAdmins().then(data => { setAdmins(data); setLoading(false); });
  }, []);

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) { toast.error('Fill all fields'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await createAdmin(form.email, form.password, form.name);
      const updated = await getAllAdmins();
      setAdmins(updated);
      setShowForm(false);
      setForm({ name: '', email: '', password: '' });
      toast.success('Admin created!');
    } catch (e: any) {
      toast.error(e.message ?? 'Error creating admin');
    }
    setSaving(false);
  }

  async function handleSuspend(a: Admin) {
    await suspendAdmin(a.id, !a.isSuspended);
    setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, isSuspended: !x.isSuspended } : x));
    toast.success(a.isSuspended ? 'Admin unsuspended' : 'Admin suspended');
  }

  async function handleRemove(a: Admin) {
    if (!confirm(`Remove admin "${a.name}"? This cannot be undone.`)) return;
    await removeAdmin(a.id);
    setAdmins(prev => prev.filter(x => x.id !== a.id));
    toast.success('Admin removed');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* Admin Management (Super Admin only) */}
      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden mb-8">
        <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#d7ffa4]" />
            <h2 className="font-bold text-white">Admin Management</h2>
          </div>
          {isSuperAdmin && (
            <NeoButton text="Add Admin" icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm py-2 px-4" />
          )}
        </div>

        {!isSuperAdmin && (
          <div className="p-6 text-center text-gray-500 text-sm">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            Only Super Admins can manage the admin team.
          </div>
        )}

        {isSuperAdmin && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(3).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-[#1f3334]/40">
                  <td colSpan={5} className="p-4"><div className="h-4 bg-[#1f3334] animate-pulse rounded" /></td>
                </tr>
              )) : admins.map(a => (
                <tr key={a.id} className="border-b border-[#1f3334]/40">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#d7ffa4] flex items-center justify-center text-[#1a1a1a] font-bold text-sm">
                        {a.name[0]}
                      </div>
                      <span className="text-white">{a.name}</span>
                      {a.id === currentAdmin?.id && <span className="text-xs text-[#d7ffa4] bg-[#d7ffa4]/10 px-1.5 py-0.5 rounded-full">You</span>}
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
                  <td className="p-4">
                    {a.id !== currentAdmin?.id && a.role !== 'super_admin' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleSuspend(a)}
                          className="p-1.5 hover:bg-[#1f3334] rounded-lg text-gray-400 hover:text-yellow-400 transition" title={a.isSuspended ? 'Unsuspend' : 'Suspend'}>
                          {a.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleRemove(a)}
                          className="p-1.5 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Store Settings */}
      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
        <h2 className="font-bold text-white mb-5">Store Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Store Name', value: 'Amar Churighor', disabled: true },
            { label: 'Contact Email', value: 'hello@amarchurchighor.com' },
            { label: 'Contact Phone', value: '+880 1XXXXXXXXX' },
            { label: 'Delivery Charge (Dhaka)', value: '৳80' },
            { label: 'Delivery Charge (Outside)', value: '৳130' },
          ].map(({ label, value, disabled }) => (
            <div key={label}>
              <label className="block text-xs text-gray-500 uppercase mb-1">{label}</label>
              <input defaultValue={value} disabled={disabled}
                className="w-full p-3 bg-[#051a1b] border border-[#1f3334] rounded-xl text-white text-sm outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <NeoButton text="Save Settings"
            className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] text-sm"
            onClick={() => toast.success('Settings saved!')} />
        </div>
      </div>

      {/* Create Admin Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#051a1b] rounded-2xl border border-[#1f3334] w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="font-bold text-white">Create Admin Account</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Password * (min 8 chars)</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full p-3 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-white outline-none focus:border-green-500 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-[#1f3334]">
              <NeoButton text="Cancel" onClick={() => setShowForm(false)}
                className="bg-transparent text-gray-400 border-[#1f3334] shadow-none" />
              <NeoButton text={saving ? 'Creating...' : 'Create Admin'} onClick={handleCreate} disabled={saving}
                className="flex-1 bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}