'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { scooterSchema, ScooterFormData } from '@/lib/admin/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ScooterFormProps {
  initialData?: any
  isLoading?: boolean
  onSubmit: (data: ScooterFormData) => Promise<void>
}

export function ScooterForm({ initialData, isLoading = false, onSubmit }: ScooterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScooterFormData>({
    resolver: zodResolver(scooterSchema),
    defaultValues: initialData || {
      status: 'ACTIVE',
      isFeatured: false,
      isNewArrival: false,
      colors: [],
      images: [],
    },
  })

  const [colors, setColors] = useState<string[]>(initialData?.colors || [])
  const [newColor, setNewColor] = useState('')
  const images = watch('images') || []

  const addColor = () => {
    if (newColor && !colors.includes(newColor)) {
      const updated = [...colors, newColor]
      setColors(updated)
      setValue('colors', updated)
      setNewColor('')
    }
  }

  const removeColor = (idx: number) => {
    const updated = colors.filter((_, i) => i !== idx)
    setColors(updated)
    setValue('colors', updated)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="dark:bg-zinc-900 dark:border-zinc-800">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div>
            <Label htmlFor="modelName" className="dark:text-zinc-200">Model Name *</Label>
            <Input
              id="modelName"
              {...register('modelName')}
              className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              placeholder="e.g., Access 125"
            />
            {errors.modelName && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.modelName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="dark:text-zinc-200">Price (Rs.) *</Label>
              <Input
                id="price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              />
              {errors.price && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="discountPrice" className="dark:text-zinc-200">Discount Price (Rs.)</Label>
              <Input
                id="discountPrice"
                type="number"
                {...register('discountPrice', { valueAsNumber: true })}
                className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="quantity" className="dark:text-zinc-200">Stock Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </div>

          <div>
            <Label htmlFor="status" className="dark:text-zinc-200">Status *</Label>
            <Select defaultValue={initialData?.status || 'ACTIVE'} onValueChange={(v) => setValue('status' as any, v as any)}>
              <SelectTrigger className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-zinc-900 dark:border-zinc-700">
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 dark:text-zinc-200">
              <input type="checkbox" {...register('isFeatured')} className="dark:bg-zinc-900" />
              <span>Featured</span>
            </label>
            <label className="flex items-center gap-2 dark:text-zinc-200">
              <input type="checkbox" {...register('isNewArrival')} className="dark:bg-zinc-900" />
              <span>New Arrival</span>
            </label>
          </div>

          <div>
            <Label className="dark:text-zinc-200">Colors</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="e.g., White"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                className="dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              />
              <Button type="button" onClick={addColor} variant="outline" className="dark:border-zinc-700">
                Add
              </Button>
            </div>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded">
                    <span className="dark:text-zinc-100">{color}</span>
                    <button type="button" onClick={() => removeColor(idx)} className="text-red-600">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="space-y-4">
          {['engine', 'mileage', 'power', 'torque', 'fuel', 'weight', 'brakes', 'tyres'].map((field) => (
            <div key={field}>
              <Label htmlFor={field} className="dark:text-zinc-200">{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
              <Input
                id={field}
                {...register(`specs.${field}` as any)}
                className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
                placeholder={`e.g., 125cc (for ${field})`}
              />
            </div>
          ))}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <ImageUpload
            images={images}
            onImagesChange={(imgs) => setValue('images', imgs)}
          />
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <div>
            <Label htmlFor="seoTitle" className="dark:text-zinc-200">SEO Title</Label>
            <Input
              id="seoTitle"
              {...register('seoTitle')}
              className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              maxLength={120}
              placeholder="e.g., Buy Suzuki Access 125 Online in Nepal"
            />
          </div>
          <div>
            <Label htmlFor="seoDescription" className="dark:text-zinc-200">SEO Description</Label>
            <Textarea
              id="seoDescription"
              {...register('seoDescription')}
              className="mt-1 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              maxLength={160}
              placeholder="e.g., Fuel-efficient automatic scooter..."
              rows={3}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" className="bg-[#E30613] hover:bg-[#C5000F]" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Scooter'}
        </Button>
        <Button type="button" variant="outline" className="dark:border-zinc-700 dark:text-zinc-300">
          Cancel
        </Button>
      </div>
    </form>
  )
}
