'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

interface ViewedPart {
  id: number;
  partName: string;
  price: number;
  imageUrl?: string;
  viewedAt: number;
}

interface RecentlyViewedContextType {
  viewedParts: ViewedPart[];
  addViewedPart: (part: { id: number; partName: string; price: number; imageUrl?: string }) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

const STORAGE_KEY = 'suzuki_bike_recently_viewed';
const MAX_ITEMS = 10;

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [viewedParts, setViewedParts] = useState<ViewedPart[]>([]);
  const { userId } = useAuth();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setViewedParts(parsed);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewedParts));
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  }, [viewedParts]);

  const addViewedPart = (part: { id: number; partName: string; price: number; imageUrl?: string }) => {
    setViewedParts((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== part.id);

      // Add to beginning
      const updated = [
        {
          ...part,
          viewedAt: Date.now(),
        },
        ...filtered,
      ];

      // Keep only latest 10
      return updated.slice(0, MAX_ITEMS);
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{ viewedParts, addViewedPart }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextType {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  }
  return context;
}
