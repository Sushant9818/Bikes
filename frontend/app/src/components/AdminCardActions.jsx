import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

/**
 * Visible Edit / Delete controls for admin catalog cards.
 * Only render when parent passes handlers (admin catalog pages).
 */
export default function AdminCardActions({ onEdit, onDelete, className = '' }) {
  if (!onEdit && !onDelete) return null

  return (
    <div className={`flex gap-2 ${className}`}>
      {onEdit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl border-zinc-300 hover:border-[#E60012] hover:text-[#E60012]"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit()
          }}
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Edit
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Delete
        </Button>
      )}
    </div>
  )
}
