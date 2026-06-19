import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AdminCardActions from '@/components/AdminCardActions'
import { Eye, ShoppingCart } from 'lucide-react'
import { useCart } from '@/cart/CartContext'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatNPR } from '@/utils/currency'
import { getImageUrl, PLACEHOLDER_IMAGE } from '@/utils/images'
import { partDescription, partCategoryLabel } from '@/lib/catalogDescriptions'

export default function PartCard({ part, serialNumber, onEdit, onDelete }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const isLowStock = (part.quantity ?? 0) <= 5
  const imgSrc = getImageUrl(part)
  const isAdminCard = Boolean(onEdit || onDelete)
  const category = partCategoryLabel(part.type)
  const description = partDescription(part)

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
          alt={part.partName}
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
        <Badge className="w-fit mb-2 bg-zinc-100 text-zinc-700 border-0">{category}</Badge>

        <h3 className="font-bold text-lg text-zinc-900 leading-tight mb-1">{part.partName}</h3>

        <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{description}</p>

        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="font-bold text-xl text-[#E60012]">{formatNPR(part.price)}</p>
          <Badge variant={isLowStock ? 'destructive' : 'secondary'} className="text-xs">
            Qty: {part.quantity ?? 0}
          </Badge>
        </div>

        {isAdminCard ? (
          <div className="space-y-2 mt-auto">
            <AdminCardActions
              onEdit={onEdit ? () => onEdit(part) : undefined}
              onDelete={onDelete ? () => onDelete(part) : undefined}
            />
            <Button asChild size="sm" variant="ghost" className="w-full rounded-xl text-zinc-600">
              <Link to={`/parts/${part.id}`}>View details</Link>
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 mt-auto pt-3 border-t border-zinc-100">
            <Button asChild size="sm" className="flex-1 bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
              <Link to={`/parts/${part.id}`}>
                <Eye className="w-4 h-4 mr-1" />
                View
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#E60012] text-[#E60012] hover:bg-[#E60012] hover:text-white rounded-xl"
              onClick={() => {
                const token = localStorage.getItem('token')
                if (!token) {
                  navigate('/login')
                  return
                }
                addToCart(part)
                toast.success('Added to cart')
              }}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
