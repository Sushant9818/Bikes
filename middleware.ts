import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const isPublicGetRoute = createRouteMatcher([
  '/api/vehicles',
  '/api/vehicles/(.*)',
  '/api/parts',
  '/api/parts/(.*)',
  '/api/offers',
  '/api/offers/(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/bikes',
  '/scooters',
  '/products/(.*)',
  '/parts',
  '/parts/(.*)',
  '/offers',
  '/contact',
  '/test-drive',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/contact',
  '/api/test-drive',
  '/api/payments/webhook',
  '/api/webhooks/clerk',
])

const isAdminRoute = createRouteMatcher([
  '/admin/(.*)',
  '/api/admin/(.*)',
  '/api/analytics/(.*)',
])

const isSuperAdminRoute = createRouteMatcher([
  '/admin/settings',
  '/admin/settings/(.*)',
  '/admin/users',
  '/admin/users/(.*)',
  '/api/admin/settings/(.*)',
  '/api/admin/users/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  if (isPublicRoute(req)) return NextResponse.next()
  if (req.method === 'GET' && isPublicGetRoute(req)) return NextResponse.next()

  if (!userId) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
    }
    const signInUrl = new URL('/sign-in', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Check admin and super-admin routes
  if (isAdminRoute(req)) {
    try {
      // Get user from database to check Prisma role
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: { role: true },
      })

      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/permission-denied', req.url))
      }

      // Check SUPER_ADMIN routes
      if (isSuperAdminRoute(req)) {
        if (user.role !== 'SUPER_ADMIN') {
          if (req.nextUrl.pathname.startsWith('/api/')) {
            return NextResponse.json({ message: 'Super admin access required' }, { status: 403 })
          }
          return NextResponse.redirect(new URL('/permission-denied', req.url))
        }
      }
    } catch (error) {
      console.error('[middleware] Error checking admin role:', error)
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Error checking permissions' }, { status: 500 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)', '/(api|trpc)(.*)'],
}
