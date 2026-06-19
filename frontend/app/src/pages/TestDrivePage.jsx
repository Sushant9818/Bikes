import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const testDriveSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone number is required'),
  preferredModel: z.string().optional(),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
})

export default function TestDrivePage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(testDriveSchema),
  })

  const onSubmit = async (data) => {
    try {
      // TODO: Integrate with backend API
      console.log('Test drive booking:', data)
      toast.success('Test drive booking request submitted! We will contact you soon.')
      reset()
    } catch {
      toast.error('Failed to submit booking request')
    }
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Book a Test Drive</h1>
          <p className="text-zinc-600 mb-8">
            Experience the thrill of riding a Suzuki motorcycle or scooter. Fill out the form below and we&apos;ll get in touch with you.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" {...register('name')} className="mt-1" />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} className="mt-1" />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" {...register('phone')} className="mt-1" />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="preferredModel">Preferred Model</Label>
              <Input
                id="preferredModel"
                {...register('preferredModel')}
                placeholder="e.g. Gixxer SF 250"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input id="preferredDate" type="date" {...register('preferredDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="message">Additional Message</Label>
              <Textarea
                id="message"
                {...register('message')}
                rows={4}
                placeholder="Any specific requirements or questions..."
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
              Submit Booking Request
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
