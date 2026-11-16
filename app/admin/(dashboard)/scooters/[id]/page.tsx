'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScooterForm } from '@/components/admin/forms/ScooterForm'
import { ScooterFormData } from '@/lib/admin/validations'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function EditScooterPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [scooter, setScooter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchScooter = async () => {
      try {
        const res = await fetch(`/api/admin/scooters/${params.id}`)
        if (!res.ok) throw new Error('Scooter not found')
        const json = await res.json()
        setScooter(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scooter')
      } finally {
        setLoading(false)
      }
    }

    fetchScooter()
  }, [params.id])

  const handleSubmit = async (data: ScooterFormData) => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/scooters/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update scooter')

      router.push('/admin/scooters')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading scooter..." />

  if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">Edit Scooter</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-200">{error}</p>
        </div>
      )}

      <ScooterForm initialData={scooter} onSubmit={handleSubmit} isLoading={saving} />
    </div>
  )
}
