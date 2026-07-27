'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, phone: form.phone || null, subject: form.subject || null }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSent(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to send message')
    }
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Contact Us</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><Phone className="w-6 h-6 text-[#E60012] mb-3" /><h3 className="font-semibold text-zinc-900 mb-1">Phone</h3><p className="text-zinc-600">+977-1-XXXXXXX</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm"><Mail className="w-6 h-6 text-[#E60012] mb-3" /><h3 className="font-semibold text-zinc-900 mb-1">Email</h3><p className="text-zinc-600">info@suzukimotorcycle.com.np</p></div>
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <MapPin className="w-6 h-6 text-[#E60012] mb-3" />
                <h3 className="font-semibold text-zinc-900 mb-1">Address</h3>
                <p className="text-zinc-600">Balkumari, Lalitpur, Nepal</p>
                <a
                  href="https://www.openstreetmap.org/?mlat=27.6697&mlon=85.3261#map=16/27.6697/85.3261"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E60012] text-sm mt-2 inline-block hover:underline"
                >
                  Open in maps →
                </a>
              </div>
            </div>
            <div className="lg:col-span-2">
              {sent ? (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm text-center">
                  <p className="text-zinc-700 font-medium">Message sent! We will get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div><Label htmlFor="name">Full Name *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
                  <div><Label htmlFor="subject">Subject *</Label><Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="mt-1" /></div>
                  <div><Label htmlFor="message">Message *</Label><Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} required className="mt-1" /></div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#E60012] hover:bg-[#C5000F]">{submitting ? 'Sending...' : 'Send Message'}</Button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#E60012]" />
              <h2 className="text-xl font-bold text-zinc-900">Find Us</h2>
            </div>
            <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
              <iframe
                title="Suzuki Motorcycle Nepal — Balkumari, Lalitpur"
                src="https://www.openstreetmap.org/export/embed.html?bbox=85.3161%2C27.6647%2C85.3361%2C27.6747&layer=mapnik&marker=27.6697%2C85.3261"
                width="100%"
                height="420"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-zinc-400 mt-2 text-right">
              Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> contributors
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
