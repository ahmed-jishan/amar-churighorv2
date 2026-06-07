'use client';
import { useEffect, useState } from 'react';
import { getAllOrders } from '@/lib/firebase/orders';
import { getProducts } from '@/lib/firebase/products';
import { Order, Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Package, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllOrders(), getProducts()]).then(([o, p]) => {
      setOrders(o);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const stats = [
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'bg-green-500/20 text-green-400' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Products', value: products.length, icon: Package, color: 'bg-purple-500/20 text-purple-400' },
    { label: 'Pending', value: pendingOrders, icon: Clock, color: 'bg-yellow-500/20 text-yellow-400' },
    { label: 'Delivered', value: deliveredOrders, icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400' },
    { label: 'Cancelled', value: cancelledOrders, icon: XCircle, color: 'bg-red-500/20 text-red-400' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-28 animate-pulse bg-[#0b2a2b] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {stats.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-[#0b2a2b] rounded-2xl border border-[#1f3334] overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
          <h2 className="font-bold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-[#d7ffa4] hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3334] text-gray-500">
                <th className="text-left p-4">Order ID</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(order => (
                <tr key={order.id} className="border-b border-[#1f3334]/50 hover:bg-[#051a1b] transition">
                  <td className="p-4 font-mono text-[#d7ffa4]">{order.orderId}</td>
                  <td className="p-4 text-white">{order.customer.fullName}</td>
                  <td className="p-4 text-green-400">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                      order.status === 'shipped' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}