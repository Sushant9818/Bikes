'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PartForm from '@/components/admin/forms/PartForm'

export default function NewPartPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: any) => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create part')
      }

      // Success - redirect to parts list
      router.push('/admin/parts')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create part'
      setError(message)
      alert(message)
    } finally {
      setIsLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Add New Part</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Create a new part inventory item</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-8">
        <PartForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
