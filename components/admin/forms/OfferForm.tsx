'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import LoadingSpinner from '@/components/LoadingSpinner'

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
  onSubmit?: (data: any) => Promise<void>
  isEditing?: boolean
}

export default function OfferForm({ initialData, isLoading = false, onSubmit, isEditing = false }: OfferFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    discountPercent: initialData?.discountPercent ?? 0,
    startDate: initialData?.startDate
      ? (typeof initialData.startDate === 'string'
        ? initialData.startDate.split('T')[0]
        : initialData.startDate.toISOString().split('T')[0])
      : '',
    endDate: initialData?.endDate
      ? (typeof initialData.endDate === 'string'
        ? initialData.endDate.split('T')[0]
        : initialData.endDate.toISOString().split('T')[0])
      : '',
    imageUrl: initialData?.imageUrl || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'discountPercent' ? Number(value) : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (formData.discountPercent < 0 || formData.discountPercent > 100) newErrors.discountPercent = 'Discount must be 0-100%'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    setError('')
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        discountPercent: formData.discountPercent,
        startDate: `${formData.startDate}T00:00:00Z`,
        endDate: `${formData.endDate}T00:00:00Z`,
        imageUrl: formData.imageUrl || null,
      }

      if (onSubmit) {
        await onSubmit(payload)
      } else {
        // Default behavior for creating new offers
        const method = isEditing ? 'PUT' : 'POST'
        const url = isEditing ? `/api/admin/offers/${initialData?.id}` : '/api/admin/offers'

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} offer`)
        }

        router.push('/admin/offers')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter offer title"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <Label htmlFor="discountPercent">Discount % *</Label>
          <Input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min="0"
            max="100"
            value={formData.discountPercent}
            onChange={handleChange}
            className={errors.discountPercent ? 'border-red-500' : ''}
          />
          {errors.discountPercent && <p className="text-sm text-red-500 mt-1">{errors.discountPercent}</p>}
        </div>

        <div>
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="text"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>}
        </div>

        <div>
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            className={errors.endDate ? 'border-red-500' : ''}
          />
          {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>}
        </div>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter offer description"
          rows={4}
        />
      </div>

      <div className="flex gap-4 pt-6">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#E60012] hover:bg-[#E60012]/90 text-white"
        >
          {submitting ? 'Saving...' : (isEditing ? 'Update Offer' : 'Create Offer')}
        </Button>
      </div>
    </form>
  )
}
