'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { offerInputSchema, type OfferInput } from '@/lib/validations/offer'
import { Button } from '@/components/ui/button'

export default function OfferForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<OfferInput>({
    resolver: zodResolver(offerInputSchema),
    defaultValues: {
      title: '',
      description: '',
      discountPercent: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      imageUrl: '',
    },
  })

  const onSubmit = async (data: OfferInput) => {
    try {
      setSubmitting(true)
      setError('')

      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create offer')
      }

      router.push('/admin/offers')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      <div>
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
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Max 100 characters</p>
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
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Max 500 characters</p>
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
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">0-100%</p>
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
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">When offer starts</p>
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
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">When offer ends (must be after start date)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Image URL
        </label>
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E60012]"
          {...register('imageUrl')}
          disabled={submitting}
        />
        {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Optional offer image</p>
      </div>

      <div className="flex gap-3 pt-6">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#E60012] hover:bg-[#C5000F] text-white"
        >
          {submitting ? 'Creating...' : 'Create Offer'}
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
