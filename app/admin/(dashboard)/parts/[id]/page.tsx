'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PartForm from '@/components/admin/forms/PartForm'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Part {
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
  createdAt?: string
  updatedAt?: string
}

export default function EditPartPage() {
  const router = useRouter()
  const params = useParams()
  const partId = params.id as string

  const [part, setPart] = useState<Part | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPart()
  }, [partId])

  const fetchPart = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/parts/${partId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch part')
      }

      const data = await response.json()
      setPart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch part'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: any) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/parts/${partId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update part')
      }

      // Success - redirect to parts list
      router.push('/admin/parts')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update part'
      setError(message)
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !part) {
    return (
      <div>
        <Link href="/admin/parts">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Parts
          </Button>
        </Link>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!part) {
    return (
      <div>
        <Link href="/admin/parts">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Parts
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400">Part not found</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/parts">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Parts
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Edit Part</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Update part inventory details</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <PartForm initialData={part} isLoading={isSubmitting} onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
