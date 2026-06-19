import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'
import * as partsApi from '@/api/parts'
import PartCard from '@/components/PartCard'
import Footer from '@/components/Footer'
import { PartCategoryTabs } from '@/components/CategoryTabs'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const partSchema = z.object({
  partName: z.string().min(1, 'Part name is required'),
  type: z.enum(['BIKE_PART', 'SCOOTER_PART']),
  compatibleModel: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().min(0),
  imageUrl: z.string().optional().or(z.literal('')),
})

export default function PartsPage() {
  const { isAdmin } = useAuth()
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('BIKE_PART')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('serial')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(partSchema),
    defaultValues: {
      type: 'BIKE_PART',
      partName: '',
      compatibleModel: '',
      price: 0,
      quantity: 0,
      imageUrl: '',
    },
  })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { type: typeFilter }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      const data = await partsApi.getParts(params)
      setParts(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load parts')
      setError(msg)
      setParts([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [typeFilter])

  const sectionHeading =
    typeFilter === 'BIKE_PART' ? 'Suzuki Bike Parts' : 'Suzuki Scooter Parts'

  const displayList = useMemo(() => {
    let list = [...parts]
    if (sortBy === 'recent') list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    else if (sortBy === 'price') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    else if (sortBy === 'lowStock') list.sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
    else list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    return list
  }, [parts, sortBy])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchData()
  }

  const openAdd = () => {
    setEditing(null)
    reset({
      type: typeFilter,
      partName: '',
      compatibleModel: '',
      price: 0,
      quantity: 0,
      imageUrl: '',
    })
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    reset({
      type: p.type,
      partName: p.partName,
      compatibleModel: p.compatibleModel || '',
      price: p.price,
      quantity: p.quantity,
      imageUrl: p.imageUrl || p.image || '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    if (!isAdmin()) {
      toast.error('Admin only')
      return
    }
    setSaving(true)
    try {
      const payload = {
        type: data.type,
        partName: data.partName,
        compatibleModel: data.compatibleModel || undefined,
        price: Number(data.price),
        quantity: Number(data.quantity),
        imageUrl: data.imageUrl?.trim() || undefined,
      }
      if (editing?.id) {
        await partsApi.updatePart(editing.id, payload)
        toast.success('Part updated')
      } else {
        await partsApi.createPart(payload)
        toast.success('Part added')
      }
      setModalOpen(false)
      await fetchData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !isAdmin()) return
    setDeleting(true)
    try {
      await partsApi.deletePart(deleteTarget.id)
      toast.success('Part deleted')
      setDeleteTarget(null)
      await fetchData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{sectionHeading}</h1>
              <p className="text-zinc-600 text-sm mt-1">
                Card catalog · live from API · {displayList.length} part(s)
              </p>
            </div>
            {isAdmin() && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] shadow-md rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Add Part
              </Button>
            )}
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <PartCategoryTabs value={typeFilter} onValueChange={setTypeFilter} />
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 min-w-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-zinc-200"
                />
              </div>
              <Button type="submit" variant="outline" className="rounded-xl shrink-0">
                Search
              </Button>
            </form>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 px-4 border border-zinc-200 rounded-xl text-sm bg-white shadow-sm"
            >
              <option value="serial">Serial order (1, 2, 3…)</option>
              <option value="recent">Newest first</option>
              <option value="price">Price: Low to High</option>
              <option value="lowStock">Low Stock</option>
            </select>
          </div>

          {error && !loading && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex flex-wrap items-center gap-2"
            >
              <span>{error}</span>
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={fetchData}>
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading parts..." />
          ) : displayList.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-600 text-lg font-medium">No parts found</p>
              <p className="text-zinc-400 text-sm mt-1">Try another search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayList.map((p, index) => (
                <PartCard
                  key={p.id}
                  serialNumber={index + 1}
                  part={p}
                  onEdit={isAdmin() ? openEdit : undefined}
                  onDelete={isAdmin() ? (part) => setDeleteTarget(part) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Part' : 'Add Part'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
        submitLabel={editing ? 'Update' : 'Add'}
      >
        <div>
          <Label>Category</Label>
          <select {...register('type')} className="w-full h-11 px-3 border border-zinc-200 rounded-xl mt-1">
            <option value="BIKE_PART">Bike Part</option>
            <option value="SCOOTER_PART">Scooter Part</option>
          </select>
        </div>
        <div>
          <Label>Part Name *</Label>
          <Input {...register('partName')} className="mt-1" />
          {errors.partName && (
            <p className="text-[#E60012] text-sm mt-1">{errors.partName.message}</p>
          )}
        </div>
        <div>
          <Label>Compatible Model</Label>
          <Input {...register('compatibleModel')} placeholder="e.g. Gixxer SF 250" className="mt-1" />
        </div>
        <div>
          <Label>Price (Rs)</Label>
          <Input type="number" {...register('price', { valueAsNumber: true })} className="mt-1" />
        </div>
        <div>
          <Label>Quantity</Label>
          <Input type="number" {...register('quantity', { valueAsNumber: true })} className="mt-1" />
        </div>
        <div>
          <Label>Image URL</Label>
          <Input
            {...register('imageUrl')}
            placeholder="e.g. /assets/images/parts/part-1.jpg"
            className="mt-1"
          />
        </div>
      </AddEditModal>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Part"
        itemName={deleteTarget?.partName}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Footer />
    </>
  )
}
