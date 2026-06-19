import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MessageSquare, Calendar, Tag } from 'lucide-react'

const HERO_IMAGE = '/assets/images/hero.jpg'
const PLACEHOLDER = 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1920&q=80'

export default function HeroSection() {
  const [bgImage, setBgImage] = useState(HERO_IMAGE)

  return (
    <section
      className="relative w-full py-28 px-4 sm:px-6 lg:px-8 text-white min-h-[520px] flex items-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <img
        src={HERO_IMAGE}
        alt=""
        className="sr-only"
        onError={() => setBgImage(PLACEHOLDER)}
      />
      <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          Ride the Next Generation
        </h1>
        <p className="text-xl sm:text-2xl text-zinc-200 max-w-2xl mx-auto mb-12">
          Explore Suzuki Motorcycles & Scooters. Updated stock, best parts, and offers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button
            asChild
            size="lg"
            className="bg-[#E60012] hover:bg-[#C5000F] text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/contact">
              <MessageSquare className="w-5 h-5 mr-2" />
              Enquiry
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-zinc-900 font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/test-drive">
              <Calendar className="w-5 h-5 mr-2" />
              Book Test Drive
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-zinc-900 font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/offers">
              <Tag className="w-5 h-5 mr-2" />
              View Offers
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-zinc-300">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E60012]" />
            Genuine Parts
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E60012]" />
            Fast Service
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E60012]" />
            Updated Inventory
          </span>
        </div>
      </div>
    </section>
  )
}
