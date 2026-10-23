'use client'

import { Suspense } from 'react'
import { CustomersTable } from '@/components/admin/CustomersTable'

export const metadata = {
  title: 'Customers - Admin',
}

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage customer profiles</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <CustomersTable />
      </Suspense>
    </div>
  )
}
