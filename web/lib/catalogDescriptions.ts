const BIKE_SPECS: Record<string, string> = {
  'gixxer 155 fi': '155cc FI · 13.6ps · ABS · LED · 5-speed · 141kg',
  'gixxer 155': '155cc FI · 13.6ps · ABS · LED · 5-speed · 141kg',
  'v-strom sx 250': '249cc FI · 26.5ps · Oil-cooled · 6-speed · 167kg · 205mm clearance',
  'v-strom 250': '249cc FI · 26.5ps · Oil-cooled · 6-speed · 167kg',
  'gixxer sf 250': '250cc FI · Dual-ABS · Full-fairing · 6-speed',
  'gixxer 250': '250cc FI · Dual-ABS · Naked · 6-speed',
  'gixxer sf 150': '155cc FI · ABS · Full-fairing · 5-speed',
  gixxer: '155cc FI · 13.6ps · ABS · 5-speed',
  'intruder 150': '155cc · Cruiser · Fuel Injection · 5-speed',
}

const SCOOTER_SPECS: Record<string, string> = {
  'access 125 fi sp': '124cc FI · 6.2kW · CVT · Special Edition',
  'access 125 fi': '124cc FI · 6.2kW @ 6500rpm · 10.2Nm · CVT',
  'access 125': '124cc FI · CVT · Air-cooled · SOHC',
  'avenis 125 fi': '124cc FI · 8.7ps @ 6750rpm · 10Nm · CVT',
  avenis: '124cc FI · 8.7ps · CVT',
  'burgman 125 fi': '124cc FI · 8.7ps · CVT · Premium maxi-scooter',
  burgman: '124cc FI · CVT · Premium maxi-scooter',
}

function lookupSpec(name: string, map: Record<string, string>): string | null {
  const lower = name.toLowerCase()
  for (const [key, spec] of Object.entries(map)) {
    if (lower.includes(key)) return spec
  }
  return null
}

interface VehicleLike {
  description?: string | null
  modelName?: string | null
  type?: string | null
  year?: number | null
}

export function vehicleDescription(vehicle: VehicleLike): string {
  if (vehicle.description) return vehicle.description
  const name = vehicle.modelName ?? ''
  const type = vehicle.type === 'SCOOTER' ? 'scooter' : 'motorcycle'
  const spec = vehicle.type === 'SCOOTER' ? lookupSpec(name, SCOOTER_SPECS) : lookupSpec(name, BIKE_SPECS)
  if (spec) return `Suzuki ${name} — ${spec}`
  const year = vehicle.year ?? ''
  return `Premium Suzuki ${type} · ${name}${year ? ` (${year})` : ''}. Available for test rides and purchase at authorized dealers.`
}

interface PartLike {
  description?: string | null
  compatibleModel?: string | null
  type?: string | null
}

export function partDescription(part: PartLike): string {
  if (part.description) return part.description
  const model = part.compatibleModel || 'multiple Suzuki models'
  const category = part.type === 'SCOOTER_PART' ? 'Scooter part' : 'Bike part'
  return `${category} · Fits ${model}. Genuine Suzuki quality and reliability.`
}

export function vehicleTypeLabel(type?: string | null): string {
  if (type === 'SCOOTER') return 'Scooter'
  if (type === 'BIKE') return 'Bike'
  return type || 'Vehicle'
}

export function partCategoryLabel(type?: string | null): string {
  if (type === 'SCOOTER_PART') return 'Scooter Parts'
  if (type === 'BIKE_PART') return 'Bike Parts'
  return 'Parts'
}
