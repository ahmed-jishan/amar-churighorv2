'use client';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@/lib/validators/checkout';
import { createOrder } from '@/lib/firebase/orders';
import { formatPrice, DISTRICTS, DELIVERY_CHARGE } from '@/lib/utils';
import Image from 'next/image';
import NeoButton from '@/components/ui/NeoButton';
import { MapPin, Phone, User, FileText } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [isDhaka, setIsDhaka] = useState(true);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const district = watch('district');
  const deliveryCharge = district === 'Dhaka' ? DELIVERY_CHARGE.inside_dhaka : DELIVERY_CHARGE.outside_dhaka;
  const grandTotal = totalPrice + deliveryCharge;

  if (cart.length === 0) {
    router.push('/products');
    return null;
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setSubmitting(true);
    try {
      const orderId = await createOrder({
        customer: data,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.discountPrice ?? item.price,
          quantity: item.quantity,
          image: item.featuredImage || item.images[0] || '',
        })),
        subtotal: totalPrice,
        deliveryCharge,
        total: grandTotal,
        status: 'pending',
      });
      clearCart();
      router.push(`/order-success?id=${orderId}`);
    } catch (e) {
      alert('Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><User className="w-5 h-5" />Personal Information</h2>
              <div className="grid gap-4">
                <div>
                  <input {...register('fullName')} placeholder="Full Name *"
                    className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition" />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
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
            <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" />Delivery Address</h2>
              <div className="grid gap-4">
                <div>
                  <textarea {...register('address')} rows={3} placeholder="Full Address (House, Road, Block) *"
                    className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition resize-none" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
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

            {/* Notes */}
            <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText className="w-5 h-5" />Order Notes</h2>
              <textarea {...register('notes')} rows={3} placeholder="Any special instructions? (optional)"
                className="w-full p-3 border border-[#1f3334] rounded-xl dark:bg-[#051a1b] outline-none focus:border-green-500 transition resize-none" />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#0b2a2b] rounded-2xl border border-[#1f3334] p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <Image src={item.featuredImage || item.images[0] || '/placeholder.png'} alt={item.name} width={48} height={48} className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">{formatPrice((item.discountPrice ?? item.price) * item.quantity)}</p>
                  </div>
                ))}
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
  );
}
