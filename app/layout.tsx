import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { CartProvider } from '@/cart/CartContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Suzuki Bike System',
  description: 'Suzuki Motorcycle Nepal — bikes, scooters, parts, and service',
}

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        </head>
        <body className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <ThemeProvider>
            <CartProvider>{children}</CartProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
