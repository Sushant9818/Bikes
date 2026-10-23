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
import { Trash2, Eye } from 'lucide-react'
import type { Order } from '@prisma/client'

export function OrdersTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
        status,
      })
      const res = await fetch(`/api/admin/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const columnHelper = createColumnHelper<Order>()
  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Order ID',
        cell: (info) => `#${info.getValue()}`,
      }),
      columnHelper.accessor('customerName', {
        header: 'Customer',
        cell: (info) => (
          <div>
            <p className="font-medium">{info.getValue()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{info.row.original.email}</p>
          </div>
        ),
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Amount',
        cell: (info) => `₹${info.getValue().toLocaleString()}`,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          const colors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            SHIPPED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          }
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
              {status}
            </span>
          )
        },
      }),
      columnHelper.accessor('createdAt', {
        header: 'Date',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
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
    data: data?.orders || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <div className="text-center py-10">Loading orders...</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search customer name, email, phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
