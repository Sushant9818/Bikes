import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Bike, AlertCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import BikesList from '@/components/admin/BikesList'

async function getBikes() {
  try {
    return await prisma.vehicle.findMany({
      where: { type: 'BIKE' },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching bikes:', error)
    throw new Error('Failed to load bikes. Please try again later.')
  }
}

export default async function BikesPage() {
  let bikes
  let error: string | null = null

  try {
    bikes = await getBikes()
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load bikes'
  }

  if (error) {
    return (
      <div className="space-y-8">
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
        </div>

        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Error Loading Bikes</h3>
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-2">Please refresh the page to try again.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
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

      <Suspense fallback={<div className="text-center py-12">Loading bikes...</div>}>
        <BikesList bikes={bikes} />
      </Suspense>
    </div>
  )
}
