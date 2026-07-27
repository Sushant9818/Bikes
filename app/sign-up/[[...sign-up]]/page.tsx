'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useSignUp } from '@clerk/nextjs/legacy'
import Link from 'next/link'
import { Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const first = (err as { errors?: { message?: string }[] }).errors?.[0]?.message
    if (first) return first
  }
  return fallback
}

type Step = 'form' | 'verify_email' | 'verify_phone'

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#E60012] rounded-xl flex items-center justify-center">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const needsPhoneVerification = () => {
    const fields = signUp?.unverifiedFields ?? []
    return fields.includes('phone_number')
  }

  const advanceAfterVerification = async () => {
    if (!signUp || !setActive) return
    if (needsPhoneVerification()) {
      await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' })
      setCode('')
      setStep('verify_phone')
      return
    }
    if (signUp.status === 'complete') {
      await setActive({ session: signUp.createdSessionId })
      router.push('/')
    } else {
      setError('Registration could not be completed — please try again.')
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    const [firstName, ...rest] = fullName.trim().split(/\s+/)
    const lastName = rest.join(' ') || undefined
    setLoading(true)
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName || undefined,
        lastName,
        phoneNumber: phone.replace(/[\s()-]/g, '') || undefined,
      })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStep('verify_email')
    } catch (err) {
      setError(errorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const onVerifyEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      await signUp.attemptEmailAddressVerification({ code })
      await advanceAfterVerification()
    } catch (err) {
      setError(errorMessage(err, 'Invalid verification code'))
    } finally {
      setLoading(false)
    }
  }

  const onVerifyPhone = async (e: FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setError('')
    setLoading(true)
    try {
      const result = await signUp.attemptPhoneNumberVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
      } else {
        setError('Verification incomplete — please try again.')
      }
    } catch (err) {
      setError(errorMessage(err, 'Invalid verification code'))
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify_email') {
    return (
      <CardShell title="Verify Email">
        <p className="text-center text-zinc-600 text-sm mb-6">
          We sent a verification code to <span className="font-medium">{email}</span>. Enter it below.
        </p>
        <form onSubmit={onVerifyEmail} className="space-y-6">
          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1"
              placeholder="123456"
              required
            />
          </div>
          {error && <p className="text-[#E60012] text-sm">{error}</p>}
          <Button type="submit" className="w-full bg-[#E60012] hover:bg-[#C5000F] text-white" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </CardShell>
    )
  }

  if (step === 'verify_phone') {
    return (
      <CardShell title="Verify Phone">
        <p className="text-center text-zinc-600 text-sm mb-6">
          We sent a verification code to <span className="font-medium">{phone}</span>. Enter it below.
        </p>
        <form onSubmit={onVerifyPhone} className="space-y-6">
          <div>
            <Label htmlFor="phoneCode">Verification Code</Label>
            <Input
              id="phoneCode"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1"
              placeholder="123456"
              required
            />
          </div>
          {error && <p className="text-[#E60012] text-sm">{error}</p>}
          <Button type="submit" className="w-full bg-[#E60012] hover:bg-[#C5000F] text-white" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </CardShell>
    )
  }

  return (
    <CardShell title="Register">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1"
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            placeholder="john@example.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1"
            placeholder="+977 98XXXXXXXX"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="••••••••"
            minLength={8}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1"
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="text-[#E60012] text-sm">{error}</p>}
        <div id="clerk-captcha" />
        <Button
          type="submit"
          className="w-full bg-[#E60012] hover:bg-[#C5000F] text-white"
          disabled={loading || !isLoaded}
        >
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
      <p className="text-center text-zinc-600 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-[#E60012] hover:underline">
          Login
        </Link>
      </p>
    </CardShell>
  )
}
