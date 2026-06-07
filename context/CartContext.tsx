'use client';
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { CartItem, Product } from '@/types';
import toast from 'react-hot-toast';

type CartAction =
  | { type: 'ADD'; product: Product }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE'; id: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; cart: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const idx = state.findIndex(i => i.id === action.product.id);
      if (idx !== -1) {
        const next = [...state];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...state, { ...action.product, quantity: 1 }];
    }
    case 'REMOVE': return state.filter(i => i.id !== action.id);
    case 'UPDATE':
      if (action.quantity <= 0) return state.filter(i => i.id !== action.id);
      return state.map(i => i.id === action.id ? { ...i, quantity: action.quantity } : i);
    case 'CLEAR': return [];
    case 'LOAD': return action.cart;
    default: return state;
  }
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, sourceEl?: HTMLElement) => void;
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

  function flyAnimation(sourceEl: HTMLElement) {
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    const rect = sourceEl.getBoundingClientRect();
    Object.assign(clone.style, {
      position: 'fixed', zIndex: '9999', width: '60px', height: '60px',
      borderRadius: '50%', objectFit: 'cover', pointerEvents: 'none',
      top: `${rect.top}px`, left: `${rect.left}px`, transition: 'none',
    });
    document.body.appendChild(clone);
    const cartEl = document.querySelector('#cart-target');
    const cartRect = cartEl?.getBoundingClientRect() ?? { top: 16, left: window.innerWidth - 60 };
    clone.animate([
      { transform: 'scale(1)', top: `${rect.top}px`, left: `${rect.left}px`, opacity: 1 },
      { transform: 'scale(0.15)', top: `${cartRect.top}px`, left: `${cartRect.left}px`, opacity: 0 },
    ], { duration: 650, easing: 'cubic-bezier(0.25,0.46,0.45,0.94)', fill: 'forwards' });
    setTimeout(() => clone.remove(), 700);
  }

  const addToCart = (product: Product, sourceEl?: HTMLElement) => {
    if (sourceEl) flyAnimation(sourceEl);
    const exists = cart.find(i => i.id === product.id);
    toast.success(exists ? `+1 ${product.name}` : `${product.name} added!`, {
      icon: exists ? '🛒' : '🎉',
      style: { background: '#d7ffa4', color: '#1a1a1a', border: '2px solid #1a1a1a', borderRadius: '12px', fontWeight: '600' },
    });
    dispatch({ type: 'ADD', product });
  };

  const removeFromCart = (id: string) => {
    const item = cart.find(i => i.id === id);
    if (item) toast(`${item.name} removed`, { icon: '🗑️' });
    dispatch({ type: 'REMOVE', id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    dispatch({ type: 'UPDATE', id, quantity });
  };

  const clearCart = () => {
    toast('Cart cleared', { icon: '🧹' });
    dispatch({ type: 'CLEAR' });
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

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
