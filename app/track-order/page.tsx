'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrderByOrderId } from '@/lib/firebase/orders';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, Truck, Clock, XCircle } from 'lucide-react';
import NeoButton from '@/components/ui/NeoButton';
import Image from 'next/image';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Order Placed', color: 'text-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-500', icon: CheckCircle },
  processing: { label: 'Processing', color: 'text-purple-500', icon: Package },
  packed: { label: 'Packed', color: 'text-indigo-500', icon: Package },
  shipped: { label: 'Shipped', color: 'text-orange-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-500', icon: XCircle },
};

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];

function TrackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState(params.get('id') ?? '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!params.get('id'));
  const [notFound, setNotFound] = useState(false);

  const search = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    setNotFound(false);
    const result = await getOrderByOrderId(orderId.trim().toUpperCase());
    if (result) { setOrder(result); }
    else { setNotFound(true); setOrder(null); }
    setSearched(true);
    setLoading(false);
  };

  const currentStep = order ? STATUS_FLOW.indexOf(order.status as OrderStatus) : -1;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
      <p className="text-gray-500 mb-8">Enter your order ID to see live status</p>

      <div className="flex gap-3 mb-8">
        <input
          value={orderId}
          onChange={e => setOrderId(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Enter Order ID (e.g. AC1X2Y3Z)"
          className="flex-1 p-3 border border-[#1f3334] rounded-xl dark:bg-[#0b2a2b] outline-none focus:border-green-500 transition font-mono"
        />
        <NeoButton text={loading ? '...' : 'Track'} onClick={search} disabled={loading} icon={<Search className="w-4 h-4" />}
          className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
      </div>

      {notFound && (
        <div className="text-center py-12 border border-[#1f3334] rounded-2xl">
          <p className="text-2xl mb-2">😕</p>
          <p className="font-semibold">Order not found</p>
          <p className="text-sm text-gray-500 mt-1">Please check your order ID and try again</p>
        </div>
      )}

      {order && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Status Progress */}
          {order.status !== 'cancelled' && (
            <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
              <h2 className="font-bold mb-6">Order Progress</h2>
              <div className="relative">
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 dark:bg-gray-700" />
                <div
                  className="absolute top-5 left-5 h-0.5 bg-green-500 transition-all duration-1000"
                  style={{ width: `${currentStep >= 0 ? (currentStep / (STATUS_FLOW.length - 1)) * 100 : 0}%` }}
                />
                <div className="relative flex justify-between">
                  {STATUS_FLOW.map((status, i) => {
                    const { label, icon: Icon } = STATUS_CONFIG[status];
                    const done = i <= currentStep;
                    return (
                      <div key={status} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${done ? 'bg-green-500 border-green-500' : 'bg-white dark:bg-[#051a1b] border-gray-300 dark:border-gray-600'}`}>
                          <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <span className={`text-xs text-center w-14 ${done ? 'font-semibold text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="font-bold text-red-600">This order has been cancelled</p>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
            <h2 className="font-bold mb-4">Order Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><p className="text-gray-500">Order ID</p><p className="font-mono font-bold">{order.orderId}</p></div>
              <div><p className="text-gray-500">Date</p><p>{new Date(order.createdAt).toLocaleDateString('en-BD')}</p></div>
              <div><p className="text-gray-500">Customer</p><p>{order.customer.fullName}</p></div>
              <div><p className="text-gray-500">Phone</p><p>{order.customer.phone}</p></div>
            </div>
            <div className="text-sm border-t border-[#1f3334] pt-3">
              <p className="text-gray-500 mb-1">Delivery Address</p>
              <p>{order.customer.address}, {order.customer.area}, {order.customer.district}</p>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
            <h2 className="font-bold mb-4">Items Ordered</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1f3334] mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{formatPrice(order.deliveryCharge)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-green-600">{formatPrice(order.total)}</span></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return <Suspense fallback={<div />}><TrackContent /></Suspense>;
}
