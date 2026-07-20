import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getMyAppointments, cancelAppointment, STATUS_CONFIG, getServiceLabel } from '@/api/appointments'
import { Button } from '@/components/ui/button'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import { toast } from 'sonner'
import { Plus, Wrench, CalendarDays, Clock, Eye, XCircle } from 'lucide-react'

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const data = await getMyAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointment(cancelTarget.id)
      toast.success('Appointment cancelled')
      setCancelTarget(null)
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">My Service Appointments</h1>
              <p className="text-zinc-500 text-sm mt-1">{appointments.length} appointment(s)</p>
            </div>
            <Button onClick={() => navigate('/book-service')} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Book Service
            </Button>
          </div>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading appointments..." />
          ) : appointments.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Wrench className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium">No appointments yet</p>
              <p className="text-zinc-400 text-sm mt-1">Book your first bike service appointment</p>
              <Button onClick={() => navigate('/book-service')} className="mt-4 bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
                Book Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={appt.status} />
                        <span className="text-xs text-zinc-400">#{appt.id}</span>
                      </div>
                      <h3 className="font-bold text-zinc-900 text-lg">{appt.bikeModel}</h3>
                      {appt.bikeYear && <p className="text-zinc-500 text-sm">Year: {appt.bikeYear}</p>}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {appt.services?.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
                            {getServiceLabel(s)}
                          </span>
                        ))}
                        {appt.services?.length > 3 && (
                          <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                            +{appt.services.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" /> {appt.preferredDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {appt.preferredTime}
                        </span>
                      </div>

                      {appt.mechanicName && (
                        <p className="text-sm text-zinc-500 mt-1">Mechanic: <span className="font-medium text-zinc-700">{appt.mechanicName}</span></p>
                      )}
                      {appt.estimatedCost && (
                        <p className="text-sm text-zinc-500 mt-1">Estimated: <span className="font-semibold text-zinc-900">Rs. {appt.estimatedCost.toLocaleString()}</span></p>
                      )}
                      {appt.finalCost && (
                        <p className="text-sm text-zinc-500 mt-1">Final Cost: <span className="font-semibold text-green-700">Rs. {appt.finalCost.toLocaleString()}</span></p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Link to={`/appointments/${appt.id}`}>
                        <Button size="sm" variant="outline" className="rounded-xl">
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </Link>
                      {appt.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setCancelTarget(appt)}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={!!cancelTarget}
        onOpenChange={() => setCancelTarget(null)}
        title="Cancel Appointment"
        itemName={`${cancelTarget?.bikeModel} on ${cancelTarget?.preferredDate}`}
        onConfirm={handleCancel}
        loading={cancelling}
      />

      <Footer />
    </>
  )
}
