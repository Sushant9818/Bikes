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
        const response = await fetch('/api/admin/dashboard')
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart data={data.monthlyRevenue} />
        </div>
        <div>
          <CategoryPieChart data={data.categoryRevenue} />
        </div>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Low Stock Alerts
            </h2>
          </div>
          <div className="space-y-3">
            {data.lowStockParts.length > 0 ? (
              data.lowStockParts.map((part) => (
                <div
                  key={part.id}
                  className={`p-3 rounded-lg border ${
                    part.status === 'critical'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        {part.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        SKU: {part.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          part.status === 'critical'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {part.quantity} / {part.minStock}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                No low stock alerts
              </p>
            )}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            Recent Appointments
          </h2>
          <div className="space-y-3">
            {data.recentAppointments.length > 0 ? (
              data.recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        {apt.clientUsername}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {apt.bikeModel}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        apt.status === 'APPROVED'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : apt.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {apt.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{new Date(apt.preferredDate).toLocaleDateString()}</span>
                    <span>{apt.serviceCount} services</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                No recent appointments
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
