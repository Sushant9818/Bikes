import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import {
  getAppointmentById, updateAppointmentStatus, rescheduleAppointment,
  STATUS_CONFIG, getServiceLabel, TIME_SLOTS
} from '@/api/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LoadingSpinner from '@/components/LoadingSpinner'
import Footer from '@/components/Footer'
import { toast } from 'sonner'
import { ArrowLeft, Wrench, CalendarDays, Clock, User, DollarSign } from 'lucide-react'

const STATUSES = ['PENDING','APPROVED','REJECTED','IN_PROGRESS','COMPLETED','CANCELLED']

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-zinc-100 last:border-0">
      <span className="text-zinc-500 text-sm w-40 shrink-0">{label}</span>
      <span className="text-zinc-900 text-sm font-medium">{value}</span>
    </div>
  )
}

export default function AppointmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const admin = isAdmin()

  const [appt, setAppt] = useState(null)
  const [loading, setLoading] = useState(true)

  // Admin update state
  const [statusForm, setStatusForm] = useState({ status: '', repairNotes: '', serviceNotes: '', mechanicName: '', estimatedCost: '', finalCost: '' })
  const [saving, setSaving] = useState(false)

  // Client reschedule state
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleForm, setRescheduleForm] = useState({ preferredDate: '', preferredTime: '' })
  const [rescheduling, setRescheduling] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAppointmentById(id)
      .then((data) => {
        setAppt(data)
        setStatusForm({
          status: data.status,
          repairNotes: data.repairNotes || '',
          serviceNotes: data.serviceNotes || '',
          mechanicName: data.mechanicName || '',
          estimatedCost: data.estimatedCost || '',
          finalCost: data.finalCost || '',
        })
        setRescheduleForm({ preferredDate: data.preferredDate, preferredTime: data.preferredTime })
      })
      .catch(() => toast.error('Failed to load appointment'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateAppointmentStatus(id, {
        status: statusForm.status,
        repairNotes: statusForm.repairNotes || null,
        serviceNotes: statusForm.serviceNotes || null,
        mechanicName: statusForm.mechanicName || null,
        estimatedCost: statusForm.estimatedCost ? Number(statusForm.estimatedCost) : null,
        finalCost: statusForm.finalCost ? Number(statusForm.finalCost) : null,
      })
      setAppt(updated)
      toast.success('Appointment updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleReschedule = async (e) => {
    e.preventDefault()
    setRescheduling(true)
    try {
      const updated = await rescheduleAppointment(id, {
        bikeModel: appt.bikeModel,
        preferredDate: rescheduleForm.preferredDate,
        preferredTime: rescheduleForm.preferredTime,
      })
      setAppt(updated)
      setShowReschedule(false)
      toast.success('Appointment rescheduled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule')
    } finally {
      setRescheduling(false)
    }
  }

  if (loading) return <LoadingSpinner className="min-h-[60vh]" label="Loading..." />
  if (!appt) return null

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-3xl mx-auto">

          {/* Back + header */}
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Appointment #{appt.id}</h1>
              <p className="text-zinc-500 text-sm mt-1">Booked on {new Date(appt.createdAt).toLocaleDateString()}</p>
            </div>
            <StatusBadge status={appt.status} />
          </div>

          {/* Bike Info */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-[#E60012]" /> Bike Details
            </h2>
            <InfoRow label="Bike Model" value={appt.bikeModel} />
            <InfoRow label="Year" value={appt.bikeYear} />
            <InfoRow label="Registration No." value={appt.registrationNumber} />
            <InfoRow label="VIN" value={appt.vin} />
            <InfoRow label="Mileage" value={appt.mileage ? `${appt.mileage.toLocaleString()} km` : null} />
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Services Requested</h2>
            <div className="flex flex-wrap gap-2">
              {appt.services?.map((s) => (
                <span key={s} className="bg-[#E60012]/10 text-[#E60012] text-sm font-medium px-3 py-1 rounded-full">
                  {getServiceLabel(s)}
                </span>
              ))}
            </div>
            {appt.customService && <p className="text-zinc-600 text-sm mt-3">Custom: {appt.customService}</p>}
            {appt.description && (
              <div className="mt-4 bg-zinc-50 rounded-xl p-3 text-sm text-zinc-700">
                <p className="font-medium text-zinc-500 mb-1">Issue Description</p>
                {appt.description}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
            <h2 className="font-semibold text-zinc-900 flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-[#E60012]" /> Schedule
            </h2>
            <InfoRow label="Preferred Date" value={appt.preferredDate} />
            <InfoRow label="Preferred Time" value={appt.preferredTime} />
            {admin && <InfoRow label="Client" value={appt.clientUsername} />}
          </div>

          {/* Service Notes / Costs (visible when set) */}
          {(appt.mechanicName || appt.serviceNotes || appt.repairNotes || appt.estimatedCost || appt.finalCost) && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-[#E60012]" /> Service Details
              </h2>
              <InfoRow label="Mechanic" value={appt.mechanicName} />
              <InfoRow label="Estimated Cost" value={appt.estimatedCost ? `Rs. ${appt.estimatedCost.toLocaleString()}` : null} />
              <InfoRow label="Final Cost" value={appt.finalCost ? `Rs. ${appt.finalCost.toLocaleString()}` : null} />
              {appt.serviceNotes && (
                <div className="mt-3">
                  <p className="text-zinc-500 text-sm mb-1">Service Notes</p>
                  <p className="text-zinc-800 text-sm bg-zinc-50 rounded-xl p-3">{appt.serviceNotes}</p>
                </div>
              )}
              {appt.repairNotes && (
                <div className="mt-3">
                  <p className="text-zinc-500 text-sm mb-1">Repair Notes</p>
                  <p className="text-zinc-800 text-sm bg-zinc-50 rounded-xl p-3">{appt.repairNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Admin Update Panel */}
          {admin && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
              <h2 className="font-semibold text-zinc-900 mb-5">Update Appointment (Admin)</h2>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Assign Mechanic</Label>
                  <Input value={statusForm.mechanicName} onChange={(e) => setStatusForm((p) => ({ ...p, mechanicName: e.target.value }))} placeholder="Mechanic name" className="mt-1 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Estimated Cost (Rs)</Label>
                    <Input type="number" value={statusForm.estimatedCost} onChange={(e) => setStatusForm((p) => ({ ...p, estimatedCost: e.target.value }))} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label>Final Cost (Rs)</Label>
                    <Input type="number" value={statusForm.finalCost} onChange={(e) => setStatusForm((p) => ({ ...p, finalCost: e.target.value }))} className="mt-1 rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label>Service Notes</Label>
                  <textarea value={statusForm.serviceNotes} onChange={(e) => setStatusForm((p) => ({ ...p, serviceNotes: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" />
                </div>
                <div>
                  <Label>Repair Notes</Label>
                  <textarea value={statusForm.repairNotes} onChange={(e) => setStatusForm((p) => ({ ...p, repairNotes: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y" />
                </div>
                <Button type="submit" disabled={saving} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          )}

          {/* Client Reschedule */}
          {!admin && appt.status === 'PENDING' && (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-zinc-900">Reschedule</h2>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowReschedule((p) => !p)}>
                  {showReschedule ? 'Cancel' : 'Reschedule'}
                </Button>
              </div>
              {showReschedule && (
                <form onSubmit={handleReschedule} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>New Date</Label>
                      <Input type="date" min={today} value={rescheduleForm.preferredDate} onChange={(e) => setRescheduleForm((p) => ({ ...p, preferredDate: e.target.value }))} className="mt-1 rounded-xl" required />
                    </div>
                    <div>
                      <Label>New Time</Label>
                      <select value={rescheduleForm.preferredTime} onChange={(e) => setRescheduleForm((p) => ({ ...p, preferredTime: e.target.value }))} className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white" required>
                        <option value="">Select time</option>
                        {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <Button type="submit" disabled={rescheduling} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
                    {rescheduling ? 'Saving...' : 'Confirm Reschedule'}
                  </Button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
