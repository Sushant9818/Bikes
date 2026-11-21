'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimeSlot {
  id: string
  label: string
}

interface TimeSlotSelectorProps {
  value: string
  onChange: (slotId: string) => void
}

export default function TimeSlotSelector({ value, onChange }: TimeSlotSelectorProps) {
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeslots = async () => {
      try {
        const response = await fetch('/api/timeslots')
        const data = await response.json()
        setTimeslots(data.timeslots)
      } catch (error) {
        console.error('Failed to load time slots:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTimeslots()
  }, [])

  if (loading) return <div className="text-gray-600 dark:text-gray-400">Loading time slots...</div>

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
        Pick-up Time
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a time slot" />
        </SelectTrigger>
        <SelectContent>
          {timeslots.map((slot) => (
            <SelectItem key={slot.id} value={slot.id}>
              {slot.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300">
            Selected: {timeslots.find((slot) => slot.id === value)?.label}
          </p>
        </div>
      )}
    </div>
  )
}
