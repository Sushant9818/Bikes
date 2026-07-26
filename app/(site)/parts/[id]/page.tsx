'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useCart } from '@/cart/CartContext'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { formatNPR } from '@/lib/currency'
import { getImageUrl } from '@/lib/images'
import { partDescription } from '@/lib/catalogDescriptions'
import type { Part } from '@prisma/client'

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isSignedIn } = useUser()
  const { addToCart } = useCart()
  const router = useRouter()
  const [part, setPart] = useState<Part | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/parts/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setPart)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner className="min-h-[60vh]" label="Loading..." />
  if (!part) return <div className="py-24 text-center text-zinc-500">Part not found.</div>

  const isLowStock = (part.quantity ?? 0) <= 5

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" asChild className="mb-6"><Link href="/parts">← Back to Parts</Link></Button>
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="md:w-1/2 aspect-[4/3] bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getImageUrl(part)} alt={part.partName} className="w-full h-full object-cover" />
            </div>
            <div className="md:w-1/2 p-8">
              <Badge variant="secondary" className="mb-3">{part.type.replace('_', ' ')}</Badge>
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">{part.partName}</h1>
              <p className="text-zinc-600 mb-4">{partDescription(part)}</p>
              <p className="text-3xl font-bold text-[#E60012] mb-4">{formatNPR(part.price)}</p>
              <Badge variant={isLowStock ? 'destructive' : 'success'} className="mb-6">
                Stock: {part.quantity ?? 0} {isLowStock && '(Low Stock)'}
              </Badge>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-[#E60012] hover:bg-[#C5000F]"
                  onClick={() => {
                    if (!isSignedIn) { router.push('/sign-in'); return }
                    addToCart(part)
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                </Button>
                <Button asChild variant="outline"><Link href="/parts">View All Parts</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
