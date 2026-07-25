'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SERVICE_TYPES, TIME_SLOTS } from '@/lib/appointmentConstants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/Footer'
import { CheckSquare, Square } from 'lucide-react'

export default function BookServicePage() {
  const router = useRouter()
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    bikeModel: '', bikeYear: '', registrationNumber: '', vin: '', mileage: '',
    preferredDate: '', preferredTime: '', description: '', customService: '',
  })

  const showCustom = selectedServices.includes('OTHER')
  const toggleService = (value: string) => {
    setSelectedServices((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (selectedServices.length === 0) { setError('Please select at least one service'); return }
    if (!form.bikeModel || !form.preferredDate || !form.preferredTime) { setError('Please fill in all required fields'); return }

    setSubmitting(true)
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bikeModel: form.bikeModel,
        bikeYear: form.bikeYear ? Number(form.bikeYear) : null,
        registrationNumber: form.registrationNumber || null,
        vin: form.vin || null,
        mileage: form.mileage ? Number(form.mileage) : null,
        services: selectedServices,
        customService: showCustom ? form.customService : null,
        description: form.description || null,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
      }),
    })
    setSubmitting(false)

    if (res.ok) {
      router.push('/my-appointments')
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to book appointment')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-zinc-900 mb-8">Book a Service Appointment</h1>
          {error && <p className="text-[#E60012] text-sm mb-4">{error}</p>}

          <form onSubmit={onSubmit} className="space-y-8">
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-5">Bike Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Label>Bike Model *</Label><Input value={form.bikeModel} onChange={(e) => setForm({ ...form, bikeModel: e.target.value })} placeholder="e.g. Gixxer SF 250" className="mt-1 rounded-xl" required /></div>
                <div><Label>Bike Year</Label><Input type="number" value={form.bikeYear} onChange={(e) => setForm({ ...form, bikeYear: e.target.value })} className="mt-1 rounded-xl" /></div>
                <div><Label>Current Mileage (km)</Label><Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className="mt-1 rounded-xl" /></div>
                <div><Label>Registration Number</Label><Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="mt-1 rounded-xl" /></div>
                <div><Label>VIN (optional)</Label><Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="mt-1 rounded-xl" /></div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-2">Select Services *</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_TYPES.map(({ value, label }) => {
                  const active = selectedServices.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleService(value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${active ? 'border-[#E60012] bg-[#E60012]/5 text-[#E60012]' : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'}`}
                    >
                      {active ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0 text-zinc-400" />}
                      {label}
                    </button>
                  )
                })}
              </div>
              {showCustom && (
                <div className="mt-4"><Label>Describe the other service</Label><Input value={form.customService} onChange={(e) => setForm({ ...form, customService: e.target.value })} className="mt-1 rounded-xl" /></div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-5">Schedule</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Preferred Date *</Label><Input type="date" min={today} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="mt-1 rounded-xl" required /></div>
                <div>
                  <Label>Preferred Time *</Label>
                  <select value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white" required>
                    <option value="">Select a time slot</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-4">Issue Description</h2>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" />
            </section>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl px-8">{submitting ? 'Booking...' : 'Book Appointment'}</Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
