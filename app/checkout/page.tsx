'use client';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@/lib/validators/checkout';
import { createOrder } from '@/lib/firebase/orders';
import { getStoreConfig, StoreConfig } from '@/lib/firebase/settings';
import { formatPrice, DISTRICTS } from '@/lib/utils';
import Image from 'next/image';
import NeoButton from '@/components/ui/NeoButton';
import { MapPin, Phone, User, Mail, FileText, Loader2, CheckCircle2, Lock, PartyPopper, Award, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerRewardsPanel from '@/components/loyalty/CustomerRewardsPanel';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isDhaka, setIsDhaka] = useState(true);
  const submitLockRef = useRef(false);
  const redirectRef = useRef(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);

  useEffect(() => {
    getStoreConfig().then(setStoreConfig);
  }, []);

  const district = watch('district');
  const deliveryCharge = district === 'Dhaka'
    ? (storeConfig?.deliveryChargeInside ?? 80)
    : (storeConfig?.deliveryChargeOutside ?? 130);
  const grandTotal = totalPrice + deliveryCharge;

  const [redirected, setRedirected] = useState(false);
  useEffect(() => {
    if (cart.length === 0 && !redirected) {
      setRedirected(true);
      router.push('/products');
    }
  }, [cart.length, redirected, router]);

  if (cart.length === 0) return null;

  const onSubmit = async (data: CheckoutFormData) => {
    // Prevent duplicate submissions
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);

    try {
      const orderItems = cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.discountPrice ?? item.price,
        quantity: item.quantity,
        image: item.featuredImage || item.images[0] || '',
        selectedSize: item.selectedSize,
      }));

      const { orderId, trackingToken } = await createOrder({
        customer: data,
        items: orderItems,
        subtotal: totalPrice,
        deliveryCharge,
        total: grandTotal,
        status: 'pending',
      });

      // Save full order data for the success page in sessionStorage
      const orderSummary = {
        orderId,
        trackingToken,
        items: orderItems,
        subtotal: totalPrice,
        deliveryCharge,
        total: grandTotal,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        customer: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          altPhone: data.altPhone || '',
          address: data.address,
          district: data.district,
          area: data.area,
        },
      };
      sessionStorage.setItem('lastOrder', JSON.stringify(orderSummary));

      // Mark order as complete — modal transitions to success state
      setOrderComplete(true);

      // Send email via the notify-order API (customer confirmation + admin notification)
      // This is fire-and-forget — never fails the order placement
      const paymentMethod = 'Cash on Delivery';
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          trackingToken,
          email: data.email,
          customerName: data.fullName,
          customerPhone: data.phone,
          customerAltPhone: data.altPhone || undefined,
          total: grandTotal,
          items: orderItems.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            selectedSize: item.selectedSize,
          })),
          subtotal: totalPrice,
          deliveryCharge,
          district: data.district,
          area: data.area,
          address: data.address,
          notes: data.notes || undefined,
          paymentMethod,
          orderStatus: 'pending',
        }),
      })
        .then(res => res.json())
        .then(result => {
          if (!result.success) {
            console.warn('Email notification failed:', result.error);
          } else if (result.details) {
            // Store email status in sessionStorage for success page
            try {
              const stored = sessionStorage.getItem('lastOrder');
              if (stored) {
                const parsed = JSON.parse(stored);
                parsed.emailSentAt = result.emailSentAt || new Date().toISOString();
                parsed.emailCustomerSuccess = result.details.customer?.success ?? false;
                parsed.emailAdminSuccess = result.details.admin?.success ?? false;
                sessionStorage.setItem('lastOrder', JSON.stringify(parsed));
              }
            } catch {}
            if (!result.details.customer.success) {
              console.warn('Customer email failed:', result.details.customer.error);
            }
            if (!result.details.admin.success) {
              console.warn('Admin notification failed:', result.details.admin.error);
            }
          }
        })
        .catch(err => console.warn('Email send error (non-blocking):', err));

      clearCart();

      // Wait 1.5 seconds so the user sees the success animation, then redirect
      setTimeout(() => {
        if (redirectRef.current) return;
        redirectRef.current = true;
        router.push(`/order-success?id=${orderId}&token=${trackingToken}`);
      }, 1500);
    } catch (e: any) {
      toast.error(e.message || 'Failed to place order. Please try again.', {
        duration: 6000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '12px',
          fontWeight: '600',
        },
      });
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <>
      {/* Processing Overlay */}
      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-[#0b2a2b] rounded-3xl border border-gray-200 dark:border-[#1f3334] p-8 md:p-10 mx-4 max-w-sm w-full shadow-2xl text-center"
            >
              {/* Animated icon */}
              <motion.div
                animate={orderComplete ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
                className="relative w-20 h-20 mx-auto mb-5"
              >
                {orderComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                  >
                    <PartyPopper className="w-10 h-10 text-white" />
                  </motion.div>
                ) : (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-[#1f3334]" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#d7ffa4] animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-[#d7ffa4]/10 flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-[#d7ffa4] animate-spin" />
                    </div>
                  </>
                )}
              </motion.div>

              <motion.h3
                key={orderComplete ? 'done' : 'processing'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-lg font-bold mb-1 ${
                  orderComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {orderComplete ? 'Order Confirmed! 🎉' : 'Placing Your Order'}
              </motion.h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {orderComplete
                  ? 'Your order has been placed successfully.'
                  : 'Please wait while we process your order securely.'}
              </p>

              {/* Processing steps */}
              <div className="space-y-3 text-left">
                {[
                  { label: 'Validating information', done: orderComplete || true },
                  { label: 'Reserving stock', done: orderComplete || true },
                  { label: 'Creating your order', done: orderComplete, loading: !orderComplete },
                  { label: 'Sending confirmation', done: orderComplete, pending: !orderComplete },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      step.done
                        ? 'bg-green-500 scale-100'
                        : step.loading
                          ? 'bg-[#d7ffa4] scale-100'
                          : 'bg-gray-200 dark:bg-[#1f3334] scale-90'
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : step.loading ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#051a1b] animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <span className={`text-sm transition-colors duration-300 ${
                      step.done
                        ? 'text-green-600 dark:text-green-400 font-medium'
                        : step.loading
                          ? 'text-gray-900 dark:text-gray-100 font-medium'
                          : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Success summary — shown briefly before redirect */}
              {orderComplete && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 pt-4 border-t border-gray-200 dark:border-[#1f3334]"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Redirecting to your order details...
                  </p>
                </motion.div>
              )}

              {/* Secure badge */}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Lock className="w-3 h-3" />
                Secured with end-to-end encryption
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Checkout</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Personal Info */}
              <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-4 md:p-6">
                <h2 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2"><User className="w-4 h-5 md:w-5 h-5" />Personal Information</h2>
                <div className="grid gap-4">
                  <div>
                    <input {...register('fullName')} placeholder="Full Name *"
                      className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition" />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <input {...register('email')} type="email" placeholder="Email Address *"
                      className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input {...register('phone')} placeholder="Phone Number *"
                        className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition" />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <div>
                      <input {...register('altPhone')} placeholder="Alternate Phone (optional)"
                        className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition" />
                      {errors.altPhone && <p className="text-red-500 text-xs mt-1">{errors.altPhone.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-4 md:p-6">
                <h2 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" />Delivery Address</h2>
                <div className="grid gap-4">
                  <div>
                    <textarea {...register('address')} rows={3} placeholder="Full Address (House, Road, Block) *"
                      className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition resize-none" />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <select {...register('district')}
                        className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition">
                        <option value="">Select District *</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
                    </div>
                    <div>
                      <input {...register('area')} placeholder="Area / Thana *"
                        className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition" />
                      {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards (auto-detected when email+phone filled) */}
              <RewardsSection email={watch('email')} phone={watch('phone')} />

              {/* Notes */}
              <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-4 md:p-6">
                <h2 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2"><FileText className="w-5 h-5" />Order Notes</h2>
                <textarea {...register('notes')} rows={3} placeholder="Any special instructions? (optional)"
                  className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition resize-none" />
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-4 md:p-6 sticky top-24">
                <h2 className="font-bold text-base md:text-lg mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  {cart.map(item => {
                    const itemKey = item.selectedSize ? `${item.id}__size_${item.selectedSize}` : item.id;
                    return (
                    <div key={itemKey} className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        <Image src={item.featuredImage || item.images[0] || '/placeholder.png'} alt={item.name} width={48} height={48} className="object-cover" />
                      </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      {item.selectedSize && <p className="text-[10px] text-gray-400">Size: {item.selectedSize}</p>}
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                      <p className="text-sm font-bold text-green-600 shrink-0">{formatPrice((item.discountPrice ?? item.price) * item.quantity)}</p>
                    </div>
                    );
                  })}
                </div>
                <div className="border-t border-[#1f3334] pt-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
                  <div className="flex justify-between"><span>Delivery Charge</span><span>{formatPrice(deliveryCharge)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-[#1f3334] pt-2 mt-2">
                    <span>Total</span><span className="text-green-600 dark:text-green-400">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 dark:bg-[#051a1b] p-3 rounded-xl">
                  💳 Payment method: <strong>Cash on Delivery</strong>
                </div>
                <NeoButton
                  type="submit"
                  text={submitting ? 'Placing Order...' : 'Place Order'}
                  disabled={submitting}
                  className="w-full mt-4
                    bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]
                    dark:bg-[#d7ffa4] dark:text-[#051a1b] dark:border-[#a8d678] dark:shadow-[3px_3px_0px_#a8d678]"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Rewards Section: auto-detects rewards when email+phone are filled ──
function RewardsSection({ email, phone }: { email: string; phone: string }) {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedEmail, setDebouncedEmail] = useState('');
  const [debouncedPhone, setDebouncedPhone] = useState('');

  // Debounce email+phone to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmail(email);
      setDebouncedPhone(phone);
    }, 800);
    return () => clearTimeout(timer);
  }, [email, phone]);

  useEffect(() => {
    if (!debouncedEmail || !debouncedPhone) {
      setRewards([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/loyalty/customer-rewards?email=${encodeURIComponent(debouncedEmail)}&phone=${encodeURIComponent(debouncedPhone)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setRewards(data.success ? data.rewards : []);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) { setRewards([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [debouncedEmail, debouncedPhone]);

  if (!rewards.length && !loading) return null;

  return (
    <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-4 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-5 text-[#d7ffa4]" />
        <h2 className="font-bold text-base md:text-lg">Available Rewards</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Reward coupons found for this email & phone. Apply below to save on this order.
      </p>
      <CustomerRewardsPanel
        rewards={rewards}
        loading={loading}
        checkoutMode={false}
        email={email}
        phone={phone}
      />
    </div>
  );
}
