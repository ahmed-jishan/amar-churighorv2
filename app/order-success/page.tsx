'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NeoButton from '@/components/ui/NeoButton';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ClipboardList, ArrowRight, ShoppingBag, MapPin, Phone, Mail, Copy, Check, Share2, Clock, ChevronDown, Truck, CreditCard, AlertTriangle, Shield, Loader2, BadgeCheck } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import RewardCelebration from '@/components/loyalty/RewardCelebration';

// ── Order Summary Interface ───────────────────────────────────
interface OrderSummary {
  orderId: string;
  trackingToken?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    selectedSize?: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    district: string;
    area: string;
  };
  emailSentAt?: string;
  emailCustomerSuccess?: boolean;
  emailAdminSuccess?: boolean;
  /** Newly unlocked reward (set by checkout if applicable) */
  newlyUnlockedReward?: {
    couponCode: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    campaignName: string;
    expiresAt: string;
    milestone: number;
  } | null;
}

function formatPrice(amount: number): string {
  return `৳${amount.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

const STATUS_UI: Record<string, { label: string; color: string; dot: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-500' },
  confirmed: { label: 'Confirmed', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30', dot: 'bg-blue-500' },
  processing: { label: 'Processing', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30', dot: 'bg-purple-500' },
  packed: { label: 'Packed', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30', dot: 'bg-indigo-500' },
  shipped: { label: 'Shipped', color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  delivered: { label: 'Delivered', color: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-500' },
};

// ── What Happens Next Timeline ────────────────────────────────
const NEXT_STEPS = [
  {
    icon: '📞',
    title: 'Order Confirmation Call',
    description: 'We will call you within 24 hours to confirm your order details.',
    time: 'Within 24 hours',
  },
  {
    icon: '⚙️',
    title: 'Processing & Packing',
    description: 'Your items will be carefully packed and prepared for shipment.',
    time: '1-2 business days',
  },
  {
    icon: '🚚',
    title: 'Shipped',
    description: 'Your order will be dispatched to your delivery address.',
    time: '2-3 business days',
  },
  {
    icon: '🎉',
    title: 'Delivered!',
    description: 'Your package will arrive at your doorstep. Enjoy your purchase!',
    time: 'Estimated 3-5 business days',
  },
];

// ── Timeline Step Component ───────────────────────────────────
function TimelineStep({ step, index }: { step: typeof NEXT_STEPS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="flex gap-4"
    >
      {/* Connector line */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[#d7ffa4] flex items-center justify-center text-lg shrink-0 border-2 border-[#1a1a1a] dark:border-[#051a1b]">
          {step.icon}
        </div>
        {index < NEXT_STEPS.length - 1 && (
          <div className="w-[2px] flex-1 bg-gradient-to-b from-[#d7ffa4] to-transparent min-h-[40px]" />
        )}
      </div>
      {/* Content */}
      <div className="pb-8">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{step.title}</h4>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-xs">{step.description}</p>
        <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider text-[#d7ffa4] bg-[#051a1b] px-2 py-0.5 rounded-full font-medium">
          {step.time}
        </span>
      </div>
    </motion.div>
  );
}

// ── Email Status Banner ───────────────────────────────────────
function EmailStatusBanner({ email, sentAt, success, userDisabled }: { email: string; sentAt?: string; success?: boolean; userDisabled?: boolean }) {
  const [status, setStatus] = useState<'loading' | 'sent' | 'failed' | 'pending'>(success === true ? 'sent' : success === false ? 'failed' : 'loading');

  useEffect(() => {
    // If we have definitive status from sessionStorage, use it
    if (success === true) {
      setStatus('sent');
      return;
    }
    if (success === false) {
      setStatus('failed');
      return;
    }
    // Otherwise poll or wait briefly for the email to be reported
    const timer = setTimeout(() => {
      setStatus('pending');
    }, 3000);
    return () => clearTimeout(timer);
  }, [success]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`rounded-2xl p-4 border shadow-sm ${
        status === 'sent'
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
          : status === 'failed'
            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
            : 'bg-white dark:bg-[#0b2a2b] border-gray-200 dark:border-[#1f3334]'
      }`}
    >
      <div className="flex items-start gap-3">
        {status === 'loading' ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin mt-0.5 shrink-0" />
        ) : status === 'sent' ? (
          <BadgeCheck className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
        ) : status === 'failed' ? (
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        ) : (
          <Mail className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {status === 'loading' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sending confirmation email to{' '}
              <strong className="text-gray-700 dark:text-gray-200">{email}</strong>...
            </p>
          )}
          {status === 'sent' && (
            <div>
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                ✓ Confirmation email sent successfully
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-500/70 mt-0.5">
                To: {email}
              </p>
              {sentAt && (
                <p className="text-xs text-green-600/60 dark:text-green-500/60 mt-0.5">
                  Sent at: {formatDate(sentAt)}
                </p>
              )}
            </div>
          )}
          {status === 'failed' && (
            <div>
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                ⚠ Confirmation email could not be sent
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">
                Your order is confirmed. You can always check your order status on the My Orders page.
              </p>
            </div>
          )}
          {status === 'pending' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              A confirmation email will be sent to{' '}
              <strong className="text-gray-700 dark:text-gray-200">{email}</strong>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Content ──────────────────────────────────────────────
function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('id');
  const tokenParam = params.get('token');
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [accessError, setAccessError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load order summary from sessionStorage (set by checkout page)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('lastOrder');
      if (stored) {
        const parsed = JSON.parse(stored) as OrderSummary;
        if (parsed.orderId === orderId) {
          setOrderSummary(parsed);
        } else {
          // Order ID mismatch — secure access enforcement
          setAccessError(true);
        }
      } else {
        // No stored order — direct access without checkout flow
        setAccessError(true);
      }
    } catch {
      setAccessError(true);
    } finally {
      setLoaded(true);
    }
  }, [orderId]);

  // Clear sessionStorage after a short delay so the page can read it
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        sessionStorage.removeItem('lastOrder');
      } catch {}
    }, 30000); // 30 seconds grace period for page refreshes
    return () => clearTimeout(timer);
  }, []);

  const trackingToken = tokenParam || orderSummary?.trackingToken;

  const handleCopyOrderId = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      toast.success('Order ID copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareWhatsApp = () => {
    if (!orderId) return;
    const text = `I just placed an order on Amar Churighor! 🎉\n\nOrder ID: ${orderId}\nTrack: ${window.location.origin}/track-order?id=${orderId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyTrackingLink = () => {
    if (!orderId) return;
    const url = `${window.location.origin}/track-order?id=${orderId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Tracking link copied!');
    });
  };

  // ── Access Denied / Direct Access ──────────────────────────
  if (loaded && accessError) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#051a1b] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
            className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Shield className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Order Information Protected
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            This order page can only be viewed immediately after placing an order.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            To view your orders anytime, use the My Orders page with your email address or Order ID.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/my-orders">
              <NeoButton
                text="My Orders"
                icon={<ClipboardList className="w-4 h-4" />}
                className="bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] dark:bg-[#d7ffa4] dark:text-[#051a1b] dark:border-[#a8d678] dark:shadow-[3px_3px_0px_#a8d678]"
              />
            </Link>
            <Link href="/products">
              <NeoButton
                text="Continue Shopping"
                icon={<ArrowRight className="w-4 h-4" />}
                className="bg-white dark:bg-transparent text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#1f3334] shadow-[3px_3px_0px_#d1d5db] dark:shadow-[3px_3px_0px_#1f3334]"
              />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Loading State ──────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#051a1b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#d7ffa4] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your order details...</p>
        </div>
      </div>
    );
  }

  const statusKey = orderSummary?.status || 'pending';
  const statusUI = STATUS_UI[statusKey] || STATUS_UI.pending;

  return (
    <div className="min-h-screen bg-white dark:bg-[#051a1b]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#d7ffa4] to-[#c5f090] dark:from-[#0d3d3e] dark:to-[#051a1b]">
        <div className="max-w-2xl mx-auto px-4 pt-16 pb-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="w-20 h-20 bg-[#1a1a1a] dark:bg-[#d7ffa4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 text-[#d7ffa4] dark:text-[#051a1b]" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold text-[#1a1a1a] dark:text-white mb-2"
          >
            Order Placed Successfully! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-700 dark:text-gray-300 text-sm md:text-base"
          >
            Thank you for your order, {orderSummary?.customer?.fullName || ''}!
          </motion.p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-20 space-y-4">
        {/* Order ID Card with Status & Date */}
        {orderId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#051a1b] flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold font-mono text-[#1a1a1a] dark:text-[#d7ffa4] tracking-wide">
                      {orderId}
                    </p>
                    <button
                      onClick={handleCopyOrderId}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1f3334] transition-colors"
                      title="Copy Order ID"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyTrackingLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#1f3334] text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a4546] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-xs text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            </div>

            {/* Status + Date Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-[#1f3334]">
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium capitalize ${statusUI.color}`}>
                <span className={`w-2 h-2 rounded-full ${statusUI.dot}`} />
                {statusUI.label}
              </div>
              {/* Order Date */}
              {orderSummary?.createdAt && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Ordered on {formatDate(orderSummary.createdAt)}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Email Status - show disabled banner when user email is off by admin config */}
        {orderSummary?.customer?.email && (
          (orderSummary as any).emailUserDisabled ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    Email Service Unavailable
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-1">
                    Email notification service is currently unavailable due to system maintenance. 
                    Your order has been placed successfully. Please save your Tracking ID below to track your order.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                      ID: {orderId}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(orderId || '');
                        toast.success('Order ID copied!');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <EmailStatusBanner
              email={orderSummary.customer.email}
              sentAt={orderSummary.emailSentAt}
              success={orderSummary.emailCustomerSuccess}
            />
          )
        )}

        {/* Order Summary */}
        {orderSummary && orderSummary.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-5 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#1f3334] transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-500" />
                Order Summary ({orderSummary.items.length} item{orderSummary.items.length > 1 ? 's' : ''})
              </span>
              <motion.span
                animate={{ rotate: showDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.span>
            </button>

            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-gray-200 dark:border-[#1f3334]">
                  {/* Items */}
                  <div className="space-y-3 pt-4">
                    {orderSummary.items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                          {item.selectedSize && <p className="text-[11px] text-gray-400">Size: {item.selectedSize}</p>}
                          <p className="text-xs text-gray-500 dark:text-gray-400">×{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="border-t border-gray-200 dark:border-[#1f3334] mt-4 pt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span>{formatPrice(orderSummary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Delivery Charge</span>
                      <span>{formatPrice(orderSummary.deliveryCharge)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-[#1f3334] pt-3 mt-3 text-gray-900 dark:text-gray-100">
                      <span>Total</span>
                      <span className="text-green-600 dark:text-[#d7ffa4]">{formatPrice(orderSummary.total)}</span>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#051a1b] p-3 rounded-xl">
                    <CreditCard className="w-3.5 h-3.5" />
                    Payment method: <strong className="text-gray-700 dark:text-gray-200">Cash on Delivery</strong>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Customer Info */}
        {orderSummary?.customer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-5 shadow-sm"
          >
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Delivery Address
            </h3>
            <div className="space-y-1.5 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-200">{orderSummary.customer.fullName}</p>
              <p className="text-gray-500 dark:text-gray-400">
                {orderSummary.customer.address}, {orderSummary.customer.area}, {orderSummary.customer.district}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-500 dark:text-gray-400 pt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {orderSummary.customer.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {orderSummary.customer.email}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Reward Celebration ── */}
        {orderSummary?.newlyUnlockedReward && (
          <RewardCelebration
            couponCode={orderSummary.newlyUnlockedReward.couponCode}
            discountType={orderSummary.newlyUnlockedReward.discountType}
            discountValue={orderSummary.newlyUnlockedReward.discountValue}
            campaignName={orderSummary.newlyUnlockedReward.campaignName}
            expiresAt={orderSummary.newlyUnlockedReward.expiresAt}
            milestone={orderSummary.newlyUnlockedReward.milestone}
          />
        )}

        {/* What Happens Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-white dark:bg-[#0b2a2b] border border-gray-200 dark:border-[#1f3334] rounded-2xl p-5 shadow-sm"
        >
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            What Happens Next?
          </h3>
          <div className="space-y-0">
            {NEXT_STEPS.map((step, i) => (
              <TimelineStep key={i} step={step} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <Link href={`/track-order?id=${orderId}`} className="flex-1">
            <NeoButton
              text="Track My Order"
              icon={<Truck className="w-4 h-4" />}
              className="w-full bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]
                dark:bg-[#d7ffa4] dark:text-[#051a1b] dark:border-[#a8d678] dark:shadow-[3px_3px_0px_#a8d678]"
            />
          </Link>
          <Link href="/my-orders" className="flex-1">
            <NeoButton
              text="My Orders"
              icon={<ClipboardList className="w-4 h-4" />}
              className="w-full bg-white dark:bg-transparent text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#1f3334] shadow-[3px_3px_0px_#d1d5db] dark:shadow-[3px_3px_0px_#1f3334]"
            />
          </Link>
          <Link href="/products" className="flex-1">
            <NeoButton
              text="Continue Shopping"
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full bg-white dark:bg-transparent text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#1f3334] shadow-[3px_3px_0px_#d1d5db] dark:shadow-[3px_3px_0px_#1f3334]"
            />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#051a1b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-[#d7ffa4] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}