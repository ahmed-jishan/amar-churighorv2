'use client';
import { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus } from '@/lib/firebase/orders';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  packed: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  shipped: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    getAllOrders().then(o => { setOrders(o); setLoading(false); });
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.orderId.includes(search.toUpperCase()) ||
      o.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusUpdate = async (order: Order, status: OrderStatus) => {
    await updateOrderStatus(order.id, status);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o));
    if (selected?.id === order.id) setSelected({ ...selected, status });
    toast.success(`Order ${order.orderId} updated to ${status}`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order, name, phone..."
            className="pl-9 pr-4 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-white outline-none focus:border-green-500 w-64" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="px-4 py-2 bg-[#0b2a2b] border border-[#1f3334] rounded-xl text-sm text-white outline-none">
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <span className="ml-auto text-sm text-gray-500 self-center">{filtered.length} orders</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                  <th className="text-left p-4">Order</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-4 animate-pulse bg-[#1f3334] rounded" /></td></tr>
                )) : filtered.map(order => (
                  <tr key={order.id} onClick={() => setSelected(order)}
                    className={`border-b border-[#1f3334]/50 cursor-pointer transition ${selected?.id === order.id ? 'bg-[#051a1b]' : 'hover:bg-[#051a1b]'}`}>
                    <td className="p-4 font-mono text-[#d7ffa4] text-xs">{order.orderId}</td>
                    <td className="p-4 text-white">{order.customer.fullName}<br /><span className="text-xs text-gray-500">{order.customer.phone}</span></td>
                    <td className="p-4 text-green-400">{formatPrice(order.total)}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && <div className="text-center py-12 text-gray-500">No orders found</div>}
          </div>
        </div>

        {/* Order Detail */}
        <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5">
          {!selected ? (
            <div className="text-center py-16 text-gray-500 text-sm">Click an order to view details</div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-mono text-[#d7ffa4] text-sm">{selected.orderId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="border-t border-[#1f3334] pt-4">
                  <p className="text-gray-500 mb-2 text-xs uppercase">Customer</p>
                  <p className="text-white font-medium">{selected.customer.fullName}</p>
                  <p className="text-gray-400">{selected.customer.phone}</p>
                  <p className="text-gray-400 mt-1">{selected.customer.address}, {selected.customer.area}, {selected.customer.district}</p>
                  {selected.customer.notes && <p className="text-gray-500 mt-1 italic">Note: {selected.customer.notes}</p>}
                </div>

                <div className="border-t border-[#1f3334] pt-4">
                  <p className="text-gray-500 mb-2 text-xs uppercase">Items</p>
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1">
                      <span className="text-gray-300">{item.name} ×{item.quantity}</span>
                      <span className="text-green-400">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#1f3334] mt-2 pt-2 flex justify-between font-bold text-white">
                    <span>Total</span><span className="text-green-400">{formatPrice(selected.total)}</span>
                  </div>
                </div>

                <div className="border-t border-[#1f3334] pt-4">
                  <p className="text-gray-500 mb-2 text-xs uppercase">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => handleStatusUpdate(selected, s)}
                        disabled={selected.status === s}
                        className={`px-3 py-2 rounded-lg text-xs border capitalize transition ${
                          selected.status === s ? 'opacity-50 cursor-not-allowed ' + STATUS_COLORS[s] : 'border-[#1f3334] text-gray-400 hover:border-green-500 hover:text-green-400'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}