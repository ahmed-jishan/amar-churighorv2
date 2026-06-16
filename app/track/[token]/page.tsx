'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import NeoButton from '@/components/ui/NeoButton';
import {
  Package,
  Clock,
  MapPin,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';

// ── Constants ────────────────────────────────────────────────
const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
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

// ── Helpers ───────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusIndex(status: OrderStatus): number {
  if (status === 'cancelled') return -1;
  return STATUS_ORDER.indexOf(status);
}

function getEstimatedDelivery(currentStatus: OrderStatus): string {
  switch (currentStatus) {
    case 'pending':
      return 'We will confirm your order within 24 hours.';
    case 'confirmed':
      return 'Your order is being prepared. Estimated 2–3 business days for delivery.';
    case 'processing':
      return 'Your order is being processed. Estimated 2–3 business days for delivery.';
    case 'packed':
      return 'Your order has been packed. Estimated 1–2 business days for delivery.';
    case 'shipped':
      return 'Your order is on its way! Estimated delivery within 24 hours.';
    case 'delivered':
      return 'Your order has been delivered. Thank you for shopping with us!';
    case 'cancelled':
      return 'This order has been cancelled.';
    default:
      return '';
  }
}

// ── Skeleton ──────────────────────────────────────────────────
function TrackingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-[#1f3334] rounded mb-4" />
      <div className="h-4 w-32 bg-gray-200 dark:bg-[#1f3334] rounded mb-8" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#1f3334]" />
            <div className="h-4 flex-1 bg-gray-200 dark:bg-[#1f3334] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Error State ──────────────────────────────────────────────
function TrackingError() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto text-center py-20 px-4"
    >
      <motion.div
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <AlertCircle className="w-20 h-20 mx-auto mb-6 text-red-500 dark:text-red-400" />
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Order Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        We couldn't find an order with this tracking link. It may have expired or been removed.
        Tracking links are valid for 7 days after order placement.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/my-orders">
          <NeoButton
            text="My Orders"
            icon={<ShoppingBag className="w-4 h-4" />}
            className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
          />
        </Link>
        <Link href="/contact">
          <NeoButton
            text="Contact Support"
            icon={<Package className="w-4 h-4" />}
            className="bg-white dark:bg-transparent text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#1f3334] shadow-[3px_3px_0px_#d1d5db] dark:shadow-none"
          />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Status Timeline Step ──────────────────────────────────────
function TimelineStep({
  status,
  currentIndex,
  stepIndex,
  isLast,
}: {
  status: OrderStatus;
  currentIndex: number;
  stepIndex: number;
  isLast: boolean;
}) {
  const isCompleted = currentIndex > stepIndex || status === 'delivered';
  const isActive = currentIndex === stepIndex;
  const isCancelled = currentIndex === -1;

  return (
    <div className="flex items-start gap-3">
      {/* Indicator */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={false}
          animate={{
            scale: isActive ? [1, 1.15, 1] : 1,
            backgroundColor: isCompleted
              ? '#16a34a'
              : isActive
              ? '#d7ffa4'
              : isCancelled && stepIndex === 0
              ? '#ef4444'
              : '#9ca3af', // gray-400 for light mode circle bg
          }}
          transition={isActive ? { repeat: Infinity, duration: 2 } : { duration: 0.3 }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        >
          {isCompleted ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-white"
            >
              <Check className="w-4 h-4" />
            </motion.span>
          ) : (
            <span className={isActive ? 'text-[#051a1b]' : 'text-white dark:text-gray-500'}>
              {STATUS_ICONS[status]}
            </span>
          )}
        </motion.div>
        {!isLast && (
          <div
            className={`w-[2px] h-10 ${
              isCompleted ? 'bg-green-600' : 'bg-gray-300 dark:bg-[#1f3334]'
            }`}
          />
        )}
      </div>
      {/* Label */}
      <div className="pt-1.5">
        <p
          className={`text-sm font-medium ${
            isCompleted
              ? 'text-green-600 dark:text-green-400'
              : isActive
              ? 'text-green-600 dark:text-[#d7ffa4]'
              : 'text-gray-500'
          }`}
        >
          {STATUS_LABELS[status]}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function TrackOrderPage() {
  const params = useParams();
  const token = params.token as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch order by tracking token
  const fetchOrder = useCallback(async () => {
    if (!token) return;
    try {
      const q = query(
        collection(db, 'orders'),
        where('trackingToken', '==', token),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setError(true);
        setLoading(false);
        return;
      }
      const data = snap.docs[0].data() as Order;
      // Check expiry
      if (data.trackingTokenExpiry && Date.now() > data.trackingTokenExpiry) {
        setError(true);
        setLoading(false);
        return;
      }
      setOrder({ ...data, id: snap.docs[0].id });
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [token]);

  // Initial fetch + realtime snapshot
  useEffect(() => {
    if (!token) return;
    fetchOrder();

    // Realtime listener — poll via snapshot on token query
    // Note: Firestore security rules prevent direct onSnapshot with token query,
    // so we use a poll-based approach with the manual fetch function.
    // A better approach would be an admin-privileged API route, but for UX
    // simplicity we poll every 15 seconds.
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [token, fetchOrder]);

  // Share/Clipboard
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Tracking link copied!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  if (loading) return <TrackingSkeleton />;
  if (error || !order) return <TrackingError />;

  const currentIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600 dark:text-[#d7ffa4]" />
              Track Order
            </h1>
            <p className="font-mono text-sm text-gray-500 dark:text-gray-400 mt-1">
              {order.orderId}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#1f3334] text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a4546] transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Share
            </button>
            <button
              onClick={fetchOrder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#1f3334] text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a4546] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDate(order.createdAt)}
          </span>
          <span>
            Total: <strong className="text-green-600 dark:text-[#d7ffa4]">{formatPrice(order.total)}</strong>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isCancelled
              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
              : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
          }`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
      </motion.div>

      {/* Status Timeline */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-6 mb-6"
      >
        {isCancelled ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm">❌</span>
            </div>
            <p className="text-red-700 dark:text-red-400 font-medium">This order has been cancelled.</p>
          </div>
        ) : (
          STATUS_ORDER.map((s, i) => (
            <TimelineStep
              key={s}
              status={s}
              currentIndex={currentIndex}
              stepIndex={i}
              isLast={i === STATUS_ORDER.length - 1}
            />
          ))
        )}
      </motion.div>

      {/* Estimated Delivery */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-4 mb-6 text-sm text-gray-700 dark:text-gray-300"
      >
        <span className="text-gray-500 dark:text-gray-400">📬 </span>
        {getEstimatedDelivery(order.status)}
      </motion.div>

      {/* Order Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-6 mb-6"
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Order Items ({order.items.length})
        </h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-[#1f3334] last:border-0 last:pb-0">
              {item.image && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                    {item.selectedSize && <p className="text-xs text-gray-400">Size: {item.selectedSize}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400">×{item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900 dark:text-gray-100">{formatPrice(item.price * item.quantity)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{formatPrice(item.price)} each</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Delivery Info (privacy-safe) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-6 mb-6"
      >
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Delivery Location
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {order.customer.area}, {order.customer.district}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Full address hidden for privacy
        </p>
      </motion.div>

      {/* Status History Log */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1f3334] transition-colors"
          >
            <span>Status History ({order.statusHistory.length})</span>
            <motion.span
              animate={{ rotate: showHistory ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-200 dark:border-[#1f3334] divide-y divide-gray-200 dark:divide-[#1f3334]">
                  {[...order.statusHistory]
                    .reverse()
                    .map((entry, i) => (
                      <div key={i} className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{STATUS_ICONS[entry.status]}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{entry.status}</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}