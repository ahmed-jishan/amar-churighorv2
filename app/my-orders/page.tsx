'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import { getAnonymousId } from '@/lib/anonymousUser';
import { motion } from 'framer-motion';
import NeoButton from '@/components/ui/NeoButton';
import Link from 'next/link';
import { Package, ShoppingBag, Copy, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  packed: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  shipped: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
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
    <div className="bg-[#0b2a2b] border border-[#1f3334] rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-[#1f3334] rounded" />
        <div className="h-5 w-16 bg-[#1f3334] rounded-full" />
      </div>
      <div className="h-3 w-32 bg-[#1f3334] rounded mb-3" />
      <div className="h-3 w-20 bg-[#1f3334] rounded" />
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
        className="w-24 h-24 bg-[#1f3334] rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Package className="w-12 h-12 text-gray-500" />
      </motion.div>
      <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">
        You haven't placed any orders yet. Start exploring our collection!
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
      className="bg-[#0b2a2b] border border-[#1f3334] rounded-2xl p-5 hover:border-green-500/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{STATUS_ICONS[order.status]}</span>
            <button
              onClick={handleCopyOrderId}
              className="font-mono text-[#d7ffa4] text-sm font-medium hover:underline flex items-center gap-1"
            >
              {order.orderId}
              {copiedId ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-gray-500" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
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

      <div className="flex items-center justify-between text-sm mt-4 pt-3 border-t border-[#1f3334]">
        <span className="text-gray-400">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </span>
        <span className="font-bold text-[#d7ffa4]">
          {formatPrice(order.total)}
        </span>
      </div>

      <Link
        href={`/track/${order.trackingToken || ''}`}
        className="mt-3 flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-[#1f3334] text-sm text-gray-300 hover:bg-[#2a4546] transition-colors"
      >
        Track Order
        <ChevronRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const anonId = getAnonymousId();
        if (!anonId || anonId.startsWith('ssr_')) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'orders'),
          where('anonymousId', '==', anonId),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as Order));
        setOrders(items);
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const anonId = getAnonymousId();
      const q = query(
        collection(db, 'orders'),
        where('anonymousId', '==', anonId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as Order));
      setOrders(prev => [...prev, ...items]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load more orders:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-500 text-sm mb-8">Your order history</p>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-1">My Orders</h1>
        <p className="text-gray-500 text-sm mb-8">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

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

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 rounded-xl bg-[#1f3334] text-sm text-gray-300 hover:bg-[#2a4546] transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Orders'}
          </button>
        </div>
      )}
    </div>
  );
}