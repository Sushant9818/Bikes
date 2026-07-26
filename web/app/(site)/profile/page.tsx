'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@clerk/nextjs'
import Footer from '@/components/Footer'
import { Badge } from '@/components/ui/badge'

interface MeDto {
  id: number
  username: string
  email: string
  phoneNumber: string | null
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeDto | null>(null)

  useEffect(() => {
    fetch('/api/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
  }, [])

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Profile</h1>

          {me && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Account Information</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <p className="text-sm text-zinc-600 w-full">Phone: {me.phoneNumber || '-'}</p>
                <Badge variant="secondary">{me.role}</Badge>
                <span className="text-xs text-zinc-400">Joined {new Date(me.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <UserProfile
              routing="hash"
              appearance={{ elements: { rootBox: 'w-full', card: 'shadow-none border-0' } }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
