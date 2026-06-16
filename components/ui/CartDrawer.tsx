'use client';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NeoButton from './NeoButton';
import { formatPrice } from '@/lib/utils';
import { X, Trash2, ShoppingBag } from 'lucide-react';

export default function CartDrawer() {
  const { cart, updateQuantity, removeFromCart, totalPrice, clearCart, isOpen, closeCart } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[#051a1b] shadow-2xl z-50 flex flex-col border-l border-[#1f3334]"
          >
            <div className="flex justify-between items-center p-5 border-b border-[#1f3334]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Cart
                {cart.length > 0 && <span className="text-sm font-normal text-gray-500">({cart.length} items)</span>}
              </h2>
              <button onClick={closeCart} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-6">Your cart is empty</p>
                  <Link href="/products" onClick={closeCart}>
                    <NeoButton text="Browse Products"
                      className="mx-auto bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]" />
                  </Link>
                </div>
              ) : (
                cart.map(item => {
                  const itemKey = item.selectedSize ? `${item.id}__size_${item.selectedSize}` : item.id;
                  return (
                  <div key={itemKey} className="flex gap-3 border-b border-[#1f3334] pb-4">
                    <div className="relative w-18 h-18 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                      <Image src={item.featuredImage || item.images[0] || '/placeholder.png'} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      {item.selectedSize && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Size: {item.selectedSize}</p>
                      )}
                      <p className="text-green-500 font-bold text-sm">{formatPrice((item.discountPrice ?? item.price) * item.quantity)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-sm font-bold">−</button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-sm font-bold">+</button>
                        <button onClick={() => removeFromCart(itemKey)} className="ml-auto text-red-400 hover:text-red-600 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#1f3334] p-5 space-y-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Subtotal</span>
                  <span className="text-green-500">{formatPrice(totalPrice)}</span>
                </div>
                <Link href="/checkout" onClick={closeCart} className="block">
                  <NeoButton text="Proceed to Checkout" className="w-full
                    bg-[#d7ffa4] text-[#1a1a1a] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]
                    dark:bg-[#d7ffa4] dark:text-[#051a1b] dark:border-[#a8d678] dark:shadow-[3px_3px_0px_#a8d678]" />
                </Link>
                <button onClick={clearCart} className="w-full text-sm text-gray-500 hover:text-red-500 transition">Clear cart</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
