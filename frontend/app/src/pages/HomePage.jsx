import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as vehiclesApi from '@/api/vehicles'
import * as partsApi from '@/api/parts'
import HeroBanner from '@/components/HeroBanner'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import PartCard from '@/components/PartCard'
import { VehicleCategoryTabs } from '@/components/CategoryTabs'
import SkeletonGrid from '@/components/SkeletonGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
export default function HomePage() {
  const [vehicles, setVehicles] = useState([])
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('BIKE')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      vehiclesApi.getVehicles({ type: typeFilter }).catch(() => []),
      partsApi.getParts({}).catch(() => []),
    ])
      .then(([v, p]) => {
        setVehicles(v)
        setParts(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [typeFilter])

  const filteredVehicles = vehicles
    .filter((v) => {
      if ((v.brand || 'Suzuki') !== 'Suzuki') return false
      const matchesType = v.type === typeFilter
      if (!matchesType) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          v.modelName?.toLowerCase().includes(q) ||
          v.brand?.toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'price') return (a.price ?? 0) - (b.price ?? 0)
      if (sortBy === 'newest') return (b.id ?? 0) - (a.id ?? 0)
      return (b.id ?? 0) - (a.id ?? 0)
    })

  const featuredParts = parts.filter((p) => (p.brand || 'Suzuki') === 'Suzuki').slice(0, 4)

  return (
    <>
      <HeroBanner />

      {/* New Arrivals / Products Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-3xl font-bold text-zinc-900">New Arrivals</h2>
            <Button asChild variant="outline" className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white w-fit">
              <Link to="/products">View All Products →</Link>
            </Button>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <VehicleCategoryTabs value={typeFilter} onValueChange={setTypeFilter} />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 px-4 border border-zinc-200 rounded-xl text-sm"
            >
              <option value="recent">Newest</option>
              <option value="price">Price: Low to High</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {loading ? (
            <SkeletonGrid rows={1} cols={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredVehicles.slice(0, 8).map((v) => (
                <ProductCard key={v.id} vehicle={v} />
              ))}
              {filteredVehicles.length === 0 && (
                <p className="text-zinc-500 col-span-full text-center py-12">
                  No {typeFilter === 'BIKE' ? 'motorcycles' : 'scooters'} available.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Parts */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-zinc-900">Featured Parts</h2>
            <Button asChild variant="outline" className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white">
              <Link to="/parts">View All Parts →</Link>
            </Button>
          </div>
          {loading ? (
            <SkeletonGrid rows={1} cols={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredParts.map((p) => (
                <PartCard key={p.id} part={p} />
              ))}
              {featuredParts.length === 0 && (
                <p className="text-zinc-500 col-span-full text-center py-12">
                  No parts available.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
