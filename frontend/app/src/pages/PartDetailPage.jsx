import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as partsApi from '@/api/parts'
import { useAuth } from '@/auth/AuthContext'
import { useCart } from '@/cart/CartContext'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SkeletonGrid from '@/components/SkeletonGrid'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { formatNPR } from '@/utils/currency'

export default function PartDetailPage() {
  const navigate = useNavigate()
  const { isAdmin, token } = useAuth()
  const { addToCart } = useCart()
  const { id } = useParams()
  const [part, setPart] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      partsApi
        .getPart(id)
        .then(setPart)
        .catch(() => setPart(null))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading || !part) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {loading ? <SkeletonGrid rows={1} cols={1} /> : <p className="text-zinc-500">Part not found.</p>}
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const imgSrc = part.imageUrl || part.image || '/assets/images/placeholder.jpg'
  const isLowStock = (part.quantity ?? 0) <= 5

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/parts">← Back to Parts</Link>
          </Button>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="md:w-1/2 aspect-[4/3] bg-zinc-100">
              <img
                src={imgSrc}
                alt={part.partName}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = '/assets/images/placeholder.jpg')}
              />
            </div>
            <div className="md:w-1/2 p-8">
              <Badge variant="secondary" className="mb-3">
                {part.type?.replace('_', ' ') || 'Part'}
              </Badge>
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">{part.partName}</h1>
              <p className="text-zinc-600 mb-4">{part.compatibleModel || 'Universal'}</p>
              <p className="text-3xl font-bold text-[#E60012] mb-4">{formatNPR(part.price)}</p>
              <Badge variant={isLowStock ? 'destructive' : 'success'} className="mb-6">
                Stock: {part.quantity ?? 0} {isLowStock && '(Low Stock)'}
              </Badge>
              <div className="flex flex-wrap gap-3">
                {!isAdmin() && (
                  <Button
                    className="bg-[#E60012] hover:bg-[#C5000F]"
                    onClick={() => {
                      if (!token) {
                        navigate('/login')
                        return
                      }
                      addToCart(part)
                      toast.success('Added to cart')
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/parts">View All Parts</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
