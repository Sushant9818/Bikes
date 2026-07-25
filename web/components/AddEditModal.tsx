import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AddEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  loading?: boolean
  submitLabel?: string
}

export default function AddEditModal({
  open, onOpenChange, title, onSubmit, children, loading, submitLabel = 'Save',
}: AddEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#E60012] hover:bg-[#C5000F]">
              {loading ? 'Saving...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
