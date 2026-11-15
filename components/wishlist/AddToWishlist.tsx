'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Heart, AlertCircle } from 'lucide-react';

interface AddToWishlistProps {
  partId: number;
  partName: string;
}

export function AddToWishlist({ partId, partName }: AddToWishlistProps) {
  const { userId } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWishlistStatus();
  }, [partId, userId]);

  const checkWishlistStatus = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/wishlist');
      if (!response.ok) return;
      const data = await response.json();
      const isWishlisted = data.items.some((item: any) => item.partId === partId);
      setIsInWishlist(isWishlisted);
    } catch {
      // Silently fail
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      setError('Please sign in to save items');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isInWishlist) {
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partId }),
        });
        if (!response.ok) throw new Error('Failed to remove from wishlist');
        setIsInWishlist(false);
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partId }),
        });
        if (!response.ok) throw new Error('Failed to add to wishlist');
        setIsInWishlist(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggleWishlist}
        disabled={isLoading}
        className={`w-full px-4 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
          isInWishlist
            ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
        {isInWishlist ? 'Saved' : 'Save to Wishlist'}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
