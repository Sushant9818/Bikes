import Footer from '@/components/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function OffersPage() {
  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Special Offers</h1>
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="bg-[#E60012] text-white mb-2">Limited Time</Badge>
                  <h2 className="text-xl font-bold text-zinc-900">Festive Season Discount</h2>
                </div>
              </div>
              <p className="text-zinc-600 mb-4">
                Get up to 10% off on selected motorcycle models. Valid until end of month.
              </p>
              <Button className="bg-[#E60012] hover:bg-[#C5000F]">View Details</Button>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="bg-[#E60012] text-white mb-2">New</Badge>
                  <h2 className="text-xl font-bold text-zinc-900">Parts & Accessories Sale</h2>
                </div>
              </div>
              <p className="text-zinc-600 mb-4">
                Special pricing on genuine Suzuki parts and accessories. Limited stock available.
              </p>
              <Button className="bg-[#E60012] hover:bg-[#C5000F]">Shop Now</Button>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="bg-[#E60012] text-white mb-2">Exclusive</Badge>
                  <h2 className="text-xl font-bold text-zinc-900">Test Drive Rewards</h2>
                </div>
              </div>
              <p className="text-zinc-600 mb-4">
                Book a test drive and get exclusive offers on your purchase.
              </p>
              <Button className="bg-[#E60012] hover:bg-[#C5000F]">Book Test Drive</Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
