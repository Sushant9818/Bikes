import { Suspense } from 'react'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import OrderDetail from '@/components/admin/OrderDetail'
import { ApiError } from '@/lib/api-error'

type Params = { params: Promise<{ id: string }> }

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      items: {
        include: {
          part: true,
        },
      },
    },
  })
  if (!order) {
    throw new ApiError(404, 'Order not found')
  }
  return order
}

function OrderDetailLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#E60012]" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading order...</p>
      </div>
    </div>
  )
}

export default async function OrderDetailPage({ params }: Params) {
  const { id } = await params
  let order: any = undefined
  let error = null

  try {
    order = await getOrder(id)
  } catch (err) {
    error = err instanceof ApiError ? err.message : 'Failed to load order'
  }

  if (error) {
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
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Order Details</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Order #{order?.id}</p>
          </div>
        </div>
      </div>

      {/* Detail Content */}
      <Suspense fallback={<OrderDetailLoader />}>
        <OrderDetail order={order} />
      </Suspense>
    </div>
  )
}
