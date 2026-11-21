'use client'

import { useState, useEffect } from 'react'
import { Star, Trash2, AlertCircle } from 'lucide-react'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'

interface Review {
  id: string
  rating: number
  title: string
  content?: string
  createdAt: string
  user: {
    username: string
    email: string
  }
  part: {
    id: number
    partName: string
  }
}

export default function ReviewsTable() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null as Review | null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [page])

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/reviews?page=${page}`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setReviews(data.reviews)
      setTotalPages(data.pagination.totalPages)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.item) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/reviews/${deleteDialog.item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete review')

      setReviews((prev) => prev.filter((r) => r.id !== deleteDialog.item!.id))
      setDeleteDialog({ open: false, item: null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading reviews...</div>
  }

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Rating</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= Math.round(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rating Distribution</p>
            <div className="space-y-1 text-sm">
              {[5, 4, 3, 2, 1].map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="w-6 text-gray-600 dark:text-gray-400">{r}★</span>
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${stats.ratingDistribution[r] ? (stats.ratingDistribution[r] / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-600 dark:text-gray-400">{stats.ratingDistribution[r] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Part</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Rating</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                    No reviews found
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {review.part.partName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div>
                        <p className="font-medium">{review.title}</p>
                        {review.content && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">{review.content}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div>
                        <p className="font-medium">{review.user.username}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{review.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setDeleteDialog({ open: true, item: review })}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete review"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-2 px-4">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}
        title="Delete Review"
        message={`Delete review by ${deleteDialog.item?.user.username}: "${deleteDialog.item?.title}"?`}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
