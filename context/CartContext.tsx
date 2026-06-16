'use client';
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { CartItem, Product } from '@/types';
import toast from 'react-hot-toast';

type CartAction =
  | { type: 'ADD'; product: Product; selectedSize?: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE'; id: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; cart: CartItem[] };

/** Generate a unique cart item key from product id and optional selected size */
function cartItemKey(id: string, selectedSize?: number): string {
  return selectedSize ? `${id}__size_${selectedSize}` : id;
}

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const key = cartItemKey(action.product.id, action.selectedSize);
      const idx = state.findIndex(i => cartItemKey(i.id, i.selectedSize) === key);
      if (idx !== -1) {
        const next = [...state];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...state, { ...action.product, quantity: 1, selectedSize: action.selectedSize }];
    }
    case 'REMOVE': return state.filter(i => cartItemKey(i.id, i.selectedSize) !== action.id);
    case 'UPDATE': {
      // action.id can be composite key or simple id - check both
      const targetIdx = state.findIndex(i => cartItemKey(i.id, i.selectedSize) === action.id || i.id === action.id);
      if (targetIdx === -1) return state;
      if (action.quantity <= 0) return state.filter((_, idx) => idx !== targetIdx);
      // Safety check: ensure total across all sizes doesn't exceed available stock
      const target = state[targetIdx];
      const available = target.availableStock ?? target.stock ?? 0;
      const otherSizesQty = state
        .filter(i => i.id === target.id && i !== target)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (otherSizesQty + action.quantity > available) return state;
      const next = [...state];
      next[targetIdx] = { ...target, quantity: action.quantity };
      return next;
    }
    case 'CLEAR': return [];
    case 'LOAD': return action.cart;
    default: return state;
  }
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, sourceEl?: HTMLElement, selectedSize?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ac_cart');
    if (saved) {
      try { dispatch({ type: 'LOAD', cart: JSON.parse(saved) }); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ac_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, sourceEl?: HTMLElement, selectedSize?: number) => {
    const available = product.availableStock ?? product.stock ?? 0;
    const itemKey = cartItemKey(product.id, selectedSize);
    const existingItem = cart.find(i => cartItemKey(i.id, i.selectedSize) === itemKey);
    // Calculate total quantity of THIS product across ALL sizes in cart
    const totalQtyOfThisProduct = cart
      .filter(i => i.id === product.id)
      .reduce((sum, i) => sum + i.quantity, 0);
    if (totalQtyOfThisProduct >= available) {
      toast.error(`Only ${available} items available in total. You already have ${totalQtyOfThisProduct} in cart.`, {
        style: { background: '#fee2e2', color: '#991b1b', borderRadius: '12px', fontWeight: '600' },
      });
      return;
    }
    const sizeLabel = selectedSize ? ` (Size: ${selectedSize})` : '';
    toast.success(existingItem ? `+1 ${product.name}${sizeLabel}` : `${product.name}${sizeLabel} added!`, {
      icon: existingItem ? '🛒' : '🎉',
      style: { background: '#d7ffa4', color: '#1a1a1a', border: '2px solid #1a1a1a', borderRadius: '12px', fontWeight: '600' },
    });
    dispatch({ type: 'ADD', product, selectedSize });
  };

  const removeFromCart = (id: string) => {
    const item = cart.find(i => cartItemKey(i.id, i.selectedSize) === id || i.id === id);
    if (item) {
      const sizeLabel = item.selectedSize ? ` (Size: ${item.selectedSize})` : '';
      toast(`${item.name}${sizeLabel} removed`, { icon: '🗑️' });
    }
    dispatch({ type: 'REMOVE', id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    const item = cart.find(i => cartItemKey(i.id, i.selectedSize) === id || i.id === id);
    if (item) {
      const available = item.availableStock ?? item.stock ?? 0;
      // Calculate total quantity of OTHER sizes (excluding this specific cart entry)
      const otherSizesQty = cart
        .filter(i => i.id === item.id && cartItemKey(i.id, i.selectedSize) !== id)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (otherSizesQty + quantity > available) {
        toast.error(`Only ${available} items available in total. You already have ${otherSizesQty} in other sizes.`, {
          style: { background: '#fee2e2', color: '#991b1b', borderRadius: '12px', fontWeight: '600' },
        });
        return;
      }
    }
    dispatch({ type: 'UPDATE', id, quantity });
  };

  const clearCart = () => {
    toast('Cart cleared', { icon: '🧹' });
    dispatch({ type: 'CLEAR' });
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems, totalPrice, isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
