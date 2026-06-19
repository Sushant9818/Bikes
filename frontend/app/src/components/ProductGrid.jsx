import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import * as vehiclesApi from '@/api/vehicles'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'


export default function ProductGrid() {
  const [searchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'BIKE')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState('serial')

  const fetchVehicles = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { type: typeFilter }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      const data = await vehiclesApi.getVehicles(params)
      setVehicles(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load vehicles')
      setError(msg)
      setVehicles([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [typeFilter])

  useEffect(() => {
    const q = searchParams.get('q')
    const t = searchParams.get('type')
    if (q != null) setSearchQuery(q)
    if (t === 'BIKE' || t === 'SCOOTER') setTypeFilter(t)
  }, [searchParams])

  const displayList = useMemo(() => {
    let list = [...vehicles]
    if (sortBy === 'priceLow') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    else if (sortBy === 'priceHigh') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    else list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    return list
  }, [vehicles, sortBy])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchVehicles()
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900">
              {typeFilter === 'BIKE' ? 'Suzuki Motorcycles' : 'Suzuki Scooters'}
            </h2>
            <p className="text-zinc-600 mt-1">Responsive card catalog · serial order 1, 2, 3…</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl shrink-0 shadow-sm">
            <Link to={typeFilter === 'BIKE' ? '/bikes' : '/scooters'}>View all</Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full sm:w-auto">
            <TabsList className="bg-zinc-100 p-1 rounded-xl shadow-inner">
              <TabsTrigger
                value="BIKE"
                className="rounded-lg data-[state=active]:bg-[#E60012] data-[state=active]:text-white"
              >
                Bikes
              </TabsTrigger>
              <TabsTrigger
                value="SCOOTER"
                className="rounded-lg data-[state=active]:bg-[#E60012] data-[state=active]:text-white"
              >
                Scooters
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSearch} className="flex-1 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search by name or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 px-4 border border-zinc-200 rounded-xl text-sm bg-white shadow-sm"
            >
              <option value="serial">Serial order</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
            </select>
            <Button type="submit" variant="outline" className="rounded-xl">
              Search
            </Button>
          </form>
        </div>

        {error && !loading && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex flex-wrap items-center gap-2"
          >
            <span>{error}</span>
            <Button type="button" variant="outline" size="sm" onClick={fetchVehicles}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner className="py-24" label="Loading vehicles..." />
        ) : displayList.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 shadow-sm">
            <p className="text-zinc-500 text-lg">No products found.</p>
            <p className="text-zinc-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayList.map((v, i) => (
              <ProductCard
                key={v.id}
                serialNumber={i + 1}
                vehicle={v}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
