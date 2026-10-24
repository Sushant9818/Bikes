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
  const router = useRouter()

  useEffect(() => {
    const fetchScooters = async () => {
      try {
        const res = await fetch('/api/admin/scooters?page=1')
        if (!res.ok) throw new Error('Failed to fetch scooters')
        const json = await res.json()
        setScooters(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

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
      cell: (info) => (info.getValue() ? '✓' : ''),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const scooter = info.row.original
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/scooters/${scooter.id}`)}
              className="dark:text-zinc-300"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(scooter.id)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  if (loading) return <LoadingSpinner label="Loading scooters..." />

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Scooters Management</h1>
        <Button asChild className="bg-[#E30613] hover:bg-[#C5000F]">
          <Link href="/admin/scooters/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Scooter
          </Link>
        </Button>
      </div>

      <DataTable data={scooters} columns={columns} searchPlaceholder="Search scooters..." />
    </div>
  )
}
