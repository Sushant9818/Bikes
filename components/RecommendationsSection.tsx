'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Part {
  id: number;
  partName: string;
  imageUrl: string | null;
  price: number;
  avgRating: number;
  purchaseCount: number;
}

export default function RecommendationsSection() {
  const [recommendations, setRecommendations] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/recommendations?limit=8');
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Recommended For You
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Popular items from the Suzuki Bike community
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((part) => (
            <Link key={part.id} href={`/parts/${part.id}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                {/* Image */}
                <div className="relative bg-gray-100 dark:bg-gray-700 aspect-square overflow-hidden">
                  {part.imageUrl ? (
                    <Image
                      src={part.imageUrl}
                      alt={part.partName}
                      fill
                      className="object-cover hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      No image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                    {part.partName}
                  </h3>

                  {/* Rating */}
                  {part.avgRating > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < Math.round(part.avgRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {part.avgRating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Popularity badge */}
                  {part.purchaseCount > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {part.purchaseCount} purchased
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-auto">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₹{part.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
