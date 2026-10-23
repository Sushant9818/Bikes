'use client'

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { OffersTable } from '@/components/admin/OffersTable'
import Link from 'next/link'

export const metadata = {
  title: 'Offers - Admin',
}

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Offers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage global promotions</p>
        </div>
        <Button asChild>
          <Link href="/admin/offers/new">+ Add Offer</Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <OffersTable />
      </Suspense>
    </div>
  )
}
