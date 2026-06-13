'use client';

import { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import { getOrdersByEmail, getOrderByOrderId } from '@/lib/firebase/orders';
import { motion } from 'framer-motion';
import NeoButton from '@/components/ui/NeoButton';
import Link from 'next/link';
import { Package, ShoppingBag, Copy, Check, ChevronRight, Search, Hash, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  processing: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  packed: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  shipped: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  delivered: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
};

const STATUS_ICONS: Record<OrderStatus, string> = {
  pending: '⏳',
  confirmed: '✅',
  processing: '⚙️',
  packed: '📦',
  shipped: '🚚',
  delivered: '🎉',
  cancelled: '❌',
};

function OrderSkeleton() {
  return (
    <div className="bg-gray-100 dark:bg-[#0d1f20] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 dark:bg-[#1f3334] rounded" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-[#1f3334] rounded-full" />
      </div>
      <div className="h-3 w-32 bg-gray-200 dark:bg-[#1f3334] rounded mb-3" />
      <div className="h-3 w-20 bg-gray-200 dark:bg-[#1f3334] rounded" />
    </div>
  );
}

function EmptyState({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
        className="w-20 h-20 bg-gray-200 dark:bg-[#1f3334] rounded-full flex items-center justify-center mx-auto mb-6"
      >
        {isError ? (
          <span className="text-3xl">⚠️</span>
        ) : (
          <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        )}
      </motion.div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {isError ? 'Something went wrong' : 'No orders found'}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm">
        {message}
      </p>
      <Link href="/products">
        <NeoButton
          text="Start Shopping"
          icon={<ShoppingBag className="w-4 h-4" />}
          className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
        />
      </Link>
    </motion.div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.orderId).then(() => {
      setCopiedId(true);
      toast.success('Order ID copied!');
      setTimeout(() => setCopiedId(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#0d1f20] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-5 hover:border-green-400 dark:hover:border-green-500/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{STATUS_ICONS[order.status]}</span>
            <button
              onClick={handleCopyOrderId}
              className="font-mono text-green-600 dark:text-[#d7ffa4] text-sm font-medium hover:underline flex items-center gap-1"
            >
              {order.orderId}
              {copiedId ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs border capitalize whitespace-nowrap ${STATUS_COLORS[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mt-4 pt-3 border-t border-gray-200 dark:border-[#1f3334]">
        <span className="text-gray-500 dark:text-gray-400">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </span>
        <span className="font-bold text-green-600 dark:text-[#d7ffa4]">
          {formatPrice(order.total)}
        </span>
      </div>

      <Link
        href={`/track-order?id=${order.orderId}`}
        className="mt-3 flex items-center justify-center gap-1 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-[#1f3334] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a4546] transition-colors"
      >
        Track Order →
        <ChevronRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);

  // Email search
  const [email, setEmail] = useState('');

  // Order ID search
  const [orderIdSearch, setOrderIdSearch] = useState('');

  const handleEmailSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const results = await getOrdersByEmail(email.trim());
      setOrders(results);
    } catch (err) {
      console.error('Failed to search orders by email:', err);
      setError(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderIdSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdSearch.trim()) return;
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const result = await getOrderByOrderId(orderIdSearch.trim().toUpperCase());
      setOrders(result ? [result] : []);
    } catch (err) {
      console.error('Failed to search order by ID:', err);
      setError(true);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Orders</h1>
      </motion.div>

      {/* Method A — Search by Email */}
      <div className="bg-white dark:bg-[#0d1f20] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Find orders by email
        </h2>
        <form onSubmit={handleEmailSearch} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 p-3 border border-gray-300 dark:border-[#1f3334] rounded-xl bg-white dark:bg-[#051a1b] outline-none focus:border-green-500 transition text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <NeoButton
            type="submit"
            text="Find"
            icon={<Search className="w-4 h-4" />}
            disabled={loading || !email.trim()}
            className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] px-4"
          />
        </form>
      </div>

      {/* Method B — Search by Order ID */}
      <div className="bg-white dark:bg-[#0d1f20] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Hash className="w-4 h-4" /> Track by Order ID
        </h2>
        <form onSubmit={handleOrderIdSearch} className="flex gap-2">
          <input
            type="text"
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
            placeholder="Enter Order ID (e.g. AC1X2Y3Z)"
            className="flex-1 p-3 border border-gray-300 dark:border-[#1f3334] rounded-xl bg-white dark:bg-[#051a1b] outline-none focus:border-green-500 transition text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 font-mono"
          />
          <NeoButton
            type="submit"
            text="Track"
            icon={<Search className="w-4 h-4" />}
            disabled={loading || !orderIdSearch.trim()}
            className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] px-4"
          />
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
        </div>
      )}

      {!loading && searched && error && (
        <EmptyState message="Something went wrong, please try again." isError />
      )}

      {!loading && searched && !error && orders.length === 0 && (
        <EmptyState message="No orders found with the information provided. Double-check and try again." />
      )}

      {!loading && orders.length > 0 && (
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            {orders.length} order{orders.length !== 1 ? 's' : ''} found
          </p>
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Initial state — no search done yet */}
      {!searched && !loading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-200 dark:bg-[#1f3334] rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Enter your email address or Order ID above to find your orders.
          </p>
        </div>
      )}
    </div>
  );
}