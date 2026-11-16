'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardCardsProps {
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
}

export default function DashboardCards({ kpis }: DashboardCardsProps) {
  const cards = [
    {
      label: 'Total Bikes',
      value: kpis.totalBikes.toString(),
      icon: '🏍️',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      trend: null,
    },
    {
      label: 'Total Scooters',
      value: kpis.totalScooters.toString(),
      icon: '🛵',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      trend: null,
    },
    {
      label: 'Total Parts',
      value: kpis.totalParts.toString(),
      icon: '⚙️',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      trend: null,
    },
    {
      label: 'This Month Revenue',
      value: `₹${(kpis.thisMonthRevenue / 1000).toFixed(1)}K`,
      icon: '💰',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      trend: kpis.revenueTrend,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">{card.icon}</div>
            {card.trend !== null && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                  card.trend >= 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {card.trend >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(card.trend).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{card.label}</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
