import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { MessageSquare, Store, Calendar } from 'lucide-react'

export default function HeroCTA() {
  return (
    <section
      className="relative py-20 px-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/assets/images/hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '500px',
      }}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
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
            className="bg-white text-[#E60012] hover:bg-zinc-100 font-semibold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
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
            className="border-2 border-white text-white hover:bg-white hover:text-[#E60012] font-semibold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/contact">
              <Store className="w-5 h-5 mr-2" />
              BECOME A DEALER
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-[#E60012] font-semibold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <Link to="/test-drive">
              <Calendar className="w-5 h-5 mr-2" />
              BOOK A TEST DRIVE
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-300">
            Click to register queries, get more information via our Official Suzuki Nepal Team, or reserve one of the first bikes in the country.
          </p>
        </div>
      </div>
    </section>
  )
}
