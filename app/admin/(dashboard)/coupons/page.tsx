'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Edit2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import CouponModal, { type CouponData } from '@/components/admin/CouponModal'

const PAGE_SIZE = 10
const EXPIRING_SOON_DAYS = 7

type StatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'exhausted'

interface CouponStatus {
  label: string
  filterKey: 'active' | 'expiring' | 'expired' | 'exhausted'
  className: string
}

function getCouponStatus(coupon: CouponData): CouponStatus {
  const now = new Date()

  if (coupon.maxUses !== null && coupon.maxUses !== undefined && (coupon.usesCount ?? 0) >= coupon.maxUses) {
    return {
      label: 'Exhausted',
      filterKey: 'exhausted',
      className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    }
  }

  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate)
    if (expiry.getTime() < now.getTime()) {
      return {
        label: 'Expired',
        filterKey: 'expired',
        className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
      }
    }
    const msUntilExpiry = expiry.getTime() - now.getTime()
    const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24)
    if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
      return {
        label: 'Expiring Soon',
        filterKey: 'expiring',
        className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
      }
    }
  }

  if (!coupon.isActive) {
    return {
      label: 'Inactive',
      filterKey: 'expired',
      className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    }
  }

  return {
    label: 'Active',
    filterKey: 'active',
    className: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  }
}

function formatDiscount(coupon: CouponData): string {
  if (coupon.discountFixed && coupon.discountFixed > 0) {
    return `₹${coupon.discountFixed.toLocaleString()}`
  }
  return `${coupon.discountPercent}%`
}

function formatDate(value?: string | Date | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<CouponData | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchCoupons = useCallback(async (pageNum: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/coupons?page=${pageNum}`)
      if (!res.ok) throw new Error('Failed to load coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoupons(page)
  }, [page, fetchCoupons])

  const visibleCoupons = useMemo(() => {
    if (statusFilter === 'all') return coupons
    return coupons.filter((c) => getCouponStatus(c).filterKey === statusFilter)
  }, [coupons, statusFilter])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedCoupon(null)
    setModalOpen(true)
  }

  const openEditModal = (coupon: CouponData) => {
    setModalMode('edit')
    setSelectedCoupon(coupon)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchCoupons(page)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/admin/coupons/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        let message = 'Failed to delete coupon'
        try {
          const data = await res.json()
          message = data.message || data.error || message
        } catch {
          // ignore
        }
        throw new Error(message)
      }
      setDeleteTarget(null)
      await fetchCoupons(page)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete coupon')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Coupons</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Manage discount coupons</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Create Coupon
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="exhausted">Exhausted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-zinc-600 dark:text-zinc-400">Loading coupons...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Error Loading Coupons</h3>
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={() => fetchCoupons(page)}
            className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden dark:border-zinc-800 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Min Order
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Uses / Max
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {visibleCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-zinc-600 dark:text-zinc-400">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  visibleCoupons.map((coupon) => {
                    const status = getCouponStatus(coupon)
                    return (
                      <tr key={coupon.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {coupon.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                          {formatDiscount(coupon)}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                          {coupon.minAmount ? `₹${coupon.minAmount.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                          {coupon.usesCount ?? 0} / {coupon.maxUses ?? '∞'}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                          {formatDate(coupon.expiryDate)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(coupon)}
                              aria-label={`Edit ${coupon.code}`}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(coupon)}
                              aria-label={`Delete ${coupon.code}`}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
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

          <div className="flex justify-between items-center">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * PAGE_SIZE >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <CouponModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        coupon={selectedCoupon}
        onSuccess={handleModalSuccess}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteError('')
          }
        }}
        title="Delete Coupon"
        itemName={deleteTarget?.code}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
      {deleteError && (
        <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
      )}
    </div>
  )
}
