import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { sendOtp, verifyOtp } from '@/api/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bike } from 'lucide-react'

const RESEND_COOLDOWN_SECONDS = 30

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const phoneNumber = location.state?.phoneNumber || ''
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const [phoneInput, setPhoneInput] = useState(phoneNumber)
  const displayPhone = phoneNumber || phoneInput

  useEffect(() => {
    if (phoneNumber) setPhoneInput(phoneNumber)
  }, [phoneNumber])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleVerify = async (e) => {
    e.preventDefault()
    const phone = displayPhone.trim()
    if (!phone || phone.length !== 10) {
      toast.error('Please enter your 10-digit phone number')
      return
    }
    if (!code.trim() || code.length !== 6) {
      toast.error('Please enter the 6-digit code')
      return
    }
    setLoading(true)
    try {
      await verifyOtp(phone, code)
      toast.success('Verified! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    const phone = displayPhone.trim()
    if (!phone || phone.length !== 10) {
      toast.error('Please enter your 10-digit phone number')
      return
    }
    setResendLoading(true)
    try {
      await sendOtp(phone)
      toast.success('Code resent')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  const masked = displayPhone.length >= 6
    ? displayPhone.slice(0, 2) + '******' + displayPhone.slice(-2)
    : '******'

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#E60012] rounded-xl flex items-center justify-center">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Verify Phone</h1>
          </div>
          <p className="text-zinc-600 mb-6 text-center">
            {displayPhone ? (
              <>Enter the 6-digit code sent to <strong>{masked}</strong></>
            ) : (
              'Enter your phone number and the verification code'
            )}
          </p>
          <form onSubmit={handleVerify} className="space-y-6">
            {!phoneNumber && (
              <div>
                <Label htmlFor="phoneNumber">Phone number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="mt-1 rounded-xl focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:ring-offset-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 rounded-xl text-center text-lg tracking-[0.5em] focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:ring-offset-2"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#E60012] hover:bg-[#C5000F] text-white rounded-xl"
              disabled={loading || code.length !== 6 || !displayPhone.trim() || displayPhone.trim().length !== 10}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-[#E60012] hover:bg-[#E60012]/10 rounded-xl"
                disabled={resendCooldown > 0 || resendLoading}
                onClick={handleResend}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : resendLoading
                    ? 'Sending...'
                    : 'Resend code'}
              </Button>
            </div>
          </form>
          <p className="text-center text-zinc-600 text-sm mt-6">
            <Link to="/login" className="font-semibold text-[#E60012] hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
