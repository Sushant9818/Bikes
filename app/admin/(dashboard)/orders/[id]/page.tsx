import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import OrderDetail from '@/components/admin/OrderDetail'
import { ApiError } from '@/lib/api-error'
import type { Order } from '@prisma/client'
import OrderErrorUI from '@/components/admin/OrderErrorUI'

type Params = { params: Promise<{ id: string }> }

async function getOrder(id: string): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
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
  let order: Order | null = null
  let error: string | null = null

  try {
    order = await getOrder(id)
  } catch (err) {
    error = err instanceof ApiError ? err.message : 'Failed to load order'
  }

  if (error) {
    return <OrderErrorUI error={error} orderId={id} />
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
        <OrderDetail order={order!} />
      </Suspense>
    </div>
  )
}
