'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Order } from '@prisma/client'

interface OrderDetailProps {
  order: Order
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  SHIPPED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const statusOptions = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED']

export default function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(order.status)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update status')
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update status'
      setError(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedStatus(order.status)
    setIsEditing(false)
    setError('')
  }

  const handleRetry = () => {
    setError('')
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-800 whitespace-nowrap"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="space-y-6">
          {/* Order Header */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Order Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Order ID</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">#{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Amount</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">₹{order.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Customer Name</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Phone</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{order.phone}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Date</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Status</h3>
            </div>

            {!isEditing ? (
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[order.status]}`}>
                  {order.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || selectedStatus === order.status}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
