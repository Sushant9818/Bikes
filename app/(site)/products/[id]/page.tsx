'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatNPR } from '@/lib/currency'
import { getImageUrl } from '@/lib/images'
import { vehicleDescription, vehicleTypeLabel } from '@/lib/catalogDescriptions'
import type { Vehicle } from '@prisma/client'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setVehicle)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner className="min-h-[60vh]" label="Loading..." />
  if (!vehicle) return <div className="py-24 text-center text-zinc-500">Vehicle not found.</div>

  const typeLabel = vehicleTypeLabel(vehicle.type)
  const isLowStock = (vehicle.quantity ?? 0) <= 5

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button variant="ghost" onClick={() => router.back()} className="text-zinc-500 -ml-2 mb-4">← Back</Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl overflow-hidden flex items-center justify-center p-6 min-h-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getImageUrl(vehicle)} alt={vehicle.modelName} className="w-full max-h-[380px] object-contain drop-shadow-xl" />
          </div>
          <div>
            <Badge className="mb-3 bg-[#E60012]/10 text-[#E60012] border-0 text-xs uppercase">Suzuki {typeLabel}</Badge>
            <h1 className="text-4xl font-bold text-zinc-900 mb-1">{vehicle.modelName}</h1>
            <p className="text-zinc-400 text-sm mb-5">Suzuki{vehicle.year ? ` · ${vehicle.year}` : ''}</p>
            <p className="text-4xl font-extrabold text-[#E60012] mb-6">{formatNPR(vehicle.price)}</p>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full mb-6 ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {isLowStock ? `Only ${vehicle.quantity} left` : `${vehicle.quantity} in stock`}
            </span>
            <p className="text-zinc-600 mb-8">{vehicleDescription(vehicle)}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl px-6"><Link href="/test-drive">Book Test Drive</Link></Button>
              <Button asChild variant="outline" className="rounded-xl px-6"><Link href="/contact">Enquire Now</Link></Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
