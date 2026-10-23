'use client'

import { Suspense } from 'react'
import { AppointmentsTable } from '@/components/admin/AppointmentsTable'

export const metadata = {
  title: 'Appointments - Admin',
}

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appointments</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage service appointments</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AppointmentsTable />
      </Suspense>
    </div>
  )
}
