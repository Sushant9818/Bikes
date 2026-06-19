import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

const LOW_STOCK = 5

export function QuantityBadge({ value }) {
  const isLow = (value ?? 0) <= LOW_STOCK
  return (
    <span className="inline-flex items-center gap-2">
      {value ?? 0}
      {isLow && <Badge variant="destructive" className="text-xs">Low</Badge>}
    </span>
  )
}

export default function DataTable({
  columns,
  data,
  loading,
  emptyMessage = 'No data found.',
  showActions = true,
  onEdit,
  onDelete,
  isAdmin = false,
  onAddToCart,
  showAddToCart = false,
}) {
  const hasActions = (showActions && isAdmin) || showAddToCart

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              {hasActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
        <p className="text-zinc-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            {hasActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={row.id || idx}>
              {columns.map((col) => {
                const value = row[col.key]
                return (
                  <TableCell key={col.key}>
                    {col.render ? col.render(value, row) : value}
                  </TableCell>
                )
              })}
              {hasActions && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {showAddToCart && !isAdmin && onAddToCart && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onAddToCart(row)}
                      >
                        Add to Cart
                      </Button>
                    )}
                    {showActions && isAdmin && onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(row)}
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {showActions && isAdmin && onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row)}
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
