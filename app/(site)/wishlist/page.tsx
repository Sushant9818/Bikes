'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, AlertCircle, Loader, Trash2, ShoppingCart } from 'lucide-react';

interface WishlistItem {
  id: string;
  partId: number;
  partName: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  createdAt: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/wishlist');
      return;
    }

    fetchWishlist();
  }, [isSignedIn, isLoaded, router]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (!response.ok) throw new Error('Failed to fetch wishlist');
      const data = await response.json();
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (partId: number) => {
    setRemovingId(partId);
    try {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId }),
      });

      if (!response.ok) throw new Error('Failed to remove item');
      setItems(items.filter(item => item.partId !== partId));
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (partId: number, partName: string, price: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, quantity: 1, price }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      // Optionally remove from wishlist after adding to cart
      await handleRemove(partId);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Loader className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <Loader className="h-12 w-12 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 mb-6">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchWishlist}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="h-8 w-8" fill="currentColor" />
              My Wishlist
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {items.length === 0 ? 'No items yet' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/parts"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Browse Parts
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">No items in wishlist</p>
            <Link
              href="/parts"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                {item.imageUrl && (
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.partName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {item.partName}
                    </h3>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                      ₹{item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item.partId, item.partName, item.price)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.partId)}
                      disabled={removingId === item.partId}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
