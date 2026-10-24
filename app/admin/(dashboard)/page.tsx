'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard, AlertCircle } from 'lucide-react'
import DashboardCards from '@/components/admin/DashboardCards'
import RevenueChart from '@/components/admin/RevenueChart'
import CategoryPieChart from '@/components/admin/CategoryPieChart'

interface DashboardData {
  kpis: {
    totalBikes: number
    totalScooters: number
    totalParts: number
    totalRevenue: number
    thisMonthRevenue: number
    revenueTrend: number
    ordersTrend: number
    thisMonthOrders: number
  }
  monthlyRevenue: Array<{ month: string; revenue: number }>
  categoryRevenue: Array<{ name: string; value: number; color: string }>
  lowStockParts: Array<{
    id: number
    name: string
    sku: string
    quantity: number
    minStock: number
    status: string
  }>
  recentAppointments: Array<{
    id: number
    clientUsername: string
    bikeModel: string
    preferredDate: string
    status: string
    estimatedCost: number
    serviceCount: number
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          credentials: 'include',
        })
        if (!response.ok) throw new Error('Failed to fetch dashboard data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-[#E60012] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">{error || 'Failed to load dashboard'}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-[#E60012]" />
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Welcome to the Suzuki Admin Panel - Real-time analytics and insights
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardCards kpis={data.kpis} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RevenueChart data={data.monthlyRevenue} />
        <CategoryPieChart data={data.categoryRevenue} />
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockParts.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Low Stock Alerts</h2>
          <div className="space-y-2">
            {data.lowStockParts.map((part) => (
              <div key={part.id} className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{part.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">SKU: {part.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-500">{part.quantity} left</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Min: {part.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Appointments */}
      {data.recentAppointments.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Recent Appointments</h2>
          <div className="space-y-3">
            {data.recentAppointments.map((appt) => (
              <div key={appt.id} className="flex justify-between items-center p-3 border border-zinc-200 dark:border-zinc-800 rounded">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{appt.clientUsername}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{appt.bikeModel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{appt.preferredDate}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">{appt.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
