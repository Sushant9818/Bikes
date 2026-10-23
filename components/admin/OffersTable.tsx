'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Edit2 } from 'lucide-react'
import type { Offer } from '@prisma/client'

interface OfferWithStatus extends Offer {
  calculatedStatus: 'UPCOMING' | 'ACTIVE' | 'EXPIRED'
}

export function OffersTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['offers', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        status,
      })
      const res = await fetch(`/api/admin/offers?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const columnHelper = createColumnHelper<OfferWithStatus>()
  const columns: ColumnDef<OfferWithStatus>[] = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => (
          <div>
            <p className="font-medium">{info.getValue()}</p>
            {info.row.original.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                {info.row.original.description}
              </p>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('discountPercent', {
        header: 'Discount',
        cell: (info) => `${info.getValue()}%`,
      }),
      columnHelper.accessor((row) => {
        const start = new Date(row.startDate).toLocaleDateString()
        const end = new Date(row.endDate).toLocaleDateString()
        return `${start} – ${end}`
      }, {
        id: 'dateRange',
        header: 'Date Range',
      }),
      columnHelper.accessor('calculatedStatus', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          const colors = {
            ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            UPCOMING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          }
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
              {status}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      }),
    ],
    [columnHelper]
  )

  const table = useReactTable({
    data: data?.offers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return <div className="text-center py-10">Loading offers...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search offers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="flex-1"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden dark:border-gray-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {page} of {Math.ceil((data?.total || 0) / pageSize)}
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
            disabled={page * pageSize >= (data?.total || 0)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
