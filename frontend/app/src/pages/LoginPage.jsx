import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'
import { login } from '@/api/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bike } from 'lucide-react'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const { login: setAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await login({ username: data.username, password: data.password })
      const role = response.role || 'CLIENT'
      const user = { username: response.username || data.username }
      setAuth(user, response.token, role)
      toast.success('Login successful!')
      if (role === 'ADMIN') {
        navigate('/bikes')
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.message || 'Login failed'
      if (status === 403 && (message.includes('Phone not verified') || message.includes('verify OTP'))) {
        toast.error(message)
        navigate('/verify-otp', { state: { phoneNotVerified: true } })
      } else {
        toast.error(message)
      }
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
            <h1 className="text-2xl font-bold text-zinc-900">Login</h1>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register('username')}
                className="mt-1"
                placeholder="admin"
              />
              {errors.username && (
                <p className="text-[#E60012] text-sm mt-1">{errors.username.message}</p>
              )}
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-[#E60012] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-[#E60012] text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-[#E60012] hover:bg-[#C5000F] text-white" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <p className="text-center text-zinc-600 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#E60012] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
