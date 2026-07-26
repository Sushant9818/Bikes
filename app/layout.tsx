import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { CartProvider } from '@/cart/CartContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suzuki Bike System',
  description: 'Suzuki Motorcycle Nepal — bikes, scooters, parts, and service',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <CartProvider>{children}</CartProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
