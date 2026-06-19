import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '@/api/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bike } from 'lucide-react'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
})

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await forgotPassword(data.email)
      setSent(true)
      toast.success('If an account exists with this email, you will receive a password reset link')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Check your email</h1>
            <p className="text-zinc-600 mb-6">If an account exists with that email address, you will receive a password reset link shortly.</p>
            <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#E60012] rounded-xl flex items-center justify-center">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Forgot Password</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} className="mt-1" placeholder="you@example.com" />
              {errors.email && <p className="text-[#E60012] text-sm mt-1">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-[#E60012] hover:bg-[#C5000F] text-white" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
          <p className="text-center text-zinc-600 text-sm mt-6">
            Remember your password? <Link to="/login" className="font-semibold text-[#E60012] hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
