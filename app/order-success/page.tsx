'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NeoButton from '@/components/ui/NeoButton';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('id');

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150 }}
      className="max-w-lg mx-auto text-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 bg-[#d7ffa4] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[#1a1a1a]"
      >
        <CheckCircle className="w-12 h-12 text-[#1a1a1a]" />
      </motion.div>

      <h1 className="text-4xl font-bold mb-3">Order Placed! 🎉</h1>
      <p className="text-gray-500 mb-6">Thank you for your order. We'll confirm it shortly via phone.</p>

      {orderId && (
        <div className="bg-gray-50 dark:bg-[#0b2a2b] border border-[#1f3334] rounded-2xl p-6 mb-8">
          <p className="text-sm text-gray-500 mb-1">Your Order ID</p>
          <p className="text-2xl font-bold tracking-wider text-green-600 dark:text-green-400">{orderId}</p>
          <p className="text-xs text-gray-400 mt-2">Save this to track your order</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderId && (
          <Link href={`/track-order?id=${orderId}`}>
            <NeoButton text="Track Order" icon={<Package className="w-4 h-4" />}
              className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
          </Link>
        )}
        <Link href="/products">
          <NeoButton text="Continue Shopping" icon={<ArrowRight className="w-4 h-4" />}
            className="bg-white text-black border-black shadow-none hover:shadow-[3px_3px_0px_black]
            dark:bg-transparent dark:text-gray-300 dark:border-[#1f3334]" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function OrderSuccessPage() {
  return <Suspense fallback={<div />}><SuccessContent /></Suspense>;
}
