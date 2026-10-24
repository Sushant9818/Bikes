'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wrench, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DataTable from '@/components/DataTable'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'

interface Part {
  id: number
  type: string
  partName: string
  sku: string
  price: number
  quantity: number
  minStock: number
  status: string
  createdAt: string
}

export default function PartsPage() {
  const router = useRouter()
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null as Part | null })
  const [deleting, setDeleting] = useState(false)

  const pageSize = 10

  useEffect(() => {
    fetchParts()
  }, [search, filterType, page])

  const fetchParts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(filterType && { type: filterType }),
      })

      const response = await fetch(`/api/admin/parts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch parts')

      const data = await response.json()
      setParts(data.data)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching parts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (part: Part) => {
    router.push(`/admin/parts/${part.id}`)
  }

  const handleDelete = (part: Part) => {
    setDeleteDialog({ open: true, item: part })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.item) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/parts/${deleteDialog.item.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete part')

      setParts((prev) => prev.filter((p) => p.id !== deleteDialog.item!.id))
      setDeleteDialog({ open: false, item: null })
    } catch (error) {
      console.error('Error deleting part:', error)
      alert('Failed to delete part')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'partName',
      label: 'Part Name',
    },
    {
      key: 'sku',
      label: 'SKU',
    },
    {
      key: 'type',
      label: 'Category',
      render: (value: unknown) => (
        <Badge variant={value === 'BIKE_PART' ? 'default' : 'secondary'}>
          {value === 'BIKE_PART' ? 'Bike' : 'Scooter'}
        </Badge>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (value: unknown) => `Rs. ${Number(value).toFixed(2)}`,
    },
    {
      key: 'quantity',
      label: 'Stock',
      render: (value: unknown, row: Part) => {
        const isLow = (value as number) <= row.minStock
        return (
          <span className="inline-flex items-center gap-2">
            {value}
            {isLow && <Badge variant="destructive">Low</Badge>}
          </span>
        )
      },
    },
    {
      key: 'minStock',
      label: 'Min Stock',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => (
        <Badge variant={value === 'ACTIVE' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-[#E60012]" />
            Parts Management
          </h1>
          <Link href="/admin/parts/new">
            <Button className="bg-[#E60012] hover:bg-[#E60012]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Part
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="flex-1 px-4 py-2 border border-zinc-200 rounded-lg dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
          />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-zinc-200 rounded-lg dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
          >
            <option value="">All Categories</option>
            <option value="BIKE_PART">Bike Parts</option>
            <option value="SCOOTER_PART">Scooter Parts</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={parts}
        loading={loading}
        showActions
        isAdmin
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No parts found. Click 'Add Part' to create one."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-4">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}
        title="Delete Part"
        itemName={deleteDialog.item?.partName}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  )
}
