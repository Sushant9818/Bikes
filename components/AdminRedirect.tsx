'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export function AdminRedirect() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    if (user) {
      const role = (user.publicMetadata?.role as string | undefined) ?? 'USER'
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        const currentPath = window.location.pathname
        // Only redirect if on home or sign-up/sign-in pages
        if (currentPath === '/' || currentPath === '/sign-in' || currentPath === '/sign-up') {
          router.push('/admin')
        }
      }
    }
  }, [user, isLoaded, router])

  return null
}
