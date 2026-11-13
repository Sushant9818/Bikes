'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { offerInputSchema, type OfferInput } from '@/lib/validations/offer'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface OfferFormProps {
  initialData?: {
    id: number
    title: string
    description: string | null
    discountPercent: number | null
    startDate: Date | string | null
    endDate: Date | string | null
    imageUrl: string | null
  }
  isLoading?: boolean
  onSubmit?: (data: OfferInput) => Promise<void>
  isEditing?: boolean
}

export default function OfferForm({ initialData, isLoading = false, onSubmit, isEditing = false }: OfferFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showRetry, setShowRetry] = useState(false)

  // Convert initialData dates to YYYY-MM-DD format for form
  const getDefaultStartDate = () => {
    if (!initialData?.startDate) return new Date().toISOString().split('T')[0]
    const date = typeof initialData.startDate === 'string'
      ? initialData.startDate
      : initialData.startDate.toISOString()
    return date.split('T')[0]
  }

  const getDefaultEndDate = () => {
    if (!initialData?.endDate) {
      const tomorrow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      return tomorrow.toISOString().split('T')[0]
    }
    const date = typeof initialData.endDate === 'string'
      ? initialData.endDate
      : initialData.endDate.toISOString()
    return date.split('T')[0]
  }

  const { register, handleSubmit, formState: { errors } } = useForm<OfferInput>({
    resolver: zodResolver(offerInputSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      discountPercent: initialData?.discountPercent ?? 10,
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
      imageUrl: initialData?.imageUrl || '',
    },
  })

  const handleFormSubmit = async (data: OfferInput) => {
    setSubmitting(true)
    setError('')
    setShowRetry(false)
    try {
      // Convert date strings to ISO datetime format
      const payload = {
        ...data,
        startDate: `${data.startDate}T00:00:00Z`,
        endDate: `${data.endDate}T00:00:00Z`,
        imageUrl: data.imageUrl || null,
      }

      if (onSubmit) {
        await onSubmit(payload)
      } else {
        // Default behavior for creating new offers
        const method = isEditing ? 'PATCH' : 'POST'
        const url = isEditing ? `/api/admin/offers/${initialData?.id}` : '/api/admin/offers'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} offer`
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // Silently fail if JSON parse fails, use default message
          }
          throw new Error(errorMessage)
        }

        router.push('/admin/offers')
        router.refresh()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMsg)
      setShowRetry(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setError('')
    setShowRetry(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#E60012]" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading offer...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
          {showRetry && (
            <button
              onClick={handleRetry}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Title *
          </label>
          <input
            type="text"
            placeholder="Summer Sale"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]"
            {...register('title')}
            disabled={submitting}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Discount Percentage *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E60012]"
              {...register('discountPercent', { valueAsNumber: true })}
              disabled={submitting}
            />
            <span className="text-zinc-900 dark:text-zinc-100">%</span>
          </div>
          {errors.discountPercent && <p className="text-red-500 text-sm mt-1">{errors.discountPercent.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Image URL
          </label>
          <input
            type="text"
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]"
            {...register('imageUrl')}
            disabled={submitting}
          />
          {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E60012]"
            {...register('startDate')}
            disabled={submitting}
          />
          {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            End Date *
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#E60012]"
            {...register('endDate')}
            disabled={submitting}
          />
          {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Description
        </label>
        <textarea
          placeholder="Describe the offer..."
          rows={4}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E60012] resize-none"
          {...register('description')}
          disabled={submitting}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div className="flex gap-3 pt-6">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#E60012] hover:bg-[#C5000F] text-white"
        >
          {submitting ? 'Saving...' : (isEditing ? 'Update Offer' : 'Create Offer')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
