import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import BikeForm from '@/components/admin/forms/BikeForm'
import { ApiError } from '@/lib/api-error'

type Params = { params: Promise<{ id: string }> }

async function getBike(id: string) {
  const bike = await prisma.vehicle.findUnique({
    where: { id: Number(id) },
  })
  if (!bike) {
    throw new ApiError(404, 'Bike not found')
  }
  return bike
}

function BikeFormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#E60012]" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading bike...</p>
      </div>
    </div>
  )
}

export default async function EditBikePage({ params }: Params) {
  const { id } = await params
  let bike = null
  let error = null

  try {
    bike = await getBike(id)
  } catch (err) {
    error = err instanceof ApiError ? err.message : 'Failed to load bike'
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bikes"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Edit Bike</h1>
        </div>

        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-red-700 dark:text-red-300">
          <p className="font-medium">Error</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bikes"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Edit Bike</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">{bike?.modelName || 'Bike'}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 lg:p-8">
        <Suspense fallback={<BikeFormLoader />}>
          <BikeForm bike={bike} />
        </Suspense>
      </div>
    </div>
  )
}
