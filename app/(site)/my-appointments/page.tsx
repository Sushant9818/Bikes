'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { STATUS_CONFIG, getServiceLabel, TIME_SLOTS } from '@/lib/appointmentConstants'
import type { AppointmentDto } from '@/lib/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import { Plus, Wrench, CalendarDays, Clock, Eye, XCircle, RefreshCw, X } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
}

function RescheduleModal({ appt, onClose, onSuccess }: { appt: AppointmentDto; onClose: () => void; onSuccess: () => void }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(appt.preferredDate.toString().slice(0, 10))
  const [time, setTime] = useState(appt.preferredTime)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/appointments/${appt.id}/reschedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bikeModel: appt.bikeModel, preferredDate: date, preferredTime: time }),
    })
    setSaving(false)
    if (res.ok) { onSuccess() } else { const body = await res.json().catch(() => ({})); setError(body.message ?? 'Failed to reschedule') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="font-bold text-zinc-900 text-lg">Reschedule Appointment</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div><Label htmlFor="rs-date">New Date</Label><Input id="rs-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded-xl" required /></div>
          <div>
            <Label htmlFor="rs-time">New Time Slot</Label>
            <select id="rs-time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white" required>
              <option value="">Select a time slot</option>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving} className="flex-1 bg-[#E60012] hover:bg-[#C5000F] rounded-xl">{saving ? 'Saving...' : 'Confirm Reschedule'}</Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MyAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<AppointmentDto | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentDto | null>(null)

  const fetchAppointments = async () => {
    setLoading(true)
    const res = await fetch('/api/appointments/my')
    setAppointments(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchAppointments() }, [])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    await fetch(`/api/appointments/${cancelTarget.id}/cancel`, { method: 'PUT' })
    setCancelling(false)
    setCancelTarget(null)
    fetchAppointments()
  }

  return (
    <>
      {rescheduleTarget && (
        <RescheduleModal appt={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onSuccess={() => { setRescheduleTarget(null); fetchAppointments() }} />
      )}

      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">My Service Appointments</h1>
            <Button onClick={() => router.push('/book-service')} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl"><Plus className="w-4 h-4 mr-2" /> Book Service</Button>
          </div>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading appointments..." />
          ) : appointments.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Wrench className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium">No appointments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2"><StatusBadge status={appt.status} /><span className="text-xs text-zinc-400">#{appt.id}</span></div>
                      <h3 className="font-bold text-zinc-900 text-lg">{appt.bikeModel}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {appt.services.slice(0, 3).map((s) => <span key={s} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">{getServiceLabel(s)}</span>)}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {appt.preferredDate.toString().slice(0, 10)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {appt.preferredTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link href={`/appointments/${appt.id}`}><Button size="sm" variant="outline" className="rounded-xl"><Eye className="w-4 h-4 mr-1" /> View</Button></Link>
                      {appt.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="outline" className="rounded-xl text-blue-600 border-blue-200" onClick={() => setRescheduleTarget(appt)}><RefreshCw className="w-4 h-4 mr-1" /> Reschedule</Button>
                          <Button size="sm" variant="outline" className="rounded-xl text-red-600 border-red-200" onClick={() => setCancelTarget(appt)}><XCircle className="w-4 h-4 mr-1" /> Cancel</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)} title="Cancel Appointment" itemName={`${cancelTarget?.bikeModel}`} onConfirm={handleCancel} loading={cancelling} />
      <Footer />
    </>
  )
}
