import { Skeleton as UISkeleton } from './ui/skeleton'

export default function Skeleton({ rows = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: rows * 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <UISkeleton className="h-48 w-full" />
          <div className="p-5 space-y-2">
            <UISkeleton className="h-4 w-3/4" />
            <UISkeleton className="h-4 w-1/2" />
            <UISkeleton className="h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
