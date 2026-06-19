import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import * as vehiclesApi from '@/api/vehicles'
import { formatNPR } from '@/utils/currency'
import { getImageUrl } from '@/utils/images'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SkeletonGrid from '@/components/SkeletonGrid'
import { CheckCircle2, ArrowLeft, Gauge, Weight } from 'lucide-react'

// Color variants per model
const MODEL_COLORS = [
  {
    keys: ['gixxer 155 fi', 'gixxer 155'],
    colors: [
      { name: 'Metallic Triton Blue',  hex: '#1a4f8c', img: '/assets/images/bikes/gixxer-155-blue.jpg' },
      { name: 'Metallic Matte Fibroin Gray', hex: '#6b6b6b', img: '/assets/images/bikes/gixxer-155-black.jpg' },
      { name: 'Glass Sparkle Black',   hex: '#1a1a1a', img: '/assets/images/bikes/gixxer-155-fi.png' },
      { name: 'Champion Yellow No.2',  hex: '#e8a000', img: '/assets/images/bikes/gixxer-155-orange.jpg' },
    ],
  },
  {
    keys: ['v-strom sx 250', 'v-strom 250', 'vstrom'],
    colors: [
      { name: 'Champion Yellow No.2', hex: '#e8a000', img: '/assets/images/bikes/vstrom-sx-250.jpg' },
      { name: 'Metallic Triton Blue',  hex: '#1a4f8c', img: '/assets/images/bikes/vstrom-blue.jpg' },
      { name: 'Metallic Matte Gray',   hex: '#7a7a7a', img: '/assets/images/bikes/vstrom-gray.jpg' },
      { name: 'Glass Sparkle Black',   hex: '#1a1a1a', img: '/assets/images/bikes/vstrom-black.jpg' },
    ],
  },
  {
    keys: ['burgman 125 fi', 'burgman 125', 'burgman street 125', 'burgman'],
    colors: [
      { name: 'Metallic Matte Black',  hex: '#2a2a2a', img: '/assets/images/scooters/burgman-black.jpg' },
      { name: 'Pearl Mirage White',    hex: '#f0f0f0', img: '/assets/images/scooters/burgman-white.png' },
      { name: 'Fibroin Gray',          hex: '#9a9a9a', img: '/assets/images/scooters/burgman-gray.png' },
    ],
  },
  {
    keys: ['avenis 125 fi', 'avenis 125', 'avenis'],
    colors: [
      { name: 'Metallic Matte Orange', hex: '#e05a00', img: '/assets/images/scooters/avenis-orange.jpg' },
      { name: 'Metallic Triton Blue',  hex: '#1a4f8c', img: '/assets/images/scooters/avenis-blue.jpg' },
      { name: 'Metallic Matte Gray',   hex: '#7a7a7a', img: '/assets/images/scooters/avenis-gray.jpg' },
      { name: 'Glass Sparkle Black',   hex: '#1a1a1a', img: '/assets/images/scooters/avenis-black.jpg' },
    ],
  },
  {
    keys: ['access 125 fi sp', 'access 125 fi special', 'access 125 fi', 'access 125', 'access'],
    colors: [
      { name: 'Metallic Matte Silver', hex: '#c0c0c0', img: '/assets/images/scooters/access-silver.png' },
      { name: 'Suzuki Red',            hex: '#e60012', img: '/assets/images/scooters/access-red.png' },
      { name: 'Metallic Matte Blue',   hex: '#1a4f8c', img: '/assets/images/scooters/access-blue.png' },
      { name: 'Ice Green',             hex: '#5cb85c', img: '/assets/images/scooters/access-green.png' },
    ],
  },
]

function getModelColors(vehicle) {
  const name = (vehicle?.modelName ?? '').toLowerCase()
  for (const entry of MODEL_COLORS) {
    if (entry.keys.some((k) => name.includes(k))) return entry.colors
  }
  return null
}

// Specs & features keyed by model name keywords (most-specific first)
const MODEL_DATA = [
  {
    keys: ['gixxer 155 fi', 'gixxer 155'],
    features: [
      'Fuel Injection (FI) for better mileage & performance',
      '41mm large-diameter front forks',
      'ABS (Anti-lock Braking System)',
      'Full-LED lighting (headlamp, tail lamp)',
      'Digital instrument cluster',
      'European design trend styling',
      '5-speed manual gearbox',
      'Electric starter',
    ],
    engine: [
      ['Engine Type', '4-Stroke, 1-Cylinder, Air Cooled, SOHC'],
      ['Displacement', '155cc'],
      ['Bore × Stroke', '56mm × 62.9mm'],
      ['Max Power', '13.6 ps @ 8,000 rpm'],
      ['Max Torque', '13.8 Nm @ 6,000 rpm'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Electric'],
      ['Transmission', '5-Speed Manual'],
    ],
    specs: [
      ['Kerb Weight', '141 kg'],
      ['Fuel Tank', '12 L'],
      ['Seat Height', '795 mm'],
      ['Front Suspension', 'Telescopic (41mm)'],
      ['Rear Suspension', 'Link-type Mono Shock'],
      ['Front Brake', 'Disc with ABS'],
      ['Rear Brake', 'Disc with ABS'],
      ['Front Tyre', '100/80-17'],
      ['Rear Tyre', '140/60-17'],
    ],
  },
  {
    keys: ['v-strom sx 250', 'v-strom 250', 'vstrom 250', 'vstrom sx'],
    features: [
      'Oil-cooled 250cc SOHC engine',
      '26.5 ps of peak power',
      '6-speed manual transmission',
      '205mm ground clearance for adventure riding',
      'Fuel Injection for efficient performance',
      'Long-travel suspension front and rear',
      'Adventure-touring ergonomics',
      'Electric starter',
    ],
    engine: [
      ['Engine Type', '4-Stroke, Single-Cylinder, Oil Cooled, SOHC'],
      ['Displacement', '249 cc'],
      ['Bore × Stroke', '76mm × 54.9mm'],
      ['Max Power', '26.5 ps @ 9,300 rpm'],
      ['Max Torque', '22.2 Nm @ 7,300 rpm'],
      ['Valve System', '4-Valve'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Electric'],
      ['Transmission', '6-Speed Manual'],
    ],
    specs: [
      ['Kerb Weight', '167 kg'],
      ['Fuel Tank', '12 L'],
      ['Seat Height', '835 mm'],
      ['Ground Clearance', '205 mm'],
      ['Front Suspension', 'Telescopic, 130mm travel'],
      ['Rear Suspension', 'Link-type Mono Shock'],
      ['Front Brake', 'Disc'],
      ['Rear Brake', 'Disc'],
      ['Front Tyre', '100/90-17'],
      ['Rear Tyre', '130/80-17'],
    ],
  },
  {
    keys: ['burgman 125 fi', 'burgman 125', 'burgman street 125', 'burgman'],
    features: [
      'Fuel Injection (FI) for improved fuel efficiency',
      'Maxi-scooter premium styling',
      'Large under-seat storage compartment',
      'Kick & electric dual starter',
      'CVT automatic transmission',
      'LED headlamp',
      'Digital-analogue instrument cluster',
      '12V DC power socket',
    ],
    engine: [
      ['Engine Type', '4-Stroke, 1-Cylinder, Air Cooled, SOHC 2-Valve'],
      ['Displacement', '124 cc'],
      ['Max Power', '8.7 ps @ 6,750 rpm'],
      ['Max Torque', '10.0 Nm @ 5,500 rpm'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Kick & Electric'],
      ['Transmission', 'CVT (Automatic)'],
    ],
    specs: [
      ['Kerb Weight', '108 kg'],
      ['Fuel Tank', '5.2 L'],
      ['Seat Height', '770 mm'],
      ['Front Suspension', 'Telescopic'],
      ['Rear Suspension', 'Unit Swing'],
      ['Front Brake', 'Drum'],
      ['Rear Brake', 'Drum'],
      ['Front Tyre', '90/90-12'],
      ['Rear Tyre', '100/90-10'],
      ['Battery', '12V, 4Ah (Maintenance Free)'],
    ],
  },
  {
    keys: ['avenis 125 fi', 'avenis 125', 'avenis'],
    features: [
      'Sporty scooter with Fuel Injection',
      '8.7 ps high-performance engine',
      'Kick & electric dual starter',
      'CVT automatic transmission',
      'Under-seat storage',
      'LED position lamp',
      'Mobile charging USB port',
      'Lightweight & agile city scooter',
    ],
    engine: [
      ['Engine Type', '4-Stroke, 1-Cylinder, Air Cooled, SOHC 2-Valve'],
      ['Displacement', '124 cc'],
      ['Max Power', '8.7 ps @ 6,750 rpm'],
      ['Max Torque', '10.0 Nm @ 5,500 rpm'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Kick & Electric'],
      ['Transmission', 'CVT (Automatic)'],
    ],
    specs: [
      ['Kerb Weight', '103 kg'],
      ['Fuel Tank', '5.2 L'],
      ['Seat Height', '775 mm'],
      ['Front Suspension', 'Telescopic'],
      ['Rear Suspension', 'Unit Swing'],
      ['Front Brake', 'Disc'],
      ['Rear Brake', 'Drum'],
      ['Front Tyre', '90/90-12'],
      ['Rear Tyre', '100/90-10'],
    ],
  },
  {
    keys: ['access 125 fi sp', 'access 125 fi special', 'access 125 fi', 'access 125', 'access'],
    features: [
      'Fuel Injection (FI) Special Edition',
      'SOHC 2-valve engine for reliability',
      '6.2 kW peak power',
      'CVT automatic transmission',
      'Maintenance-free battery',
      'Large under-seat storage',
      'Reliable kick & electric start',
      'Comfortable city commuter',
    ],
    engine: [
      ['Engine Type', '4-Stroke, 1-Cylinder, Air Cooled, SOHC 2-Valve'],
      ['Displacement', '124 cc'],
      ['Max Power', '6.2 kW @ 6,500 rpm'],
      ['Max Torque', '10.2 Nm @ 5,000 rpm'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Kick & Electric'],
      ['Transmission', 'CVT (Automatic)'],
    ],
    specs: [
      ['Battery', '12V, 4Ah (Maintenance Free)'],
      ['Front Suspension', 'Telescopic'],
      ['Rear Suspension', 'Unit Swing'],
      ['Front Brake', 'Disc'],
      ['Rear Brake', 'Drum'],
      ['Front Tyre', '90/90-12'],
      ['Rear Tyre', '100/90-10'],
    ],
  },
  {
    keys: ['gixxer sf 250 moto gp', 'gixxer sf 250'],
    features: [
      '250cc fuel-injected engine',
      'Full aerodynamic fairing',
      'Dual-channel ABS',
      'LED headlamp & tail lamp',
      'Moto GP inspired livery',
      '6-speed gearbox',
      'Clip-on handlebars',
      'Split seat design',
    ],
    engine: [
      ['Engine Type', '4-Stroke, 1-Cylinder, Oil Cooled, SOHC'],
      ['Displacement', '249 cc'],
      ['Max Power', '26.5 ps @ 9,300 rpm'],
      ['Max Torque', '22.2 Nm @ 7,300 rpm'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Electric'],
      ['Transmission', '6-Speed Manual'],
    ],
    specs: [
      ['Kerb Weight', '161 kg'],
      ['Fuel Tank', '14 L'],
      ['Seat Height', '800 mm'],
      ['Front Brake', 'Disc with ABS'],
      ['Rear Brake', 'Disc with ABS'],
      ['Front Tyre', '110/70-17'],
      ['Rear Tyre', '150/60-17'],
    ],
  },
  {
    keys: ['gixxer sf 150', 'gixxer sf'],
    features: [
      'Full aerodynamic fairing',
      'Fuel Injection (FI)',
      'ABS braking system',
      'LED lighting all-round',
      'Digital instrument cluster',
      '5-speed gearbox',
      'Sporty clip-on handlebars',
    ],
    engine: [
      ['Engine Type', '4-Stroke, 1-Cylinder, Air Cooled, SOHC'],
      ['Displacement', '155 cc'],
      ['Max Power', '13.6 ps @ 8,000 rpm'],
      ['Max Torque', '13.8 Nm @ 6,000 rpm'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Electric'],
      ['Transmission', '5-Speed Manual'],
    ],
    specs: [
      ['Kerb Weight', '148 kg'],
      ['Fuel Tank', '12 L'],
      ['Seat Height', '800 mm'],
      ['Front Brake', 'Disc with ABS'],
      ['Rear Brake', 'Disc with ABS'],
      ['Front Tyre', '100/80-17'],
      ['Rear Tyre', '140/60-17'],
    ],
  },
  {
    keys: ['intruder 150', 'intruder'],
    features: [
      'Cruiser-style design',
      'Fuel Injection (FI)',
      '155cc air-cooled engine',
      'Low seat height for comfort',
      'Chrome accents & wide handlebars',
      'Electric starter',
      '5-speed gearbox',
    ],
    engine: [
      ['Engine Type', '4-Stroke, 1-Cylinder, Air Cooled, SOHC'],
      ['Displacement', '155 cc'],
      ['Max Power', '13.6 ps @ 8,000 rpm'],
      ['Max Torque', '13.8 Nm @ 6,000 rpm'],
      ['Fuel System', 'Fuel Injection (FI)'],
      ['Starter', 'Electric'],
      ['Transmission', '5-Speed Manual'],
    ],
    specs: [
      ['Kerb Weight', '156 kg'],
      ['Fuel Tank', '11 L'],
      ['Seat Height', '740 mm'],
      ['Front Brake', 'Disc'],
      ['Rear Brake', 'Drum'],
    ],
  },
]

function getModelData(vehicle) {
  const name = (vehicle?.modelName ?? '').toLowerCase()
  for (const entry of MODEL_DATA) {
    if (entry.keys.some((k) => name.includes(k))) return entry
  }
  return null
}

function SpecRow({ label, value }) {
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="py-3 pr-4 text-sm font-medium text-zinc-500 w-1/2">{label}</td>
      <td className="py-3 text-sm text-zinc-900 font-semibold">{value}</td>
    </tr>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState(null)

  useEffect(() => {
    setSelectedColor(null)
    if (id) {
      vehiclesApi
        .getVehicle(id)
        .then(setVehicle)
        .catch(() => setVehicle(null))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading || !vehicle) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {loading ? <SkeletonGrid rows={1} cols={1} /> : <p className="text-zinc-500">Vehicle not found.</p>}
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const colors = getModelColors(vehicle)
  const imgSrc = selectedColor?.img ?? getImageUrl(vehicle)
  const isLowStock = (vehicle.quantity ?? 0) <= 5
  const modelData = getModelData(vehicle)
  const typeLabel = vehicle.type === 'SCOOTER' ? 'Scooter' : 'Motorcycle'

  return (
    <>
      {/* Hero */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" asChild className="text-zinc-500 hover:text-zinc-900 -ml-2">
            <Link to={vehicle.type === 'SCOOTER' ? '/scooters' : '/bikes'}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to {typeLabel}s
            </Link>
          </Button>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Image */}
            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl overflow-hidden flex items-center justify-center p-6 min-h-[320px]">
              <img
                src={imgSrc}
                alt={vehicle.modelName}
                className="w-full max-h-[380px] object-contain drop-shadow-xl"
                onError={(e) => { e.target.src = '/assets/images/placeholder.jpg' }}
              />
            </div>

            {/* Info */}
            <div>
              <Badge className="mb-3 bg-[#E60012]/10 text-[#E60012] border-0 text-xs uppercase tracking-wide">
                Suzuki {typeLabel}
              </Badge>
              <h1 className="text-4xl font-bold text-zinc-900 mb-1">{vehicle.modelName}</h1>
              <p className="text-zinc-400 text-sm mb-5">
                {vehicle.brand || 'Suzuki'}{vehicle.year ? ` · ${vehicle.year}` : ''}
              </p>

              <p className="text-4xl font-extrabold text-[#E60012] mb-2">{formatNPR(vehicle.price)}</p>
              <p className="text-zinc-400 text-xs mb-6">* Ex-showroom price · Balkumari, Lalitpur</p>

              <div className="flex items-center gap-3 mb-8">
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`} />
                  {isLowStock ? `Only ${vehicle.quantity} left` : `${vehicle.quantity} in stock`}
                </span>
              </div>

              {/* Color variants */}
              {colors && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-zinc-700 mb-3">
                    Color:{' '}
                    <span className="font-normal text-zinc-500">
                      {selectedColor?.name ?? colors[0].name}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((c) => (
                      <button
                        key={c.name}
                        title={c.name}
                        onClick={() => setSelectedColor(c)}
                        className={`w-9 h-9 rounded-full border-2 shadow-sm transition-all duration-200 hover:scale-110 ${
                          (selectedColor?.name ?? colors[0].name) === c.name
                            ? 'border-[#E60012] scale-110 ring-2 ring-[#E60012]/30'
                            : 'border-zinc-300'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick stats */}
              {modelData && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {modelData.engine.slice(0, 4).map(([label, value]) => (
                    <div key={label} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-zinc-800">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl px-6">
                  <Link to="/test-drive">Book Test Drive</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white rounded-xl px-6">
                  <Link to="/contact">Enquire Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Features */}
        {modelData?.features && (
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#E60012] rounded-full inline-block" />
              Key Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modelData.features.map((f) => (
                <div key={f} className="flex items-start gap-3 bg-white rounded-xl border border-zinc-100 p-4 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#E60012] shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-700">{f}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Specs tables side by side */}
        {modelData && (
          <section>
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#E60012] rounded-full inline-block" />
              Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Engine */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="bg-zinc-900 px-5 py-3 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#E60012]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Engine</h3>
                </div>
                <table className="w-full px-5">
                  <tbody className="divide-y divide-zinc-100">
                    {modelData.engine.map(([label, value]) => (
                      <SpecRow key={label} label={label} value={value} />
                    ))}
                    <SpecRow label="Year" value={vehicle.year ?? '—'} />
                  </tbody>
                </table>
              </div>

              {/* Technical */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="bg-zinc-900 px-5 py-3 flex items-center gap-2">
                  <Weight className="w-4 h-4 text-[#E60012]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Technical</h3>
                </div>
                <table className="w-full px-5">
                  <tbody className="divide-y divide-zinc-100">
                    {modelData.specs.map(([label, value]) => (
                      <SpecRow key={label} label={label} value={value} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Description fallback when no model data */}
        {!modelData && vehicle.description && (
          <section className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-3">About this model</h2>
            <p className="text-zinc-600 leading-relaxed">{vehicle.description}</p>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="bg-zinc-900 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Interested in {vehicle.modelName}?</h2>
          <p className="text-zinc-400 mb-6 text-sm">Visit us at Balkumari, Lalitpur or book a test ride today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl px-8">
              <Link to="/test-drive">Book Test Drive</Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-zinc-900 rounded-xl px-8">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </>
  )
}
