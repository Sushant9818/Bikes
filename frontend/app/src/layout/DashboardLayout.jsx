import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import {
  Home,
  Bike,
  Package,
  Tag,
  Calendar,
  Mail,
  Search,
  User,
  LogOut,
  Menu,
  X,
  ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import StatsRow from '@/components/StatsRow'
import { useCart } from '@/cart/CartContext'
import * as vehiclesApi from '@/api/vehicles'
import * as partsApi from '@/api/parts'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/vehicles', label: 'Vehicles', icon: Bike },
  { to: '/parts', label: 'Parts', icon: Package },
  { to: '/offers', label: 'Offers', icon: Tag },
  { to: '/test-drive', label: 'Test Drive', icon: Calendar },
  { to: '/contact', label: 'Contact', icon: Mail },
]

const clientNavItems = [
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
]

const adminNavItems = [
  { to: '/admin/orders', label: 'Orders', icon: Package },
]

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalParts: 0,
    lowStock: 0,
    ordersToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [vehicles, parts] = await Promise.all([
          vehiclesApi.getVehicles({}).catch(() => []),
          partsApi.getParts({}).catch(() => []),
        ])
        const lowV = vehicles.filter((v) => (v.quantity ?? 0) <= 5).length
        const lowP = parts.filter((p) => (p.quantity ?? 0) <= 5).length
        setStats({
          totalVehicles: vehicles.length,
          totalParts: parts.length,
          lowStock: lowV + lowP,
          ordersToday: 0, // TODO: fetch from orders API if available
        })
      } catch {
        setStats({ totalVehicles: 0, totalParts: 0, lowStock: 0, ordersToday: 0 })
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100"
                aria-label="Menu"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <NavLink to="/" className="flex items-center gap-2 shrink-0">
                <Bike className="w-8 h-8 text-red-600" />
                <span className="font-bold text-xl text-zinc-900">Suzuki</span>
                <span className="text-sm text-zinc-500 hidden sm:inline">Bike System</span>
              </NavLink>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden sm:flex items-center max-w-xs w-full">
                <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              {/* Cart Icon (CLIENT only) */}
              {!isAdmin() && (
                <NavLink to="/cart" className="relative">
                  <Button variant="ghost" size="icon">
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-red-600 text-white rounded-full">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </NavLink>
              )}

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <span className="text-sm font-semibold">{user.username || 'Admin'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <NavLink to="/login">Login</NavLink>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-zinc-200 transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ top: '64px' }}
        >
          <nav className="p-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
            {!isAdmin() && (
              <>
                <div className="my-2 border-t border-zinc-200" />
                {clientNavItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </NavLink>
                ))}
              </>
            )}
            {isAdmin() && (
              <>
                <div className="my-2 border-t border-zinc-200" />
                {adminNavItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </NavLink>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-zinc-900/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ top: '64px' }}
            aria-hidden
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 p-6 lg:p-8">
          <StatsRow stats={stats} loading={loading} />
          <div className="mt-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
