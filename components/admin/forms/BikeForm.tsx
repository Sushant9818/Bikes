'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { bikeInputSchema, type BikeInput } from '@/lib/validations/bike'
import ImageUpload from '@/components/admin/ImageUpload'
import type { Vehicle } from '@prisma/client'

interface BikeFormProps {
  bike?: Vehicle
  isLoading?: boolean
}

export default function BikeForm({ bike, isLoading = false }: BikeFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BikeInput>({
    resolver: zodResolver(bikeInputSchema),
    defaultValues: bike
      ? {
          type: bike.type,
          modelName: bike.modelName,
          slug: bike.slug ?? undefined,
          category: bike.category ?? undefined,
          brand: bike.brand,
          year: bike.year ?? undefined,
          price: bike.price,
          discountPrice: bike.discountPrice,
          quantity: bike.quantity,
          description: bike.description,
          imageUrl: bike.imageUrl,
          status: bike.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          isFeatured: bike.isFeatured,
          isNewArrival: bike.isNewArrival,
          seoTitle: bike.seoTitle,
          seoDescription: bike.seoDescription,
          specs: (bike.specs as Record<string, unknown> | null) || {},
          colors: bike.colors || [],
          images: bike.images || [],
        }
      : {
          type: 'BIKE',
          brand: 'Suzuki',
          status: 'ACTIVE',
          isFeatured: false,
          isNewArrival: false,
          colors: [],
          images: [],
          specs: {},
        },
  })

  const images = watch('images') || []
  const specs = watch('specs') || {}
  const colors = watch('colors') || []

  async function onSubmit(data: BikeInput) {
    try {
      setSubmitting(true)
      setError('')

      const url = bike ? `/api/admin/bikes/${bike.id}` : '/api/admin/bikes'
      const method = bike ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save bike')
      }

      const savedBike = await response.json()
      router.push(`/admin/bikes/${savedBike.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#E60012]" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <Tabs.Root defaultValue="details" className="space-y-6">
        <Tabs.List className="grid grid-cols-4 gap-2 border-b border-zinc-200 dark:border-zinc-800">
          {['details', 'specs', 'images', 'seo'].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-[#E60012] data-[state=active]:text-[#E60012] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors capitalize"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Details Tab */}
        <Tabs.Content value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="BIKE">Bike</option>
                <option value="SCOOTER">Scooter</option>
              </select>
              {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>}
            </div>

            {/* Model Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Model Name *
              </label>
              <input
                {...register('modelName')}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="e.g., Gixxer SF"
              />
              {errors.modelName && <p className="mt-1 text-sm text-red-500">{errors.modelName.message}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Slug
              </label>
              <input
                {...register('slug')}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="e.g., gixxer-sf"
              />
              {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Category
              </label>
              <input
                {...register('category')}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="e.g., Sports"
              />
              {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Price *
              </label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="0.00"
              />
              {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
            </div>

            {/* Discount Price */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Discount Price
              </label>
              <input
                {...register('discountPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="0.00"
              />
              {errors.discountPrice && <p className="mt-1 text-sm text-red-500">{errors.discountPrice.message}</p>}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Year
              </label>
              <input
                {...register('year', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="2024"
              />
              {errors.year && <p className="mt-1 text-sm text-red-500">{errors.year.message}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Quantity *
              </label>
              <input
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="0"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity.message}</p>}
            </div>
          </div>

          {/* Status, Featured, New Arrival */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-6">
              <input
                {...register('isFeatured')}
                type="checkbox"
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer pt-6">
              <input
                {...register('isNewArrival')}
                type="checkbox"
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">New Arrival</span>
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              placeholder="Bike description..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Colors (comma-separated)
            </label>
            <input
              type="text"
              value={colors.join(', ')}
              onChange={(e) => {
                const colorArray = e.target.value.split(',').map((c) => c.trim()).filter(Boolean)
                setValue('colors', colorArray)
              }}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              placeholder="Red, Blue, Black"
            />
          </div>
        </Tabs.Content>

        {/* Specs Tab */}
        <Tabs.Content value="specs" className="space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2">
                <input
                  value={key}
                  onChange={(e) => {
                    const newSpecs = { ...specs }
                    delete newSpecs[key]
                    newSpecs[e.target.value] = value
                    setValue('specs', newSpecs)
                  }}
                  className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  placeholder="Key"
                />
                <div className="flex gap-2">
                  <input
                    value={String(value || '')}
                    onChange={(e) => {
                      const newSpecs = { ...specs }
                      newSpecs[key] = e.target.value
                      setValue('specs', newSpecs)
                    }}
                    className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newSpecs = { ...specs }
                      delete newSpecs[key]
                      setValue('specs', newSpecs)
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const newSpecs = { ...specs, ['New Spec']: 'Value' }
              setValue('specs', newSpecs)
            }}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Add Spec
          </button>
        </Tabs.Content>

        {/* Images Tab */}
        <Tabs.Content value="images" className="space-y-4">
          <ImageUpload
            images={images}
            onImagesChange={(newImages) => setValue('images', newImages)}
            maxFiles={10}
          />
        </Tabs.Content>

        {/* SEO Tab */}
        <Tabs.Content value="seo" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              SEO Title (max 60 chars)
            </label>
            <input
              {...register('seoTitle')}
              maxLength={60}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              placeholder="Page title for search engines"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {watch('seoTitle')?.length || 0} / 60 characters
            </p>
            {errors.seoTitle && <p className="mt-1 text-sm text-red-500">{errors.seoTitle.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              SEO Description (max 160 chars)
            </label>
            <textarea
              {...register('seoDescription')}
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              placeholder="Meta description for search engines"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {watch('seoDescription')?.length || 0} / 160 characters
            </p>
            {errors.seoDescription && <p className="mt-1 text-sm text-red-500">{errors.seoDescription.message}</p>}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Submit Button */}
      <div className="flex gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2 bg-[#E60012] text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {bike ? 'Update Bike' : 'Create Bike'}
        </button>
      </div>
    </form>
  )
}
