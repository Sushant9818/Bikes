'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface PartFormProps {
  initialData?: {
    id: number
    type: 'BIKE_PART' | 'SCOOTER_PART'
    partName: string
    sku: string
    compatibleModel?: string | null
    price: number
    quantity: number
    minStock: number
    imageUrl?: string | null
    status: string
  }
  isLoading?: boolean
  onSubmit: (data: any) => Promise<void>
}

const PART_TYPES = [
  { value: 'BIKE_PART', label: 'Bike Part' },
  { value: 'SCOOTER_PART', label: 'Scooter Part' },
]

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export default function PartForm({ initialData, isLoading = false, onSubmit }: PartFormProps) {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'BIKE_PART',
    partName: initialData?.partName || '',
    sku: initialData?.sku || '',
    compatibleModel: initialData?.compatibleModel || '',
    price: initialData?.price || '',
    quantity: initialData?.quantity || '',
    minStock: initialData?.minStock || 10,
    imageUrl: initialData?.imageUrl || '',
    status: initialData?.status || 'ACTIVE',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' || name === 'minStock'
        ? value === '' ? '' : Number(value)
        : value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.partName.trim()) newErrors.partName = 'Part name is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Price must be positive'
    if (Number(formData.quantity) < 0) newErrors.quantity = 'Quantity must be non-negative'
    if (Number(formData.minStock) < 0) newErrors.minStock = 'Min stock must be non-negative'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        minStock: Number(formData.minStock),
      })
    } catch (error) {
      console.error('Form submission error:', error)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Part Name */}
        <div>
          <Label htmlFor="partName">Part Name *</Label>
          <Input
            id="partName"
            name="partName"
            value={formData.partName}
            onChange={handleChange}
            placeholder="Enter part name"
            className={errors.partName ? 'border-red-500' : ''}
          />
          {errors.partName && <p className="text-sm text-red-500 mt-1">{errors.partName}</p>}
        </div>

        {/* SKU */}
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="Enter SKU"
            disabled={!!initialData}
            className={errors.sku ? 'border-red-500' : ''}
          />
          {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku}</p>}
          {initialData && <p className="text-xs text-zinc-500 mt-1">SKU cannot be changed</p>}
        </div>

        {/* Category (Type) */}
        <div>
          <Label htmlFor="type">Category *</Label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-200 rounded-md bg-white dark:bg-zinc-900 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            {PART_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            placeholder="Enter price"
            className={errors.price ? 'border-red-500' : ''}
          />
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>

        {/* Quantity */}
        <div>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            className={errors.quantity ? 'border-red-500' : ''}
          />
          {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
        </div>

        {/* Min Stock */}
        <div>
          <Label htmlFor="minStock">Min Stock (default: 10) *</Label>
          <Input
            id="minStock"
            name="minStock"
            type="number"
            min="0"
            value={formData.minStock}
            onChange={handleChange}
            placeholder="Enter minimum stock level"
            className={errors.minStock ? 'border-red-500' : ''}
          />
          {errors.minStock && <p className="text-sm text-red-500 mt-1">{errors.minStock}</p>}
        </div>

        {/* Compatible Model */}
        <div>
          <Label htmlFor="compatibleModel">Compatible Model</Label>
          <Input
            id="compatibleModel"
            name="compatibleModel"
            value={formData.compatibleModel}
            onChange={handleChange}
            placeholder="e.g., Gixxer, Burgman"
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-200 rounded-md bg-white dark:bg-zinc-900 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-6">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#E60012] hover:bg-[#E60012]/90 text-white"
        >
          {submitting ? 'Saving...' : initialData ? 'Update Part' : 'Create Part'}
        </Button>
      </div>
    </form>
  )
}
