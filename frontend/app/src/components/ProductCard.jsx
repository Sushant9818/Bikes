import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AdminCardActions from '@/components/AdminCardActions'
import { formatNPR } from '@/utils/currency'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/utils/images'
import { vehicleDescription, vehicleTypeLabel } from '@/lib/catalogDescriptions'

export default function ProductCard({ vehicle, serialNumber, onEdit, onDelete }) {
  const isLowStock = (vehicle.quantity ?? 0) <= 5
  const imgSrc = vehicle._fallbackImage || getImageUrl(vehicle)
  const isAdminCard = Boolean(onEdit || onDelete)
  const typeLabel = vehicleTypeLabel(vehicle.type)
  const description = vehicleDescription(vehicle)

  return (
    <article className="group relative flex flex-col h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-md hover:shadow-xl hover:border-[#E60012]/30 hover:-translate-y-1 transition-all duration-300">
      {serialNumber != null && (
        <span className="absolute top-3 right-3 z-20 min-w-[2rem] text-center bg-[#E60012] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
          #{serialNumber}
        </span>
      )}

      <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
        <img
          src={imgSrc}
          alt={vehicle.modelName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = PLACEHOLDER_IMAGE
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        {isLowStock && (
          <Badge variant="destructive" className="absolute bottom-3 left-3 z-10 shadow">
            Low Stock
          </Badge>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className="bg-[#E60012]/10 text-[#E60012] border-0 hover:bg-[#E60012]/10">
            {typeLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs shrink-0">
            Stock: {vehicle.quantity ?? 0}
          </Badge>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {vehicle.brand || 'Suzuki'}
        </p>
        <h3 className="font-bold text-lg text-zinc-900 leading-tight mt-0.5 mb-1" title="Vehicle name">
          {vehicle.modelName}
        </h3>
        <p className="text-sm text-zinc-600 mb-2">
          <span className="text-zinc-500">Model:</span>{' '}
          <span className="font-medium text-zinc-800">{vehicle.modelName}</span>
          {vehicle.year ? ` · ${vehicle.year}` : ''}
        </p>

        <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{description}</p>

        <p className="font-bold text-xl text-[#E60012] mb-3">{formatNPR(vehicle.price)}</p>

        {isAdminCard ? (
          <div className="space-y-2 mt-auto">
            <AdminCardActions
              onEdit={onEdit ? () => onEdit(vehicle) : undefined}
              onDelete={onDelete ? () => onDelete(vehicle) : undefined}
            />
            <Button asChild size="sm" variant="ghost" className="w-full rounded-xl text-zinc-600">
              <Link to={`/products/${vehicle.id}`}>View details</Link>
            </Button>
          </div>
        ) : (
          <Button
            asChild
            size="sm"
            className="w-full mt-auto bg-[#E60012] hover:bg-[#C5000F] shadow-sm rounded-xl"
          >
            <Link to={`/products/${vehicle.id}`}>View Details</Link>
          </Button>
        )}
      </div>
    </article>
  )
}
