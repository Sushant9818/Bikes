'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Store {
  id: number
  name: string
  address: string
  phone: string
}

interface StoreSelectorProps {
  value: string
  onChange: (storeId: string) => void
}

export default function StoreSelector({ value, onChange }: StoreSelectorProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores')
        const data = await response.json()
        setStores(data.stores)
      } catch (error) {
        console.error('Failed to load stores:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  if (loading) return <div className="text-gray-600 dark:text-gray-400">Loading stores...</div>

  const selectedStore = stores.find((s) => String(s.id) === value)

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
        Pick-up Location
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a store" />
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.id} value={String(store.id)}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedStore && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300">{selectedStore.name}</p>
          <p>{selectedStore.address}</p>
          <p>{selectedStore.phone}</p>
        </div>
      )}
    </div>
  )
}
