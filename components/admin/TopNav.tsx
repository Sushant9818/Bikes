'use client'

import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import ThemeToggle from '@/components/ThemeToggle'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

interface TopNavProps {
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export default function TopNav({ onMenuToggle, isMobileMenuOpen }: TopNavProps) {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    signOut({ redirectUrl: '/' })
  }

  const handleMenuToggle = () => {
    setIsOpen(!isOpen)
    onMenuToggle?.()
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left side - Mobile menu toggle or spacing */}
          <div className="md:hidden">
            {isMobile && (
              <button
                onClick={handleMenuToggle}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                aria-label="Toggle navigation"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>

          {/* Center - Branding (for mobile) */}
          <div className="md:hidden flex-1 text-center">
            <h1 className="font-bold text-zinc-900 dark:text-zinc-100">Admin</h1>
          </div>

          {/* Right side - Theme toggle & Profile */}
          <div className="flex items-center gap-3 md:gap-4 ml-auto">
            <ThemeToggle />

            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-lg h-10 px-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#E60012] flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-32 truncate">
                      {user?.username ?? user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Signed in as
                    </p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => router.push('/profile')}
                      className="w-full text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left cursor-pointer text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                size="sm"
                className="bg-[#E60012] hover:bg-[#C5000F] text-white rounded-lg"
              >
                <a href="/sign-in">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={handleMenuToggle}
          aria-hidden="true"
        />
      )}
    </>
  )
}
