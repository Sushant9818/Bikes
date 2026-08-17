import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type SortOption = '' | 'price_asc' | 'price_desc'

interface CatalogFiltersProps {
  minPrice: string
  maxPrice: string
  sort: SortOption
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  onSortChange: (value: SortOption) => void
}

export default function CatalogFilters({ minPrice, maxPrice, sort, onMinPriceChange, onMaxPriceChange, onSortChange }: CatalogFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label className="text-xs text-zinc-500">Min price</Label>
        <Input type="number" min={0} placeholder="Rs 0" value={minPrice} onChange={(e) => onMinPriceChange(e.target.value)} className="mt-1 w-28 rounded-xl" />
      </div>
      <div>
        <Label className="text-xs text-zinc-500">Max price</Label>
        <Input type="number" min={0} placeholder="Any" value={maxPrice} onChange={(e) => onMaxPriceChange(e.target.value)} className="mt-1 w-28 rounded-xl" />
      </div>
      <div>
        <Label className="text-xs text-zinc-500">Sort by</Label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="mt-1 h-11 px-3 border border-zinc-200 rounded-xl text-sm"
        >
          <option value="">Default</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  )
}
