import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as vehiclesApi from '@/api/vehicles'
import { formatNPR } from '@/utils/currency'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SkeletonGrid from '@/components/SkeletonGrid'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      vehiclesApi
        .getVehicle(id)
        .then(setVehicle)
        .catch(() => setVehicle(null))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading || !vehicle) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {loading ? <SkeletonGrid rows={1} cols={1} /> : <p className="text-zinc-500">Vehicle not found.</p>}
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const imgSrc = vehicle.imageUrl || vehicle.image || '/assets/images/placeholder.jpg'
  const isLowStock = (vehicle.quantity ?? 0) <= 5

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/products">← Back to Products</Link>
          </Button>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="md:w-1/2 aspect-[4/3] bg-zinc-100">
              <img
                src={imgSrc}
                alt={vehicle.modelName}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = '/assets/images/placeholder.jpg')}
              />
            </div>
            <div className="md:w-1/2 p-8">
              <Badge variant={vehicle.type === 'SCOOTER' ? 'secondary' : 'default'} className="mb-3">
                {vehicle.type === 'SCOOTER' ? 'Scooter' : 'Motorcycle'}
              </Badge>
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">{vehicle.modelName}</h1>
              <p className="text-zinc-600 mb-4">{vehicle.brand} • {vehicle.year}</p>
              <p className="text-3xl font-bold text-[#E60012] mb-4">{formatNPR(vehicle.price)}</p>
              <Badge variant={isLowStock ? 'destructive' : 'success'} className="mb-6">
                Stock: {vehicle.quantity ?? 0} {isLowStock && '(Low Stock)'}
              </Badge>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
                <Link to="/products">View All Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
