'use client';
import { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus } from '@/lib/firebase/orders';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Search, ImageIcon, Mail, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import Image from 'next/image';
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

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    getAllOrders().then(o => { setOrders(o); setLoading(false); });
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.orderId.includes(search.toUpperCase()) ||
      o.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search) ||
      (o.customer.email && o.customer.email.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusUpdate = async (order: Order, status: OrderStatus) => {
    await updateOrderStatus(order.id, status, statusNote || undefined);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o));
    if (selected?.id === order.id) setSelected({ ...selected, status });
    toast.success(`Order ${order.orderId} updated to ${status}`);
    setStatusNote('');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order, name, email, phone..."
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
          <div className="overflow-x-auto scrollbar-admin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f3334] text-gray-500 text-xs uppercase">
                  <th className="text-left p-4">Order</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-4"><div className="h-4 animate-pulse bg-[#1f3334] rounded" /></td></tr>
                )) : filtered.map(order => (
                  <tr key={order.id} onClick={() => setSelected(order)}
                    className={`border-b border-[#1f3334]/50 cursor-pointer transition ${selected?.id === order.id ? 'bg-[#051a1b]' : 'hover:bg-[#051a1b]'}`}>
                    <td className="p-4 font-mono text-[#d7ffa4] text-xs">{order.orderId}</td>
                    <td className="p-4 text-white">{order.customer.fullName}<br /><span className="text-xs text-gray-500">{order.customer.phone}</span></td>
                    <td className="p-4 text-gray-400 text-xs">{order.customer.email || '—'}</td>
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
                  {selected.customer.email && (
                    <p className="text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {selected.customer.email}</p>
                  )}
                  <p className="text-gray-400">{selected.customer.phone}</p>
                  <p className="text-gray-400 mt-1">{selected.customer.address}, {selected.customer.area}, {selected.customer.district}</p>
                  {selected.customer.notes && <p className="text-gray-500 mt-1 italic">Note: {selected.customer.notes}</p>}
                </div>

                <div className="border-t border-[#1f3334] pt-4">
                  <p className="text-gray-500 mb-2 text-xs uppercase">Items</p>
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#1f3334]/30 last:border-b-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1f3334] flex-shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-600" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-xs truncate">{item.name}</p>
                        <p className="text-gray-500 text-xs">×{item.quantity}</p>
                      </div>
                      <span className="text-green-400 text-xs font-medium whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
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
                          selected.status === s
                            ? s === 'cancelled'
                              ? 'bg-red-600 text-white border-red-600 opacity-90'
                              : 'bg-[#d7ffa4] text-[#051a1b] border-[#d7ffa4] font-bold'
                            : 'border-[#1f3334] text-gray-400 hover:border-green-500 hover:text-green-400'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {/* Admin Note Input */}
                  <div className="mt-3">
                    <input
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      placeholder="Add a note for this status change (optional)"
                      className="w-full p-2 bg-[#051a1b] border border-[#1f3334] rounded-lg text-xs text-white outline-none focus:border-green-500 placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Status History */}
                {selected.statusHistory && selected.statusHistory.length > 0 && (
                  <div className="border-t border-[#1f3334] pt-4">
                    <p className="text-gray-500 mb-2 text-xs uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Status History
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {[...selected.statusHistory].reverse().map((entry, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs border-b border-[#1f3334]/30 pb-2 last:border-0 last:pb-0">
                          <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                            entry.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize text-gray-300">{entry.status}</span>
                              <span className="text-gray-600" title={new Date(entry.timestamp).toLocaleString()}>
                                {formatRelativeTime(entry.timestamp)}
                              </span>
                            </div>
                            {entry.note && <p className="text-gray-500 mt-0.5 truncate">{entry.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Status */}
                <div className="border-t border-[#1f3334] pt-4">
                  <p className="text-gray-500 mb-2 text-xs uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email Notification
                  </p>
                  <div className="space-y-2">
                    {selected.emailInfo ? (
                      <>
                        <div className="flex items-center gap-2 text-xs">
                          {selected.emailInfo.success ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-green-400">Sent successfully</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-red-400">Failed</span>
                            </>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs">
                          To: {selected.emailInfo.to}
                        </p>
                        {selected.emailInfo.sentAt && (
                          <p className="text-gray-500 text-xs">
                            {new Date(selected.emailInfo.sentAt).toLocaleString()}
                          </p>
                        )}
                        {selected.emailInfo.error && (
                          <p className="text-red-500/70 text-xs italic">
                            Error: {selected.emailInfo.error}
                          </p>
                        )}
                      </>
                    ) : selected.notificationSent ? (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-400">Sent (legacy)</span>
                        {selected.emailSentAt && (
                          <span className="text-gray-500">
                            {new Date(selected.emailSentAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <XCircle className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-gray-400">Not sent yet</span>
                      </div>
                    )}

                    {/* Resend Email Button */}
                    {selected.customer.email && (
                      <button
                        onClick={async () => {
                          toast.loading('Sending email...');
                          try {
                            const res = await fetch('/api/notify-order', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                orderId: selected.orderId,
                                trackingToken: selected.trackingToken,
                                email: selected.customer.email,
                                customerName: selected.customer.fullName,
                                total: selected.total,
                                items: selected.items.map(item => ({
                                  name: item.name,
                                  quantity: item.quantity,
                                  price: item.price,
                                })),
                                subtotal: selected.subtotal,
                                deliveryCharge: selected.deliveryCharge,
                                district: selected.customer.district,
                                area: selected.customer.area,
                                address: selected.customer.address,
                                phone: selected.customer.phone,
                              }),
                            });
                            const data = await res.json();
                            toast.dismiss();
                            if (data.success) {
                              toast.success('Email sent successfully!');
                              // Refresh order data to show updated email info
                              const updated = await getAllOrders();
                              setOrders(updated);
                              const refreshed = updated.find(o => o.id === selected.id);
                              if (refreshed) setSelected(refreshed);
                            } else {
                              toast.error(`Failed: ${data.error || 'Unknown error'}`);
                            }
                          } catch (err) {
                            toast.dismiss();
                            toast.error('Failed to send email');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-[#1f3334] text-gray-400 hover:border-green-500 hover:text-green-400 transition-colors mt-2"
                      >
                        <Send className="w-3 h-3" />
                        Resend Email
                      </button>
                    )}
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
