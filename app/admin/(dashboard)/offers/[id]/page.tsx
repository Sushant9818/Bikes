import { Suspense } from 'react'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import OfferForm from '@/components/admin/forms/OfferForm'
import { Button } from '@/components/ui/button'
import type { OfferInput } from '@/lib/validations/offer'

type Params = { params: Promise<{ id: string }> }

interface OfferData {
  id: number
  title: string
  description: string | null
  discountPercent: number | null
  startDate: Date | string | null
  endDate: Date | string | null
  imageUrl: string | null
}

async function getOffer(id: string): Promise<OfferData> {
  const offer = await prisma.offer.findUnique({
    where: { id: Number(id) },
  })
  if (!offer) {
    throw new Error('Offer not found')
  }
  return offer
}

function OfferFormLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#E60012]" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading offer...</p>
      </div>
    </div>
  )
}

export default async function EditOfferPage({ params }: Params) {
  const { id } = await params
  let offer: OfferData | null = null
  let error: string | null = null

  try {
    offer = await getOffer(id)
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load offer'
  }

  if (error || !offer) {
    return (
      <div className="space-y-6">
        <Link href="/admin/offers">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
        </Link>
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-400">{error || 'Offer not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData: OfferInput) => {
    'use server'

    const response = await fetch(`/api/admin/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to update offer'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // Silently fail if JSON parse fails
      }
      throw new Error(errorMessage)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/offers">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Edit Offer</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">{offer?.title || 'Offer'}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <Suspense fallback={<OfferFormLoader />}>
          <OfferForm initialData={offer} onSubmit={handleSubmit} isEditing />
        </Suspense>
      </div>
    </div>
  )
}
