'use client';

import React, { useState } from 'react';
import { useCart } from '@/components/cart/CartContext';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';

interface AddToCartProps {
  partId: number;
  partName: string;
  price: number;
  inStock: boolean;
}

export function AddToCart({ partId, partName, price, inStock }: AddToCartProps) {
  const { addItem, items } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInCart = items.some(item => item.partId === partId);
  const cartItem = items.find(item => item.partId === partId);

  const handleAddToCart = async () => {
    if (!inStock) {
      setError('This item is out of stock');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await addItem(partId, partName, price, 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  if (!inStock) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed opacity-60"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAddToCart}
        disabled={isLoading || showSuccess}
        className={`w-full px-4 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
          showSuccess
            ? 'bg-green-600 text-white'
            : isLoading
            ? 'bg-blue-400 text-white opacity-75 cursor-wait'
            : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800'
        }`}
      >
        {showSuccess ? (
          <>
            <Check className="h-5 w-5" />
            Added to Cart
          </>
        ) : isLoading ? (
          <>
            <ShoppingCart className="h-5 w-5 animate-pulse" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </button>

      {isInCart && (
        <div className="text-sm text-blue-600 dark:text-blue-400 text-center">
          {cartItem && `${cartItem.quantity} in cart`}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
