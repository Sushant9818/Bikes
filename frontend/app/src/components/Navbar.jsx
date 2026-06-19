import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Menu, X, User, LogOut, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/bikes', label: 'Bikes' },
  { to: '/scooters', label: 'Scooters' },
  { to: '/parts', label: 'Parts' },
  { to: '/offers', label: 'Offers' },
  { to: '/test-drive', label: 'Test Drive' },
  { to: '/contact', label: 'Contact' },
]

const LOGO_PATH = '/assets/images/suzuki-logo.png'

export default function Navbar() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3 shrink-0">
            <div className="relative h-10 rounded-xl bg-[#E60012] flex items-center justify-center shrink-0 overflow-hidden px-3 py-1">
              <img
                src={LOGO_PATH}
                alt="Suzuki"
                className="h-7 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          </NavLink>

          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xl mx-6">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive ? 'bg-[#E60012] text-white' : 'text-zinc-700 hover:bg-zinc-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-40 lg:w-48 rounded-xl"
                />
              </div>
            </form>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#E60012] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:inline font-medium">{user.username}</span>
                    <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                      {role || 'CLIENT'}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled>
                    <span className="text-sm font-semibold">{user.username}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{role || 'CLIENT'}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/profile">Profile</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/my-orders">My Orders</NavLink>
                  </DropdownMenuItem>
                  {role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild>
                        <NavLink to="/bikes">Manage Bikes</NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to="/scooters">Manage Scooters</NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to="/parts">Manage Parts</NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to="/admin/users">Admin Users</NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to="/admin/orders">Orders</NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to="/admin/analytics">Analytics</NavLink>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white rounded-xl"
                >
                  <NavLink to="/login">Login</NavLink>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#E60012] hover:bg-[#C5000F] text-white rounded-xl"
                >
                  <NavLink to="/register">Register</NavLink>
                </Button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-zinc-200">
            <form onSubmit={handleSearch} className="mb-4 px-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl font-medium ${
                      isActive ? 'bg-[#E60012] text-white' : 'text-zinc-700 hover:bg-zinc-100'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="mt-4 pt-4 border-t border-zinc-200 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm font-semibold text-zinc-700">
                      {user.username} <Badge variant="secondary" className="ml-2 text-xs">{role || 'CLIENT'}</Badge>
                    </div>
                    <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                      Profile
                    </NavLink>
                    <NavLink to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                      My Orders
                    </NavLink>
                    {role === 'ADMIN' && (
                      <>
                        <NavLink to="/bikes" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                          Manage Bikes
                        </NavLink>
                        <NavLink to="/scooters" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                          Manage Scooters
                        </NavLink>
                        <NavLink to="/parts" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                          Manage Parts
                        </NavLink>
                        <NavLink to="/admin/users" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                          Admin Users
                        </NavLink>
                        <NavLink to="/admin/orders" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                          Orders
                        </NavLink>
                        <NavLink to="/admin/analytics" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100">
                          Analytics
                        </NavLink>
                      </>
                    )}
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100 text-left flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl font-medium text-[#E60012] hover:bg-[#E60012]/10"
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl font-medium bg-[#E60012] text-white hover:bg-[#C5000F]"
                    >
                      Register
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
