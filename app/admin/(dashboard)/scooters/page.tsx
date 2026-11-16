'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'

interface Scooter {
  id: number
  modelName: string
  price: number
  quantity: number
  status: string
  isFeatured: boolean
}

export default function ScootersPage() {
  const [scooters, setScooters] = useState<Scooter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchScooters = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/scooters?page=1')
      if (!res.ok) throw new Error('Failed to fetch scooters')
      const json = await res.json()
      setScooters(json.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load scooters. Please check your connection and try again.')
      setScooters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScooters()
  }, [])

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure? This cannot be undone.')) {
      try {
        const res = await fetch(`/api/admin/scooters/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setScooters(scooters.filter((s) => s.id !== id))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const columns: ColumnDef<Scooter>[] = [
    {
      accessorKey: 'modelName',
      header: 'Model Name',
      cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: (info) => `Rs. ${info.getValue()}`,
    },
    {
      accessorKey: 'quantity',
      header: 'Stock',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => (
        <Badge variant={info.getValue() === 'ACTIVE' ? 'default' : 'secondary'}>
          {info.getValue() as string}
        </Badge>
      ),
    },
    {
      accessorKey: 'isFeatured',
      header: 'Featured',
      cell: (info) => (
        <Badge variant={info.getValue() ? 'default' : 'secondary'}>
          {info.getValue() ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const id = info.row.original.id
        return (
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/admin/scooters/${id}`)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Scooters</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">Manage your Suzuki scooter inventory</p>
        </div>
        <Link
          href="/admin/scooters/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#E60012] text-white rounded-lg hover:bg-red-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Scooter
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <div className="text-red-600 dark:text-red-400 text-lg mt-0.5">⚠</div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Error Loading Scooters</h3>
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={() => fetchScooters()}
            className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {scooters.length === 0 && !error ? (
          <div className="p-8 text-center text-zinc-500">No scooters found</div>
        ) : (
          <DataTable columns={columns} data={scooters} />
        )}
      </div>
    </div>
  )
}
