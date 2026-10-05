'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Bike, Scooter, Wrench } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bikes', label: 'Bikes', icon: Bike },
  { href: '/admin/scooters', label: 'Scooters', icon: Scooter },
  { href: '/admin/parts', label: 'Parts', icon: Wrench },
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link href="/admin" className="flex items-center gap-3 px-6 py-6 shrink-0">
        <div className="h-10 rounded-xl bg-[#E60012] flex items-center justify-center px-3 text-white font-bold text-sm">
          Suzuki
        </div>
        <span className="hidden md:inline font-bold text-lg text-zinc-900 dark:text-zinc-100">Admin</span>
      </Link>

      {/* Divider */}
      <div className="px-6">
        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {menuItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#E60012] text-white shadow-md'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          v1.0.0 • Suzuki Admin
        </p>
      </div>
    </div>
  )

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 pt-16',
          className
        )}
      >
        <SidebarContent />
      </aside>
    )
  }

  // Mobile Drawer
  return (
    <>
      {/* Mobile Menu Button (shown in TopNav) */}
      {/* The button is rendered in TopNav, this component just handles the drawer state */}

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transform transition-transform duration-300 ease-in-out md:hidden pt-16',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Menu Toggle Button - rendered in mobile navbar */}
      <div className="fixed top-0 right-0 z-40 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 m-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </>
  )
}

// Export a hook to manage sidebar state globally if needed
export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    setIsOpen,
    toggle: () => setIsOpen((prev) => !prev),
  }
}
