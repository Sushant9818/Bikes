'use client'

import { useState } from 'react'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const response = await fetch(`/api/admin/offers/${id}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to load offer')
  }
  return response.json()
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
    return <ErrorState error={error || 'Offer not found'} />
  }

  const handleSubmit = async (formData: OfferInput) => {
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
        <OfferForm initialData={offer} onSubmit={handleSubmit} isEditing />
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    // Reload the page to retry fetching
    router.refresh()
  }

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
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline whitespace-nowrap disabled:opacity-50"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    </div>
  )
}
