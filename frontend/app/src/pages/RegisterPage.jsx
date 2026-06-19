import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register as registerApi } from '@/api/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bike } from 'lucide-react'

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  phoneNumber: z.string().min(1, 'Phone number is required').regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
      }
      const response = await registerApi(payload)
      const message = response?.message || 'Registration successful'
      toast.success(message)
      if (response?.message?.toLowerCase().includes('otp')) {
        navigate('/verify-otp', { state: { phoneNumber: data.phoneNumber } })
      } else {
        navigate('/login')
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#E60012] rounded-xl flex items-center justify-center">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Register</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...registerField('username')}
                className="mt-1 rounded-xl focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:ring-offset-2"
                placeholder="johndoe"
              />
              {errors.username && (
                <p className="text-[#E60012] text-sm mt-1">{errors.username.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...registerField('email')}
                className="mt-1 rounded-xl focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:ring-offset-2"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-[#E60012] text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...registerField('phoneNumber')}
                className="mt-1 rounded-xl focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:ring-offset-2"
                placeholder="98XXXXXXXX"
              />
              {errors.phoneNumber && (
                <p className="text-[#E60012] text-sm mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...registerField('password')}
                className="mt-1 rounded-xl focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:ring-offset-2"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-[#E60012] text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerField('confirmPassword')}
                className="mt-1 rounded-xl focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:ring-offset-2"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-[#E60012] text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-[#E60012] hover:bg-[#C5000F] text-white" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <p className="text-center text-zinc-600 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#E60012] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
