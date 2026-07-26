'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { Menu, X, User as UserIcon, LogOut, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/bikes', label: 'Bikes' },
  { href: '/scooters', label: 'Scooters' },
  { href: '/parts', label: 'Parts' },
  { href: '/offers', label: 'Offers' },
  { href: '/test-drive', label: 'Test Drive' },
  { href: '/contact', label: 'Contact' },
  { href: '/book-service', label: 'Book Service', highlight: true },
]

export default function Navbar() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const role = (user?.publicMetadata?.role as string | undefined) ?? 'CLIENT'

  const handleLogout = () => signOut({ redirectUrl: '/' })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/bikes?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="h-10 rounded-xl bg-[#E60012] flex items-center justify-center px-4 text-white font-bold">
              Suzuki
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-2xl mx-6">
            {navItems.map(({ href, label, highlight }) => (
              <Link
                key={href}
                href={href}
                className={
                  highlight
                    ? 'px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-[#E60012] text-white hover:bg-[#C5000F]'
                    : 'px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap text-zinc-700 hover:bg-zinc-100'
                }
              >
                {label}
              </Link>
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

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#E60012] flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:inline font-medium">{user?.username ?? user?.primaryEmailAddress?.emailAddress}</span>
                    <Badge variant="secondary" className="hidden sm:inline-flex text-xs">{role}</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/my-orders">My Orders</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/my-appointments">My Appointments</Link></DropdownMenuItem>
                  {role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem asChild><Link href="/bikes">Manage Bikes</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/parts">Manage Parts</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/users">Admin Users</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/orders">Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/analytics">Analytics</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/admin/appointments">Appointments</Link></DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white rounded-xl">
                  <Link href="/sign-in">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#E60012] hover:bg-[#C5000F] text-white rounded-xl">
                  <Link href="/sign-up">Register</Link>
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
          <div className="lg:hidden py-4 border-t border-zinc-200 flex flex-col gap-1">
            {navItems.map(({ href, label, highlight }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  highlight
                    ? 'px-4 py-3 rounded-xl font-medium bg-[#E60012] text-white'
                    : 'px-4 py-3 rounded-xl font-medium text-zinc-700 hover:bg-zinc-100'
                }
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
