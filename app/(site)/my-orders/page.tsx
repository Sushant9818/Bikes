'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatNPR } from '@/lib/currency'
import type { Order, OrderItem } from '@prisma/client'

type OrderWithItems = Order & { items: OrderItem[] }

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

  useEffect(() => {
    fetch('/api/orders/my')
      .then((res) => (res.ok ? res.json() : []))
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8"><div className="max-w-4xl mx-auto"><Skeleton className="h-8 w-48 mb-8" /><Skeleton className="h-64 w-full rounded-2xl" /></div></div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">My Orders</h1>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center"><p className="text-zinc-600 text-lg">You have no orders yet.</p></div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-zinc-900">Order #{order.id}</p>
                      <p className="text-sm text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={order.status === 'PAID' ? 'default' : order.status === 'PENDING' ? 'secondary' : 'destructive'}>{order.status}</Badge>
                      <p className="font-bold text-[#E60012]">{formatNPR(order.totalAmount)}</p>
                      <p className="text-sm text-zinc-500">{order.items.length} item(s)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order #{selectedOrder?.id}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <p><strong>Status:</strong> {selectedOrder.status}</p>
              <p><strong>Total:</strong> {formatNPR(selectedOrder.totalAmount)}</p>
              <ul className="divide-y divide-zinc-200">
                {selectedOrder.items.map((item) => (
                  <li key={item.id} className="py-2 flex justify-between">
                    <span>{item.partName} x {item.quantity}</span>
                    <span>{formatNPR(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}
