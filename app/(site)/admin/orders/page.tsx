'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import DataTable from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatNPR } from '@/lib/currency'
import type { Order, OrderItem } from '@prisma/client'

type OrderWithItems = Order & { items: OrderItem[] } & Record<string, unknown>

const STATUS_OPTIONS = ['PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'CANCELLED', 'PAYMENT_REVIEW', 'FAILED']

const COLUMNS = [
  { key: 'id', label: 'Order ID' },
  { key: 'customerName', label: 'Customer' },
  { key: 'totalAmount', label: 'Total', render: (v: unknown) => formatNPR(v as number) },
  {
    key: 'status',
    label: 'Status',
    render: (v: unknown) => {
      const variants: Record<string, string> = { PENDING: 'warning', PAID: 'success', CONFIRMED: 'success', SHIPPED: 'secondary', CANCELLED: 'destructive', PAYMENT_REVIEW: 'warning', FAILED: 'destructive' }
      return <Badge variant={(variants[v as string] as never) || 'default'}>{v as string}</Badge>
    },
  },
  { key: 'createdAt', label: 'Date', render: (v: unknown) => new Date(v as string).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/orders')
    setOrders(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await fetch(`/api/orders/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    fetchOrders()
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Orders</h1>
          <DataTable columns={COLUMNS} data={orders} loading={loading} emptyMessage="No orders found." showActions isAdmin onEdit={(row) => setSelectedOrder(row)} />
        </div>
      </div>

      {selectedOrder && (
        <Dialog open onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Order #{selectedOrder.id}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p><span className="text-zinc-600">Name:</span> {selectedOrder.customerName}</p>
                <p><span className="text-zinc-600">Phone:</span> {selectedOrder.phone}</p>
                {selectedOrder.email && <p><span className="text-zinc-600">Email:</span> {selectedOrder.email}</p>}
                <p><span className="text-zinc-600">Address:</span> {selectedOrder.address}</p>
              </div>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50"><tr><th className="px-4 py-2 text-left text-sm font-semibold text-zinc-600">Part</th><th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">Price</th><th className="px-4 py-2 text-center text-sm font-semibold text-zinc-600">Qty</th><th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">Total</th></tr></thead>
                  <tbody className="divide-y divide-zinc-200">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">{item.partName}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatNPR(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatNPR(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                <div>
                  <p className="text-sm text-zinc-600">Status</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => { handleStatusChange(selectedOrder.id, e.target.value); setSelectedOrder({ ...selectedOrder, status: e.target.value as Order['status'] }) }}
                    className="mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm font-semibold"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="text-right"><p className="text-sm text-zinc-600">Total</p><p className="text-2xl font-bold text-[#E60012]">{formatNPR(selectedOrder.totalAmount)}</p></div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Footer />
    </>
  )
}
