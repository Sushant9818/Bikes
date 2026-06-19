import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-zinc-200', className)}
      {...props}
    />
  )
}

export { Skeleton }
