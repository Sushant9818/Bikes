import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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

  if (isAdminRoute(req)) {
    const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
    if (role !== 'ADMIN') {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip)).*)', '/(api|trpc)(.*)'],
}
