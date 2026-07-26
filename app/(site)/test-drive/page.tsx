'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TestDrivePage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', preferredDate: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/test-drive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, email: form.email || null, preferredDate: form.preferredDate || null, message: form.message || null }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSent(true)
      setForm({ name: '', email: '', phone: '', preferredDate: '', message: '' })
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to submit booking request')
    }
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Book a Test Drive</h1>
          <p className="text-zinc-600 mb-8">Experience the thrill of riding a Suzuki motorcycle or scooter.</p>

          {sent ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm text-center">
              <p className="text-zinc-700 font-medium">Test drive booking request submitted! We will contact you soon.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div><Label htmlFor="name">Full Name *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" /></div>
              <div><Label htmlFor="phone">Phone Number *</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="mt-1" /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label htmlFor="preferredDate">Preferred Date</Label><Input id="preferredDate" type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="mt-1" /></div>
              <div><Label htmlFor="message">Additional Message</Label><Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="mt-1" /></div>
              <Button type="submit" disabled={submitting} className="w-full bg-[#E60012] hover:bg-[#C5000F]">{submitting ? 'Submitting...' : 'Submit Booking Request'}</Button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
