'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchFiltersProps {
  onSearch: (params: {
    q: string
    category: string
    minPrice: number
    maxPrice: number
    minRating: number
  }) => void
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100000)
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    onSearch({
      q: query,
      category,
      minPrice,
      maxPrice,
      minRating,
    })
  }

  const handleReset = () => {
    setQuery('')
    setCategory('ALL')
    setMinPrice(0)
    setMaxPrice(100000)
    setMinRating(0)
    onSearch({
      q: '',
      category: 'ALL',
      minPrice: 0,
      maxPrice: 100000,
      minRating: 0,
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 mb-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by part name or SKU..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="BIKE_PART">Bike Parts</option>
              <option value="SCOOTER_PART">Scooter Parts</option>
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Price: Rs {minPrice.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={minPrice}
              onChange={(e) => setMinPrice(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Price: Rs {maxPrice.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Min Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Rating: {minRating > 0 ? `${minRating.toFixed(1)}★` : 'All'}
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="0">All Ratings</option>
              <option value="1">1+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
