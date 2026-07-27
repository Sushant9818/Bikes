import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AdminCardActions from '@/components/AdminCardActions'
import { formatNPR } from '@/lib/currency'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/lib/images'
import { vehicleDescription, vehicleTypeLabel } from '@/lib/catalogDescriptions'
import type { Vehicle } from '@prisma/client'

interface ProductCardProps {
  vehicle: Vehicle
  serialNumber?: number
  onEdit?: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
}

export default function ProductCard({ vehicle, serialNumber, onEdit, onDelete }: ProductCardProps) {
  const isLowStock = (vehicle.quantity ?? 0) <= 5
  const imgSrc = getImageUrl(vehicle)
  const isAdminCard = Boolean(onEdit || onDelete)

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-md hover:shadow-xl hover:border-[#E60012]/30 hover:-translate-y-1 transition-all duration-300">
      {serialNumber != null && (
        <span className="absolute top-3 right-3 z-20 min-w-[2rem] text-center bg-[#E60012] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
          #{serialNumber}
        </span>
      )}
      <Link href={`/products/${vehicle.id}`} className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={vehicle.modelName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
        />
        {isLowStock && <Badge variant="destructive" className="absolute bottom-3 left-3 z-10 shadow">Low Stock</Badge>}
      </Link>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className="bg-[#E60012]/10 text-[#E60012] border-0">{vehicleTypeLabel(vehicle.type)}</Badge>
          <Badge variant="secondary" className="text-xs shrink-0">Stock: {vehicle.quantity ?? 0}</Badge>
        </div>
        <Link href={`/products/${vehicle.id}`}>
          <h3 className="font-bold text-lg text-zinc-900 leading-tight mt-0.5 mb-1 hover:text-[#E60012] transition-colors">{vehicle.modelName}</h3>
        </Link>
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{vehicleDescription(vehicle)}</p>
        <p className="font-bold text-xl text-[#E60012] mb-3">{formatNPR(vehicle.price)}</p>
        {isAdminCard ? (
          <div className="space-y-2 mt-auto">
            <AdminCardActions onEdit={onEdit ? () => onEdit(vehicle) : undefined} onDelete={onDelete ? () => onDelete(vehicle) : undefined} />
            <Button asChild size="sm" variant="ghost" className="w-full rounded-xl text-zinc-600">
              <Link href={`/products/${vehicle.id}`}>View details</Link>
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" className="w-full mt-auto bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
            <Link href={`/products/${vehicle.id}`}>View Details</Link>
          </Button>
        )}
      </div>
    </article>
  )
}
