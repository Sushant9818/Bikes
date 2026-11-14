'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';

interface CartItem {
  id: string;
  partId: number;
  partName: string;
  quantity: number;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  totalPrice: number;
  addItem: (partId: number, partName: string, price: number, quantity: number) => Promise<void>;
  removeItem: (partId: number) => Promise<void>;
  updateQuantity: (partId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'suzuki_bike_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useAuth();

  // Initialize cart on mount
  useEffect(() => {
    if (userId) {
      loadAuthenticatedCart();
    } else {
      loadGuestCart();
    }
  }, [userId]);

  const loadGuestCart = () => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed.items || []);
      }
      setIsLoading(false);
    } catch {
      setItems([]);
      setIsLoading(false);
    }
  };

  const loadAuthenticatedCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('Failed to load cart');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading authenticated cart:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGuestCart = (updatedItems: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        items: updatedItems,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const addItem = async (partId: number, partName: string, price: number, quantity: number) => {
    if (userId) {
      // Authenticated user - persist to database
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, quantity, price }),
      });
      if (!response.ok) throw new Error('Failed to add item to cart');
      const data = await response.json();
      setItems(data.items);
    } else {
      // Guest user - persist to localStorage
      const existingItem = items.find(item => item.partId === partId);
      let updatedItems: CartItem[];
      if (existingItem) {
        updatedItems = items.map(item =>
          item.partId === partId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updatedItems = [...items, {
          id: `guest-${partId}-${Date.now()}`,
          partId,
          partName,
          quantity,
          price,
        }];
      }
      setItems(updatedItems);
      saveGuestCart(updatedItems);
    }
  };

  const removeItem = async (partId: number) => {
    if (userId) {
      // Authenticated user - delete from database
      const response = await fetch(`/api/cart/${partId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove item from cart');
      const data = await response.json();
      setItems(data.items);
    } else {
      // Guest user - remove from localStorage
      const updatedItems = items.filter(item => item.partId !== partId);
      setItems(updatedItems);
      saveGuestCart(updatedItems);
    }
  };

  const updateQuantity = async (partId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(partId);
      return;
    }

    if (userId) {
      // Authenticated user - update in database
      const response = await fetch(`/api/cart/${partId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to update cart item');
      const data = await response.json();
      setItems(data.items);
    } else {
      // Guest user - update in localStorage
      const updatedItems = items.map(item =>
        item.partId === partId
          ? { ...item, quantity }
          : item
      );
      setItems(updatedItems);
      saveGuestCart(updatedItems);
    }
  };

  const clearCart = async () => {
    if (userId) {
      // Authenticated user - clear from database
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear cart');
      setItems([]);
    } else {
      // Guest user - clear localStorage
      setItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isLoading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
