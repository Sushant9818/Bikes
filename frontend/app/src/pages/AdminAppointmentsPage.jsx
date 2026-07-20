import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getAllAppointments, getAppointmentStats, deleteAppointment,
  STATUS_CONFIG, getServiceLabel
} from '@/api/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import { toast } from 'sonner'
import { Search, Eye, Trash2, CalendarDays, Clock, RefreshCw } from 'lucide-react'

const STATUSES = ['', 'PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-600' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
}

function StatCard({ label, value, color = 'text-zinc-900' }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
      <p className="text-zinc-500 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [filters, setFilters] = useState({ status: '', date: '', client: '', bikeModel: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.date) params.date = filters.date
      if (filters.client.trim()) params.client = filters.client.trim()
      if (filters.bikeModel.trim()) params.bikeModel = filters.bikeModel.trim()
      const [data, statsData] = await Promise.all([
        getAllAppointments(params),
        getAppointmentStats(),
      ])
      setAppointments(Array.isArray(data) ? data : [])
      setStats(statsData)
    } catch {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAppointment(deleteTarget.id)
      toast.success('Appointment deleted')
      setDeleteTarget(null)
      fetchData()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Service Appointments</h1>
              <p className="text-zinc-500 text-sm mt-1">{appointments.length} result(s)</p>
            </div>
            <Button variant="outline" className="rounded-xl gap-2" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <StatCard label="Today" value={stats.todayCount} color="text-blue-600" />
              <StatCard label="Pending" value={stats.pendingCount} color="text-yellow-600" />
              <StatCard label="In Progress" value={stats.inProgressCount} color="text-purple-600" />
              <StatCard label="Completed" value={stats.completedCount} color="text-green-600" />
              <StatCard label="Monthly Revenue" value={`Rs. ${(stats.monthlyRevenue || 0).toLocaleString()}`} color="text-[#E60012]" />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s ? (STATUS_CONFIG[s]?.label ?? s) : 'All Statuses'}</option>
                ))}
              </select>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
                className="rounded-xl"
              />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search client..."
                  value={filters.client}
                  onChange={(e) => setFilters((p) => ({ ...p, client: e.target.value }))}
                  className="pl-9 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Bike model..."
                  value={filters.bikeModel}
                  onChange={(e) => setFilters((p) => ({ ...p, bikeModel: e.target.value }))}
                  className="rounded-xl"
                />
                <Button onClick={fetchData} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl shrink-0">
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <LoadingSpinner className="py-20" label="Loading..." />
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-500 font-medium">No appointments found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      {['#', 'Client', 'Bike', 'Services', 'Date & Time', 'Status', 'Cost', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{appt.id}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">{appt.clientUsername}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-zinc-900 whitespace-nowrap">{appt.bikeModel}</p>
                          {appt.bikeYear && <p className="text-zinc-400 text-xs">{appt.bikeYear}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {appt.services?.slice(0, 2).map((s) => (
                              <span key={s} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full whitespace-nowrap">{getServiceLabel(s)}</span>
                            ))}
                            {appt.services?.length > 2 && (
                              <span className="text-xs text-zinc-400">+{appt.services.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="flex items-center gap-1 text-zinc-700"><CalendarDays className="w-3 h-3" />{appt.preferredDate}</p>
                          <p className="flex items-center gap-1 text-zinc-400 text-xs mt-0.5"><Clock className="w-3 h-3" />{appt.preferredTime}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={appt.status} /></td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {appt.finalCost
                            ? <span className="text-green-700 font-semibold">Rs. {appt.finalCost.toLocaleString()}</span>
                            : appt.estimatedCost
                            ? <span className="text-zinc-500">~Rs. {appt.estimatedCost.toLocaleString()}</span>
                            : <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link to={`/appointments/${appt.id}`}>
                              <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => setDeleteTarget(appt)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Appointment"
        itemName={`${deleteTarget?.clientUsername} – ${deleteTarget?.bikeModel}`}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Footer />
    </>
  )
}
