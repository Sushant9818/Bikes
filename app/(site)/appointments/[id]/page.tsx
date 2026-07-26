'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { STATUS_CONFIG, getServiceLabel, TIME_SLOTS } from '@/lib/appointmentConstants'
import type { AppointmentDto } from '@/lib/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/LoadingSpinner'
import Footer from '@/components/Footer'

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
}

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'

  const [appt, setAppt] = useState<AppointmentDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusForm, setStatusForm] = useState({ status: '', mechanicName: '', estimatedCost: '', finalCost: '', serviceNotes: '', repairNotes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AppointmentDto | null) => {
        setAppt(data)
        if (data) {
          setStatusForm({
            status: data.status, mechanicName: data.mechanicName ?? '',
            estimatedCost: data.estimatedCost?.toString() ?? '', finalCost: data.finalCost?.toString() ?? '',
            serviceNotes: data.serviceNotes ?? '', repairNotes: data.repairNotes ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: statusForm.status,
        mechanicName: statusForm.mechanicName || null,
        estimatedCost: statusForm.estimatedCost ? Number(statusForm.estimatedCost) : null,
        finalCost: statusForm.finalCost ? Number(statusForm.finalCost) : null,
        serviceNotes: statusForm.serviceNotes || null,
        repairNotes: statusForm.repairNotes || null,
      }),
    })
    setSaving(false)
    if (res.ok) setAppt(await res.json())
  }

  if (loading) return <LoadingSpinner className="min-h-[60vh]" label="Loading..." />
  if (!appt) return <div className="py-24 text-center text-zinc-500">Appointment not found.</div>

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="text-zinc-500 text-sm mb-6">← Back</button>
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-zinc-900">Appointment #{appt.id}</h1>
            <StatusBadge status={appt.status} />
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Bike Details</h2>
            <p className="text-sm text-zinc-700">Model: {appt.bikeModel}</p>
            {appt.bikeYear && <p className="text-sm text-zinc-700">Year: {appt.bikeYear}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Services Requested</h2>
            <div className="flex flex-wrap gap-2">
              {appt.services.map((s) => <span key={s} className="bg-[#E60012]/10 text-[#E60012] text-sm font-medium px-3 py-1 rounded-full">{getServiceLabel(s)}</span>)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Schedule</h2>
            <p className="text-sm text-zinc-700">Date: {appt.preferredDate.toString().slice(0, 10)}</p>
            <p className="text-sm text-zinc-700">Time: {appt.preferredTime}</p>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
              <h2 className="font-semibold text-zinc-900 mb-5">Update Appointment (Admin)</h2>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <select value={statusForm.status} onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))} className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white">
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
                  </select>
                </div>
                <div><Label>Assign Mechanic</Label><Input value={statusForm.mechanicName} onChange={(e) => setStatusForm((p) => ({ ...p, mechanicName: e.target.value }))} className="mt-1 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Estimated Cost (Rs)</Label><Input type="number" value={statusForm.estimatedCost} onChange={(e) => setStatusForm((p) => ({ ...p, estimatedCost: e.target.value }))} className="mt-1 rounded-xl" /></div>
                  <div><Label>Final Cost (Rs)</Label><Input type="number" value={statusForm.finalCost} onChange={(e) => setStatusForm((p) => ({ ...p, finalCost: e.target.value }))} className="mt-1 rounded-xl" /></div>
                </div>
                <div><Label>Service Notes</Label><textarea value={statusForm.serviceNotes} onChange={(e) => setStatusForm((p) => ({ ...p, serviceNotes: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" /></div>
                <div><Label>Repair Notes</Label><textarea value={statusForm.repairNotes} onChange={(e) => setStatusForm((p) => ({ ...p, repairNotes: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" /></div>
                <Button type="submit" disabled={saving} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">{saving ? 'Saving...' : 'Save Changes'}</Button>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
