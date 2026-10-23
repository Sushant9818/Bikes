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
import { Trash2, Eye } from 'lucide-react'

interface Customer {
  id: number
  name: string | null
  email: string
  phone: string | null
  createdAt: Date
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  lastOrderDate: Date | null
}

export function CustomersTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
      })
      const res = await fetch(`/api/admin/customers?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const columnHelper = createColumnHelper<Customer>()
  const columns: ColumnDef<Customer>[] = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('email', {
        header: 'Email',
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('totalOrders', {
        header: 'Orders',
      }),
      columnHelper.accessor('totalSpent', {
        header: 'Total Spent',
        cell: (info) => `₹${info.getValue().toLocaleString()}`,
      }),
      columnHelper.accessor('lastOrderDate', {
        header: 'Last Order',
        cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : '—',
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
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
    data: data?.customers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <div className="text-center py-10">Loading customers...</div>

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name, email, or phone..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        className="max-w-md"
      />

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
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
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
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= (data?.total || 0)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
