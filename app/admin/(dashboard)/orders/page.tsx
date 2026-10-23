'use client'

import { Suspense } from 'react'
import { OrdersTable } from '@/components/admin/OrdersTable'

export const metadata = {
  title: 'Orders - Admin',
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage customer orders</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <OrdersTable />
      </Suspense>
    </div>
  )
}
