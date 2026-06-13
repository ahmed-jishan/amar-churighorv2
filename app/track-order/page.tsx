'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrderByOrderId } from '@/lib/firebase/orders';

function TrackRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('id');

  useEffect(() => {
    if (!orderId) return;
    getOrderByOrderId(orderId.trim().toUpperCase()).then(order => {
      if (order?.trackingToken) {
        router.replace(`/track/${order.trackingToken}`);
      } else {
        router.replace('/my-orders');
      }
    }).catch(() => {
      router.replace('/my-orders');
    });
  }, [orderId, router]);

  return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <div className="animate-pulse h-6 w-48 bg-[#1f3334] rounded mx-auto" />
      <p className="text-gray-500 text-sm mt-4">Redirecting to tracking page...</p>
    </div>
  );
}

export default function TrackOrderPage() {
  return <Suspense fallback={<div className="max-w-2xl mx-auto py-20 text-center text-gray-500">Loading...</div>}>
    <TrackRedirect />
  </Suspense>;
}