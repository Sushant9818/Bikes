import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Calendar, Tag } from 'lucide-react'

export default function HeroSection() {
  return (
    <section
      className="relative w-full py-28 px-4 sm:px-6 lg:px-8 text-white min-h-[520px] flex items-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/assets/images/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">Ride the Next Generation</h1>
        <p className="text-xl sm:text-2xl text-zinc-200 max-w-2xl mx-auto mb-12">
          Explore Suzuki Motorcycles & Scooters. Updated stock, best parts, and offers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button asChild size="lg" className="bg-[#E60012] hover:bg-[#C5000F] text-white font-semibold px-8 py-6 rounded-xl">
            <Link href="/contact"><MessageSquare className="w-5 h-5 mr-2" />Enquiry</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-zinc-900 font-semibold px-8 py-6 rounded-xl">
            <Link href="/test-drive"><Calendar className="w-5 h-5 mr-2" />Book Test Drive</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-zinc-900 font-semibold px-8 py-6 rounded-xl">
            <Link href="/offers"><Tag className="w-5 h-5 mr-2" />View Offers</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
