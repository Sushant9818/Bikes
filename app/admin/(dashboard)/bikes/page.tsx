import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Bike } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import BikesList from '@/components/admin/BikesList'

async function getBikes() {
  return prisma.vehicle.findMany({
    where: { type: 'BIKE' },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function BikesPage() {
  const bikes = await getBikes()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <Bike className="w-8 h-8 text-[#E60012]" />
            Bikes
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage your Suzuki bike inventory
          </p>
        </div>
        <Link
          href="/admin/bikes/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#E60012] text-white rounded-lg hover:bg-red-700 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Bike
        </Link>
      </div>

      {/* Bikes List */}
      <Suspense fallback={<div className="text-center py-12">Loading bikes...</div>}>
        <BikesList bikes={bikes} />
      </Suspense>
    </div>
  )
}
