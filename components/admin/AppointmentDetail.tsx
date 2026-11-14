'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Clock, PlayCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Appointment } from '@prisma/client'

interface AppointmentDetailProps {
  appointment: Appointment & {
    services: Array<{ id: number; service: string }>
  }
}

const workflowSteps = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] as const
const stepLabels: Record<string, string> = {
  APPROVED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

const stepIcons: Record<string, React.ReactNode> = {
  APPROVED: <Clock className="w-5 h-5" />,
  IN_PROGRESS: <PlayCircle className="w-5 h-5" />,
  COMPLETED: <CheckCircle2 className="w-5 h-5" />,
}

const statusColors: Record<string, string> = {
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const stepColors: Record<string, string> = {
  APPROVED: 'bg-blue-600 dark:bg-blue-500',
  IN_PROGRESS: 'bg-yellow-600 dark:bg-yellow-500',
  COMPLETED: 'bg-green-600 dark:bg-green-500',
}

export default function AppointmentDetail({ appointment }: AppointmentDetailProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Only show workflow UI for appointments in the workflow
  const isInWorkflow = workflowSteps.includes(appointment.status as any)
  const currentStepIndex = workflowSteps.indexOf(appointment.status as any)
  const canMoveNext = currentStepIndex !== -1 && currentStepIndex < workflowSteps.length - 1
  const nextStatus = canMoveNext ? workflowSteps[currentStepIndex + 1] : null

  const handleMoveNext = async () => {
    if (!nextStatus) return

    setIsUpdating(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update status')
      }

      router.refresh()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update status'
      setError(errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRetry = () => {
    setError('')
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-800 whitespace-nowrap"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="space-y-6">
          {/* Appointment Details */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Appointment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Client</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{appointment.clientUsername}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Bike Model</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{appointment.bikeModel}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Date</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(appointment.preferredDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Time</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{appointment.preferredTime}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Estimated Cost</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {appointment.estimatedCost ? `₹${appointment.estimatedCost.toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Mechanic</p>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{appointment.mechanicName || '—'}</p>
              </div>
            </div>
          </div>

          {/* Status Workflow Section */}
          {isInWorkflow && (
            <>
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Appointment Status</h3>

                {/* Current Status Badge */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${statusColors[appointment.status]}`}>
                      {stepIcons[appointment.status]}
                      {stepLabels[appointment.status] || appointment.status}
                    </span>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-2">
                    {workflowSteps.map((step, index) => {
                      const isCompleted = index < currentStepIndex || (index === currentStepIndex && appointment.status === step)
                      const isCurrent = index === currentStepIndex
                      return (
                        <div key={step} className="flex items-center gap-3 flex-1">
                          {/* Step Circle */}
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0 ${
                              isCompleted || isCurrent
                                ? stepColors[step]
                                : 'bg-gray-300 dark:bg-gray-700'
                            } ${
                              isCurrent
                                ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-600'
                                : ''
                            } text-white dark:text-white`}
                          >
                            {index + 1}
                          </div>

                          {/* Step Label */}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              isCompleted || isCurrent
                                ? 'text-zinc-900 dark:text-zinc-100'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}>
                              {stepLabels[step]}
                            </p>
                          </div>

                          {/* Connecting Line */}
                          {index < workflowSteps.length - 1 && (
                            <div
                              className={`h-1 flex-shrink-0 ${
                                isCompleted ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
                              }`}
                              style={{ width: '24px' }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Move Next Button */}
                {canMoveNext && (
                  <Button
                    onClick={handleMoveNext}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isUpdating ? 'Updating...' : `Move to ${stepLabels[nextStatus]}`}
                  </Button>
                )}

                {!canMoveNext && currentStepIndex !== -1 && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">This appointment is complete.</p>
                )}
              </div>
            </>
          )}

          {/* Additional Details */}
          {appointment.description && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Description</h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{appointment.description}</p>
            </div>
          )}

          {appointment.repairNotes && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Repair Notes</h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{appointment.repairNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
