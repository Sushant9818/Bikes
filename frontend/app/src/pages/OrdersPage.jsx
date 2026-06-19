import { useState, useEffect } from 'react'
import * as ordersApi from '@/api/orders'
import Footer from '@/components/Footer'
import DataTable from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatNPR } from '@/utils/currency'

const COLUMNS = [
  { key: 'id', label: 'Order ID' },
  { key: 'customerName', label: 'Customer' },
  {
    key: 'totalAmount',
    label: 'Total',
    render: (v) => (v != null ? formatNPR(v) : '-'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (v) => {
      const variants = {
        PENDING: 'warning',
        PAID: 'success',
        CONFIRMED: 'success',
        SHIPPED: 'secondary',
        CANCELLED: 'destructive',
        PAYMENT_REVIEW: 'warning',
        FAILED: 'destructive',
      }
      return <Badge variant={variants[v] || 'default'}>{v || 'PENDING'}</Badge>
    },
  },
  {
    key: 'createdAt',
    label: 'Date',
    render: (v) => {
      if (!v) return '-'
      return new Date(v).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await ordersApi.getOrders()
      setOrders(data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus)
      toast.success('Order status updated')
      fetchOrders()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const openDetails = (order) => {
    setSelectedOrder(order)
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Orders</h1>
          </div>

          <DataTable
            columns={COLUMNS}
            data={orders}
            loading={loading}
            emptyMessage="No orders found."
            showActions={true}
            isAdmin={true}
            onEdit={openDetails}
          />
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-zinc-900 mb-2">Customer Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-zinc-600">Name:</span> {selectedOrder.customerName}</p>
                  <p><span className="text-zinc-600">Phone:</span> {selectedOrder.phone}</p>
                  {selectedOrder.email && (
                    <p><span className="text-zinc-600">Email:</span> {selectedOrder.email}</p>
                  )}
                  <p><span className="text-zinc-600">Address:</span> {selectedOrder.address}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-zinc-900 mb-2">Order Items</h3>
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-600">Part</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">Price</th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-zinc-600">Qty</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-zinc-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm">{item.partName}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatNPR(item.price)}</td>
                          <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            {formatNPR(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                <div>
                  <p className="text-sm text-zinc-600">Status</p>
                  <select
                    value={selectedOrder.status || 'PENDING'}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className="mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="PAYMENT_REVIEW">PAYMENT_REVIEW</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-600">Total Amount</p>
                  <p className="text-2xl font-bold text-[#E60012]">
                    {formatNPR(selectedOrder.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <Footer />
    </>
  )
}
