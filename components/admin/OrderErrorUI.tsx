'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface OrderErrorUIProps {
  error: string
  orderId: string
}

export default function OrderErrorUI({ error, orderId }: OrderErrorUIProps) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Order Details</h1>
      </div>

      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-red-900 dark:text-red-200">Error</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-800 whitespace-nowrap"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    </div>
  )
}
