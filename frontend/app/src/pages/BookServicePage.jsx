import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAppointment, SERVICE_TYPES, TIME_SLOTS } from '@/api/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Footer from '@/components/Footer'
import { toast } from 'sonner'
import { Wrench, CalendarDays, Clock, Bike, CheckSquare, Square } from 'lucide-react'

const schema = z.object({
  bikeModel: z.string().min(1, 'Bike model is required'),
  bikeYear: z.number({ invalid_type_error: 'Enter a valid year' }).min(1980).max(new Date().getFullYear() + 1).nullable().optional(),
  registrationNumber: z.string().optional(),
  vin: z.string().optional(),
  mileage: z.number({ invalid_type_error: 'Enter a valid mileage' }).min(0).nullable().optional(),
  preferredDate: z.string().min(1, 'Please select a date'),
  preferredTime: z.string().min(1, 'Please select a time slot'),
  description: z.string().optional(),
  customService: z.string().optional(),
})

export default function BookServicePage() {
  const navigate = useNavigate()
  const [selectedServices, setSelectedServices] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { bikeModel: '', preferredDate: '', preferredTime: '' },
  })

  const showCustom = selectedServices.includes('OTHER')

  const toggleService = (value) => {
    setSelectedServices((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    )
  }

  const onSubmit = async (data) => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }
    setSubmitting(true)
    try {
      await createAppointment({
        bikeModel: data.bikeModel,
        bikeYear: data.bikeYear || null,
        registrationNumber: data.registrationNumber || null,
        vin: data.vin || null,
        mileage: data.mileage || null,
        services: selectedServices,
        customService: showCustom ? data.customService : null,
        description: data.description || null,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
      })
      toast.success('Appointment booked! We will confirm shortly.')
      navigate('/my-appointments')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#E60012] rounded-xl flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Book a Service Appointment</h1>
              <p className="text-zinc-500 text-sm">Fill in your bike details and choose a preferred time</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Bike Details */}
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 mb-5">
                <Bike className="w-4 h-4 text-[#E60012]" /> Bike Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Bike Model *</Label>
                  <Input {...register('bikeModel')} placeholder="e.g. Gixxer SF 250" className="mt-1 rounded-xl" />
                  {errors.bikeModel && <p className="text-[#E60012] text-sm mt-1">{errors.bikeModel.message}</p>}
                </div>
                <div>
                  <Label>Bike Year</Label>
                  <Input type="number" {...register('bikeYear', { valueAsNumber: true })} placeholder="e.g. 2022" className="mt-1 rounded-xl" />
                  {errors.bikeYear && <p className="text-[#E60012] text-sm mt-1">{errors.bikeYear.message}</p>}
                </div>
                <div>
                  <Label>Current Mileage (km)</Label>
                  <Input type="number" {...register('mileage', { valueAsNumber: true })} placeholder="e.g. 12000" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label>Registration Number</Label>
                  <Input {...register('registrationNumber')} placeholder="e.g. BA 1 CHA 1234" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label>VIN (optional)</Label>
                  <Input {...register('vin')} placeholder="Vehicle Identification Number" className="mt-1 rounded-xl" />
                </div>
              </div>
            </section>

            {/* Service Selection */}
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 mb-2">
                <CheckSquare className="w-4 h-4 text-[#E60012]" /> Select Services *
              </h2>
              <p className="text-zinc-500 text-sm mb-4">Choose one or more services needed</p>
              {selectedServices.length === 0 && (
                <p className="text-[#E60012] text-sm mb-3">Please select at least one service</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SERVICE_TYPES.map(({ value, label }) => {
                  const active = selectedServices.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleService(value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                        active
                          ? 'border-[#E60012] bg-[#E60012]/5 text-[#E60012]'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {active
                        ? <CheckSquare className="w-4 h-4 shrink-0" />
                        : <Square className="w-4 h-4 shrink-0 text-zinc-400" />}
                      {label}
                    </button>
                  )
                })}
              </div>
              {showCustom && (
                <div className="mt-4">
                  <Label>Describe the other service</Label>
                  <Input {...register('customService')} placeholder="Describe the service needed..." className="mt-1 rounded-xl" />
                </div>
              )}
            </section>

            {/* Schedule */}
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 mb-5">
                <CalendarDays className="w-4 h-4 text-[#E60012]" /> Schedule
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Date *</Label>
                  <Input type="date" min={today} {...register('preferredDate')} className="mt-1 rounded-xl" />
                  {errors.preferredDate && <p className="text-[#E60012] text-sm mt-1">{errors.preferredDate.message}</p>}
                </div>
                <div>
                  <Label>Preferred Time *</Label>
                  <select
                    {...register('preferredTime')}
                    className="w-full mt-1 h-10 px-3 border border-zinc-200 rounded-xl text-sm bg-white"
                  >
                    <option value="">Select a time slot</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.preferredTime && <p className="text-[#E60012] text-sm mt-1">{errors.preferredTime.message}</p>}
                </div>
              </div>
            </section>

            {/* Description */}
            <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 mb-4">Issue Description</h2>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Describe any issues, symptoms, or special requests..."
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y"
              />
            </section>

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl px-8">
                {submitting ? 'Booking...' : 'Book Appointment'}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
