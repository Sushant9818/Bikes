'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CustomerUpdate } from '@/lib/validations/customer'

interface CustomerDetailProps {
  id: number
  name: string | null
  email: string
  phone: string | null
  createdAt: Date
  stats: {
    totalOrders: number
    totalSpent: number
    avgOrderValue: number
    lastOrderDate: Date | null
  }
}

export default function CustomerDetail({ id, name, email, phone, createdAt, stats }: CustomerDetailProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: name || '',
    email: email,
    phone: phone || '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')

    try {
      const updateData: CustomerUpdate = {
        name: formData.name || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      }

      const response = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update customer')
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update customer'
      setError(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: name || '',
      email: email,
      phone: phone || '',
    })
    setIsEditing(false)
    setError('')
  }

  const handleRetry = () => {
    setError('')
  }

  const isFormChanged = formData.name !== (name || '') || formData.email !== email || formData.phone !== (phone || '')

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
          {/* Contact Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Contact Information</h2>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Full Name</p>
                  <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
                  <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{email}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Phone</p>
                  <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{phone || '—'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-600 dark:text-zinc-400">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                    placeholder="Enter phone"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !isFormChanged}
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

          {/* Account Information */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Customer ID</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">#{id}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Member Since</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Statistics */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Orders</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalOrders}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Spent</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">₹{stats.totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">₹{stats.avgOrderValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Last Order</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
