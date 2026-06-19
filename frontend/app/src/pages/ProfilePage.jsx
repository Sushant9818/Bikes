import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getMe, updateMe, changePassword } from '@/api/users'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Footer from '@/components/Footer'

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [emailChanged, setEmailChanged] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(profileSchema),
  })

  const { register: registerPwd, handleSubmit: handleSubmitPwd, formState: { errors: pwdErrors }, reset: resetPwd } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    getMe()
      .then((data) => {
        setProfile(data)
        reset({ username: data.username, email: data.email })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [reset])

  const onProfileSubmit = async (data) => {
    setSaving(true)
    try {
      const updated = await updateMe({ username: data.username, email: data.email })
      setProfile(updated)
      if (data.email !== profile.email) {
        setEmailChanged(true)
        toast.success('Profile updated. Verification required for new email.')
      } else {
        toast.success('Profile updated')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const onPasswordSubmit = async (data) => {
    setPasswordSaving(true)
    try {
      await changePassword(data.currentPassword, data.newPassword)
      toast.success('Password updated')
      resetPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Profile</h1>

          {emailChanged && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              Verification required again. Check your new email for a verification link.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Account Information</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <p className="text-sm text-zinc-600 w-full">Phone: {profile?.phoneNumber || '-'}</p>

              <Badge variant="secondary">{profile?.role}</Badge>
              {profile?.emailVerifiedAt ? (
                <Badge variant="default" className="bg-green-600">Verified</Badge>
              ) : (
                <Badge variant="destructive">Not verified</Badge>
              )}
            </div>
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input {...register('username')} className="mt-1" />
                {errors.username && <p className="text-[#E60012] text-sm mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...register('email')} className="mt-1" />
                {errors.email && <p className="text-[#E60012] text-sm mt-1">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="bg-[#E60012] hover:bg-[#C5000F]" disabled={saving}>
                {saving ? 'Saving...' : 'Update Profile'}
              </Button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Change Password</h2>
            <form onSubmit={handleSubmitPwd(onPasswordSubmit)} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input type="password" {...registerPwd('currentPassword')} className="mt-1" />
                {pwdErrors.currentPassword && <p className="text-[#E60012] text-sm mt-1">{pwdErrors.currentPassword.message}</p>}
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" {...registerPwd('newPassword')} className="mt-1" />
                {pwdErrors.newPassword && <p className="text-[#E60012] text-sm mt-1">{pwdErrors.newPassword.message}</p>}
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" {...registerPwd('confirmPassword')} className="mt-1" />
                {pwdErrors.confirmPassword && <p className="text-[#E60012] text-sm mt-1">{pwdErrors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" variant="outline" disabled={passwordSaving}>
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
