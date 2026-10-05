'use client'

import { useEffect, useState } from 'react'
import { Plus, Bike as BikeIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DataTable from '@/components/DataTable'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import { useToast } from '@/lib/hooks/use-toast'

interface Bike {
  id: number
  modelName: string
  brand: string
  price: number
  discountPrice: number | null
  year: number | null
  quantity: number
  status: string
  isFeatured: boolean
  isNewArrival: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function BikesPage() {
  const { toast } = useToast()
  const [bikes, setBikes] = useState<Bike[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    modelName: '',
    brand: 'Suzuki',
    price: '',
    discountPrice: '',
    year: '',
    quantity: '',
    imageUrl: '',
    description: '',
    category: '',
    status: 'ACTIVE',
    isFeatured: false,
    isNewArrival: false,
    seoTitle: '',
    seoDescription: '',
  })

  // Fetch bikes
  useEffect(() => {
    fetchBikes()
  }, [pagination.page, search, status])

  async function fetchBikes() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
        status,
      })

      const response = await fetch(`/api/admin/bikes?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bikes')

      const result = await response.json()
      setBikes(result.data)
      setPagination(result.pagination)
    } catch (error) {
      console.error('Error fetching bikes:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch bikes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      modelName: '',
      brand: 'Suzuki',
      price: '',
      discountPrice: '',
      year: '',
      quantity: '',
      imageUrl: '',
      description: '',
      category: '',
      status: 'ACTIVE',
      isFeatured: false,
      isNewArrival: false,
      seoTitle: '',
      seoDescription: '',
    })
  }

  async function handleAddBike(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        year: formData.year ? parseInt(formData.year) : null,
        quantity: parseInt(formData.quantity) || 0,
      }

      if (selectedBike) {
        // Update existing bike
        const response = await fetch(`/api/admin/bikes/${selectedBike.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to update bike')
        }

        toast({
          title: 'Success',
          description: 'Bike updated successfully',
        })
      } else {
        // Create new bike
        const response = await fetch('/api/admin/bikes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to create bike')
        }

        toast({
          title: 'Success',
          description: 'Bike created successfully',
        })
      }

      setAddModalOpen(false)
      setEditModalOpen(false)
      setSelectedBike(null)
      resetForm()
      setPagination({ ...pagination, page: 1 })
      await fetchBikes()
    } catch (error) {
      console.error('Error saving bike:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save bike',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(bike: Bike) {
    setSelectedBike(bike)
    setFormData({
      modelName: bike.modelName,
      brand: bike.brand,
      price: bike.price.toString(),
      discountPrice: bike.discountPrice?.toString() || '',
      year: bike.year?.toString() || '',
      quantity: bike.quantity.toString(),
      imageUrl: '',
      description: '',
      category: '',
      status: bike.status,
      isFeatured: bike.isFeatured,
      isNewArrival: bike.isNewArrival,
      seoTitle: '',
      seoDescription: '',
    })
    setEditModalOpen(true)
  }

  function handleDeleteClick(bike: Bike) {
    setSelectedBike(bike)
    setDeleteDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!selectedBike) return
    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/bikes/${selectedBike.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete bike')
      }

      toast({
        title: 'Success',
        description: 'Bike deleted successfully',
      })

      setDeleteDialogOpen(false)
      await fetchBikes()
    } catch (error) {
      console.error('Error deleting bike:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete bike',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: 'modelName',
      label: 'Model Name',
      render: (value: unknown) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'brand',
      label: 'Brand',
    },
    {
      key: 'price',
      label: 'Price',
      render: (value: unknown) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value: unknown, row: Bike) => {
        const qty = Number(value)
        const isLow = qty <= 5
        return (
          <span className={isLow ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {qty}
            {isLow && ' (Low)'}
          </span>
        )
      },
    },
    {
      key: 'year',
      label: 'Year',
      render: (value: unknown) => value || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            value === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400'
          }`}
        >
          {value}
        </span>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <BikeIcon className="w-8 h-8 text-[#E60012]" />
          Bikes
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Manage motorcycle inventory</p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination({ ...pagination, page: 1 })
              }}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPagination({ ...pagination, page: 1 })
            }}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Add Bike Button */}
        <Button
          onClick={() => {
            resetForm()
            setAddModalOpen(true)
          }}
          className="bg-[#E60012] hover:bg-[#C5000F] gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Bike
        </Button>
      </div>

      {/* Data Table */}
      <DataTable<Bike>
        columns={columns}
        data={bikes}
        loading={loading}
        emptyMessage="No bikes found. Create one to get started."
        showActions={true}
        isAdmin={true}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} bikes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddEditModal
        open={addModalOpen || editModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(false)
          setEditModalOpen(false)
          if (!open) {
            setSelectedBike(null)
          }
        }}
        title={selectedBike ? 'Edit Bike' : 'Add New Bike'}
        onSubmit={handleAddBike}
        loading={submitting}
        submitLabel={selectedBike ? 'Update' : 'Create'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Model Name *
            </label>
            <Input
              type="text"
              value={formData.modelName}
              onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              placeholder="e.g., GSX-R1000"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Price *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Discount Price
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                placeholder="0.00"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Year
              </label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2024"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Quantity
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Category
            </label>
            <Input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Sport, Cruiser"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm"
              disabled={submitting}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                disabled={submitting}
                className="rounded"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                disabled={submitting}
                className="rounded"
              />
              New Arrival
            </label>
          </div>
        </div>
      </AddEditModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Bike"
        itemName={selectedBike?.modelName}
        onConfirm={handleConfirmDelete}
        loading={submitting}
      />
    </div>
  )
}
