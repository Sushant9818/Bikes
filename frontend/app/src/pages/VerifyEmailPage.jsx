import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Bike } from 'lucide-react'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }
    verifyEmail(token)
      .then(() => {
        setStatus('success')
        toast.success('Email verified successfully!')
      })
      .catch(() => {
        setStatus('error')
        toast.error('Invalid or expired verification link')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#E60012] rounded-xl flex items-center justify-center">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Email Verification</h1>
          </div>

          {status === 'loading' && (
            <>
              <div className="animate-pulse flex justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-[#E60012] rounded-full" />
                <div className="w-2 h-2 bg-[#E60012] rounded-full" />
                <div className="w-2 h-2 bg-[#E60012] rounded-full" />
              </div>
              <p className="text-zinc-600">Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">Email verified!</h2>
              <p className="text-zinc-600 mb-6">Your account is now active. You can log in.</p>
              <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
                <Link to="/login">Login</Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">Verification failed</h2>
              <p className="text-zinc-600 mb-6">This link is invalid or has expired. Please register again or request a new verification email.</p>
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="bg-[#E60012] hover:bg-[#C5000F]">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
