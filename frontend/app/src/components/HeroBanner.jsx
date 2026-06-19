import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MessageSquare, Calendar, Tag } from 'lucide-react'

const HERO_IMAGE = '/assets/images/hero.jpg'

export default function HeroBanner() {
  return (
    <section
      className="relative py-24 px-4 text-white min-h-[500px] flex items-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${HERO_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Suzuki Motorcycle Nepal
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-200 max-w-3xl mx-auto">
            Experience the thrill of riding with Suzuki's premium motorcycles and scooters
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-4xl mx-auto">
          <Button
            asChild
            size="lg"
            className="bg-white text-[#E60012] hover:bg-zinc-100 font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/contact">
              <MessageSquare className="w-5 h-5 mr-2" />
              ENQUIRY
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-[#E60012] font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/test-drive">
              <Calendar className="w-5 h-5 mr-2" />
              BOOK TEST DRIVE
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-[#E60012] font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/offers">
              <Tag className="w-5 h-5 mr-2" />
              VIEW OFFERS
            </Link>
          </Button>
        </div>

        <p className="mt-10 text-center text-sm text-zinc-300">
          Click to register queries, get more information via our Official Suzuki Nepal Team, or reserve one of the first bikes in the country.
        </p>
      </div>
    </section>
  )
}
