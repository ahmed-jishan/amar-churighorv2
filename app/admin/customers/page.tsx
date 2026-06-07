'use client';
import { useEffect, useState, useMemo } from 'react';
import { getAllOrders } from '@/lib/firebase/orders';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Search, Phone, MapPin, ShoppingBag } from 'lucide-react';

interface CustomerRecord {
  fullName: string;
  phone: string;
  address: string;
  district: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
}

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllOrders().then(o => { setOrders(o); setLoading(false); });
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerRecord>();
    orders.forEach(o => {
      const key = o.customer.phone;
      const existing = map.get(key);
      if (existing) {
        existing.totalOrders++;
        existing.totalSpent += o.total;
        if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
      } else {
        map.set(key, {
          fullName: o.customer.fullName,
          phone: o.customer.phone,
          address: o.customer.address,
          district: o.customer.district,
          totalOrders: 1,
          totalSpent: o.total,
          lastOrder: o.createdAt,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = customers.filter(c =>
    !search || c.fullName.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Customers</h1>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-white outline-none focus:border-green-500" />
        </div>
        <span className="text-sm text-gray-500 self-center">{filtered.length} customers</span>
      </div>

      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-left p-4">District</th>
                <th className="text-left p-4">Orders</th>
                <th className="text-left p-4">Total Spent</th>
                <th className="text-left p-4">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-4"><div className="h-4 animate-pulse bg-[#1f3334] rounded" /></td></tr>
              )) : filtered.map(c => (
                <tr key={c.phone} className="border-b border-[#1f3334]/40 hover:bg-[#051a1b] transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#d7ffa4] rounded-full flex items-center justify-center text-[#1a1a1a] font-bold text-sm">
                        {c.fullName[0]}
                      </div>
                      <span className="text-white">{c.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-gray-400">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-gray-400">
                      <MapPin className="w-3 h-3" /> {c.district}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-gray-300">
                      <ShoppingBag className="w-3 h-3" /> {c.totalOrders}
                    </span>
                  </td>
                  <td className="p-4 text-green-400">{formatPrice(c.totalSpent)}</td>
                  <td className="p-4 text-gray-500 text-xs">{new Date(c.lastOrder).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <div className="text-center py-12 text-gray-500">No customers found</div>}
        </div>
      </div>
    </div>
  );
}