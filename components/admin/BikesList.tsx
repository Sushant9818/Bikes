'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit2, Trash2, Eye } from 'lucide-react'
import type { Vehicle } from '@prisma/client'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'

interface BikesListProps {
  bikes: Vehicle[]
}

export default function BikesList({ bikes }: BikesListProps) {
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  async function handleDelete(id: number) {
    try {
      setDeleting(id)
      const response = await fetch(`/api/admin/bikes/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete bike')
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete bike')
    } finally {
      setDeleting(null)
      setDeleteConfirmId(null)
    }
  }

  if (bikes.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">No bikes found. Start by adding a new bike.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Model
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {bikes.map((bike) => (
                <tr key={bike.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    {bike.modelName}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {bike.category || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    ₹{bike.price.toLocaleString()}
                    {bike.discountPrice && (
                      <span className="block text-xs text-green-600 dark:text-green-400 line-through">
                        ₹{bike.discountPrice.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bike.quantity > 10
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : bike.quantity > 0
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {bike.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bike.status === 'ACTIVE'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {bike.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/bikes/${bike.id}`}
                        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirmId(bike.id)}
                        disabled={deleting === bike.id}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteConfirmId !== null}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        title="Delete Bike"
        description="Are you sure you want to delete this bike? This action cannot be undone."
        isLoading={deleting !== null}
      />
    </>
  )
}
