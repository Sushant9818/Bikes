# Task 1: Offers Edit Page

**Objective:** Create offers detail page with edit form. Extract OfferForm component for reuse in create/edit workflows. Link from offers list.

**Files:**
- Create: `app/admin/(dashboard)/offers/[id]/page.tsx` - detail page with Suspense + error handling
- Create: `components/admin/forms/OfferForm.tsx` - reusable form component for create/edit
- Modify: `app/admin/(dashboard)/offers/page.tsx` - add link to detail page from table

**Interfaces:**
- Consumes: Existing `GET /api/admin/offers/[id]` and `PATCH /api/admin/offers/[id]` API endpoints (already exist)
- Produces: OfferForm component with props `initialData`, `isLoading`, `onSubmit`, `isEditing` + detail page that renders it

**Implementation Steps:**

### Step 1: Create OfferForm component

File: `components/admin/forms/OfferForm.tsx`

```typescript
'use client'

import { useState } from 'react'
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
    discountPercent: number
    startDate: Date | string
    endDate: Date | string
    imageUrl: string | null
  }
  isLoading?: boolean
  onSubmit: (data: any) => Promise<void>
  isEditing?: boolean
}

export default function OfferForm({ initialData, isLoading = false, onSubmit, isEditing = false }: OfferFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    discountPercent: initialData?.discountPercent || 0,
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
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        discountPercent: formData.discountPercent,
        startDate: `${formData.startDate}T00:00:00Z`,
        endDate: `${formData.endDate}T00:00:00Z`,
        imageUrl: formData.imageUrl || null,
      })
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
```

### Step 2: Create offers detail page

File: `app/admin/(dashboard)/offers/[id]/page.tsx`

```typescript
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import OfferForm from '@/components/admin/forms/OfferForm'
import { ApiError } from '@/lib/api-error'
import { Button } from '@/components/ui/button'

type Params = { params: Promise<{ id: string }> }

async function getOffer(id: string) {
  const offer = await prisma.offer.findUnique({
    where: { id: Number(id) },
  })
  if (!offer) {
    throw new ApiError(404, 'Offer not found')
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
  let offer = null
  let error = null

  try {
    offer = await getOffer(id)
  } catch (err) {
    error = err instanceof ApiError ? err.message : 'Failed to load offer'
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/admin/offers">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
        </Link>
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData: any) => {
    'use server'
    
    const response = await fetch(`/api/admin/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error('Failed to update offer')
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
```

### Step 3: Link from offers list

Modify: `app/admin/(dashboard)/offers/page.tsx` - Update OffersTable import and add link handler to eye icon

In the eye icon button, add onClick handler:
```typescript
onClick={() => window.location.href = `/admin/offers/${row.original.id}`}
```

### Step 4: Test

Run: `npm run dev`, navigate to /admin/offers, click edit icon on any offer, verify form loads with data pre-filled, edit and save works, back button returns to list

### Step 5: Run tests

```bash
npm run test
```

Verify no new test failures.

**Report file:** `/Users/sushanprajapati/Desktop/Suzuki\ Bike/.superpowers/sdd-detail-pages/task-1-report.md`
