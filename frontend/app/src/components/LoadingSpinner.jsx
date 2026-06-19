import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoadingSpinner({ className, label }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className="w-10 h-10 text-[#E60012] animate-spin" aria-hidden />
      {label && <p className="text-sm text-zinc-500">{label}</p>}
    </div>
  )
}
