'use client'

import { useEffect, useState } from 'react'
import { Star, Trash2, AlertCircle } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'

interface Review {
  id: string
  rating: number
  title: string
  content?: string
  createdAt: string
  user: {
    username: string
    avatar?: string
  }
}

interface ReviewsListProps {
  partId: number
}

export default function ReviewsList({ partId }: ReviewsListProps) {
  const { userId } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [partId])

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/reviews?partId=${partId}`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setReviews(data.reviews)
      setAverageRating(data.averageRating)
      setReviewCount(data.reviewCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return

    setDeletingId(reviewId)
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete review')
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      setReviewCount((prev) => prev - 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading reviews...</div>
  }

  return (
    <div>
      {/* Rating Summary */}
      {reviewCount > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</div>
              <div className="flex gap-1 mt-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{review.user.username}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                        />
                      ))}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{review.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {userId && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={deletingId === review.id}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete review"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              {review.content && (
                <p className="text-gray-700 dark:text-gray-300 mt-3">{review.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
