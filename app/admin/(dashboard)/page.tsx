import { LayoutDashboard } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-[#E60012]" />
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">Welcome to the Suzuki Admin Panel</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bikes', value: '—', icon: '🏍️' },
          { label: 'Total Scooters', value: '—', icon: '🛵' },
          { label: 'Total Parts', value: '—', icon: '⚙️' },
          { label: 'Recent Orders', value: '—', icon: '📦' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-br from-[#E60012]/10 to-blue-100/10 dark:from-[#E60012]/5 dark:to-blue-900/10 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          🎉 Admin Panel Ready
        </h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          Navigate using the sidebar to manage bikes, scooters, and parts. Check back soon for analytics and detailed insights!
        </p>
      </div>
    </div>
  )
}
