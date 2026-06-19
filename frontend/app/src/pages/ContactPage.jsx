import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data) => {
    try {
      // TODO: Integrate with backend API
      console.log('Contact form:', data)
      toast.success('Message sent! We will get back to you soon.')
      reset()
    } catch {
      toast.error('Failed to send message')
    }
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Contact Us</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <Phone className="w-6 h-6 text-[#E60012] mb-3" />
                <h3 className="font-semibold text-zinc-900 mb-1">Phone</h3>
                <p className="text-zinc-600">+977-1-XXXXXXX</p>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <Mail className="w-6 h-6 text-[#E60012] mb-3" />
                <h3 className="font-semibold text-zinc-900 mb-1">Email</h3>
                <p className="text-zinc-600">info@suzukimotorcycle.com.np</p>
              </div>

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

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" {...register('phone')} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" {...register('subject')} className="mt-1" />
                  {errors.subject && (
                    <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    {...register('message')}
                    rows={6}
                    className="mt-1"
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-[#E60012] hover:bg-[#C5000F]">
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Map */}
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
