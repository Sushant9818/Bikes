'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import HeroSection from '@/components/HeroSection'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import SkeletonGrid from '@/components/SkeletonGrid'
import type { Vehicle } from '@prisma/client'

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vehicles?type=BIKE')
      .then((res) => (res.ok ? res.json() : []))
      .then(setVehicles)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <HeroSection />
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-zinc-900">New Arrivals</h2>
            <Button asChild variant="outline" className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white">
              <Link href="/bikes">View All →</Link>
            </Button>
          </div>
          {loading ? (
            <SkeletonGrid rows={1} cols={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vehicles.slice(0, 8).map((v) => <ProductCard key={v.id} vehicle={v} />)}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  )
}
