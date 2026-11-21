'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, Edit2 } from 'lucide-react'

interface LowStockPart {
  id: number
  partName: string
  sku: string
  quantity: number
  minStock: number
  price: number
  type: string
}

interface InventoryStats {
  totalLowStock: number
  outOfStock: number
  criticallyLow: number
}

export default function InventoryAlerts() {
  const [parts, setParts] = useState<LowStockPart[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [updateValues, setUpdateValues] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/inventory-alerts')
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      setParts(data.parts)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickUpdate = async (partId: number) => {
    const newQty = parseInt(updateValues[partId] || '0')
    if (isNaN(newQty) || newQty < 0) {
      alert('Enter valid quantity')
      return
    }

    setUpdating(partId)
    try {
      const response = await fetch('/api/admin/inventory-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, quantity: newQty }),
      })

      if (!response.ok) throw new Error('Failed to update')
      setUpdateValues({ ...updateValues, [partId]: '' })
      fetchAlerts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading inventory alerts...</div>
  }

  return (
    <div>
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Out of Stock</p>
            <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.outOfStock}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Items with 0 quantity</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">Critically Low</p>
            <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.criticallyLow}</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">Below 50% of min stock</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">Low Stock</p>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.totalLowStock}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">Total items below min</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Part Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">SKU</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Current</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Min Required</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {parts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                    All parts are well stocked!
                  </td>
                </tr>
              ) : (
                parts.map((part) => {
                  const percentage = (part.quantity / part.minStock) * 100
                  const isOutOfStock = part.quantity === 0
                  const isCritical = part.quantity <= part.minStock / 2

                  return (
                    <tr
                      key={part.id}
                      className={
                        isOutOfStock
                          ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20'
                          : isCritical
                            ? 'bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                            : 'bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                      }
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {part.partName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{part.sku}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {part.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {part.minStock}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200">
                            <AlertTriangle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200">
                            <AlertCircle className="w-3 h-3" />
                            Critical ({percentage.toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200">
                            <AlertCircle className="w-3 h-3" />
                            Low ({percentage.toFixed(0)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={updateValues[part.id] || ''}
                            onChange={(e) => setUpdateValues({ ...updateValues, [part.id]: e.target.value })}
                            placeholder="New qty"
                            min="0"
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white text-sm"
                          />
                          <button
                            onClick={() => handleQuickUpdate(part.id)}
                            disabled={updating === part.id}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
                            title="Update quantity"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
