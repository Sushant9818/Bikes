'use client'

import { useEffect, useState } from 'react'
import { useAuth, useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { User, LogOut, AlertCircle, Loader } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: number
  username: string
  email: string
  phoneNumber?: string
  avatar?: string
}

interface Stats {
  totalOrders: number
  totalAppointments: number
  totalReviews: number
  totalWishlistItems: number
}

export default function ProfilePage() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    fetchProfile()
    fetchStats()
  }, [isSignedIn, isLoaded, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/users/me/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <Loader className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.username}</h1>
              <p className="text-gray-600 dark:text-gray-400">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Link href="/orders" className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-blue-100 text-sm mb-2">Total Orders</p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </Link>
            <Link href="/my-appointments" className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-green-100 text-sm mb-2">Service Appointments</p>
              <p className="text-3xl font-bold">{stats.totalAppointments}</p>
            </Link>
            <Link href="/wishlist" className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <p className="text-purple-100 text-sm mb-2">Wishlist Items</p>
              <p className="text-3xl font-bold">{stats.totalWishlistItems}</p>
            </Link>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-md">
              <p className="text-orange-100 text-sm mb-2">Your Reviews</p>
              <p className="text-3xl font-bold">{stats.totalReviews}</p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/orders"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <p className="font-semibold text-gray-900 dark:text-white">Order History</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View your past and current orders</p>
            </Link>
            <Link
              href="/my-appointments"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <p className="font-semibold text-gray-900 dark:text-white">My Appointments</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View and manage service appointments</p>
            </Link>
            <Link
              href="/wishlist"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <p className="font-semibold text-gray-900 dark:text-white">Wishlist</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View your saved items</p>
            </Link>
            <Link
              href="/cart"
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
            >
              <p className="font-semibold text-gray-900 dark:text-white">Shopping Cart</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Continue shopping</p>
            </Link>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Information</h2>
          {profile && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <p className="text-gray-900 dark:text-white mt-1">{profile.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-gray-900 dark:text-white mt-1">{profile.email}</p>
              </div>
              {profile.phoneNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <p className="text-gray-900 dark:text-white mt-1">{profile.phoneNumber}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
