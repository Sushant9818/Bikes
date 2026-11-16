'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScooterForm } from '@/components/admin/forms/ScooterForm'
import { ScooterFormData } from '@/lib/admin/validations'

export default function NewScooterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: ScooterFormData) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/scooters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || 'Failed to create scooter')
      }

      router.push('/admin/scooters')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">Add New Scooter</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-200">{error}</p>
        </div>
      )}

      <ScooterForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  )
}
