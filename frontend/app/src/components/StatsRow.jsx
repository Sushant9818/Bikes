import { Bike, Package, AlertTriangle, ShoppingBag } from 'lucide-react'
import { Skeleton } from './ui/skeleton'

const stats = [
  { key: 'totalVehicles', label: 'Total Vehicles', icon: Bike, color: 'text-blue-600' },
  { key: 'totalParts', label: 'Total Parts', icon: Package, color: 'text-green-600' },
  { key: 'lowStock', label: 'Low Stock', icon: AlertTriangle, color: 'text-amber-600' },
  { key: 'ordersToday', label: 'Orders Today', icon: ShoppingBag, color: 'text-purple-600' },
]

export default function StatsRow({ stats: statsData = {}, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(() => (
          <div key={Math.random()} className="bg-white rounded-2xl border border-zinc-200 p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 mb-1">{label}</p>
              <p className="text-2xl font-bold text-zinc-900">{statsData[key] || 0}</p>
            </div>
            <Icon className={`w-8 h-8 ${color}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
