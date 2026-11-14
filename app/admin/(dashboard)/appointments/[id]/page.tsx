import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AppointmentDetail from '@/components/admin/AppointmentDetail'
import { ApiError } from '@/lib/api-error'
import AppointmentErrorUI from '@/components/admin/AppointmentErrorUI'

type Params = { params: Promise<{ id: string }> }

interface AppointmentWithServices {
  id: number
  userId: number | null
  clientUsername: string
  bikeModel: string
  bikeYear: number | null
  registrationNumber: string | null
  vin: string | null
  mileage: number | null
  customService: string | null
  description: string | null
  preferredDate: Date
  preferredTime: string
  status: string
  estimatedCost: number | null
  finalCost: number | null
  repairNotes: string | null
  serviceNotes: string | null
  mechanicName: string | null
  createdAt: Date
  services: Array<{
    id: number
    service: string
  }>
}

async function getAppointment(id: string): Promise<AppointmentWithServices> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: parseInt(id) },
    include: {
      services: {
        select: {
          id: true,
          service: true,
        },
      },
    },
  })

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found')
  }

  return appointment as AppointmentWithServices
}

function AppointmentDetailLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#E60012]" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading appointment...</p>
      </div>
    </div>
  )
}

export default async function AppointmentDetailPage({ params }: Params) {
  const { id } = await params
  let appointment: AppointmentWithServices | null = null
  let error: string | null = null

  try {
    appointment = await getAppointment(id)
  } catch (err) {
    error = err instanceof ApiError ? err.message : 'Failed to load appointment'
  }

  if (error) {
    return <AppointmentErrorUI error={error} appointmentId={id} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/appointments"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Appointment Details</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Appointment #{appointment?.id}</p>
          </div>
        </div>
      </div>

      {/* Detail Content */}
      <Suspense fallback={<AppointmentDetailLoader />}>
        <AppointmentDetail appointment={appointment!} />
      </Suspense>
    </div>
  )
}
