import Navbar from '@/components/Navbar'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
