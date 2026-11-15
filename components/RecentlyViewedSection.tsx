'use client';

import React from 'react';
import Link from 'next/link';
import { useRecentlyViewed } from './RecentlyViewedProvider';
import { Clock } from 'lucide-react';

export function RecentlyViewedSection() {
  const { viewedParts } = useRecentlyViewed();

  if (viewedParts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-8">
          <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recently Viewed</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {viewedParts.map((part) => (
            <Link
              key={part.id}
              href={`/parts/${part.id}`}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg dark:hover:shadow-lg dark:shadow-gray-900 transition-shadow">
                {part.imageUrl && (
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <img
                      src={part.imageUrl}
                      alt={part.partName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                    {part.partName}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-2">
                    ₹{part.price.toFixed(0)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
