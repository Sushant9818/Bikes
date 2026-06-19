import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'
import * as vehiclesApi from '@/api/vehicles'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import { VehicleCategoryTabs } from '@/components/CategoryTabs'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const vehicleSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  type: z.enum(['BIKE', 'SCOOTER']),
  year: z.number().min(2020).max(2030),
  price: z.number().min(0),
  quantity: z.number().min(0),
  imageUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

/**
 * @param {{ fixedType?: 'BIKE' | 'SCOOTER', pageTitle?: string }} props
 */
export default function ProductsPage({ fixedType, pageTitle }) {
  const [searchParams] = useSearchParams()
  const { isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState(
    fixedType || searchParams.get('type') || 'BIKE'
  )
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
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
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      type: 'BIKE',
      modelName: '',
      year: new Date().getFullYear(),
      price: 0,
      quantity: 0,
      imageUrl: '',
      description: '',
    },
  })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { type: typeFilter }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      const data = await vehiclesApi.getVehicles(params)
      setVehicles(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load vehicles')
      setError(msg)
      setVehicles([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (fixedType) setTypeFilter(fixedType)
  }, [fixedType])

  useEffect(() => {
    fetchData()
  }, [typeFilter])

  useEffect(() => {
    const type = searchParams.get('type')
    if (!fixedType && (type === 'BIKE' || type === 'SCOOTER')) setTypeFilter(type)
    const q = searchParams.get('q')
    if (q != null) setSearchQuery(q)
  }, [searchParams, fixedType])

  const sectionHeading =
    pageTitle ||
    (typeFilter === 'BIKE' ? 'Suzuki Motorcycles' : 'Suzuki Scooters')

  const displayList = useMemo(() => {
    let list = [...vehicles]
    if (sortBy === 'recent') list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    else if (sortBy === 'price') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    else if (sortBy === 'lowStock') list.sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
    else list.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    return list
  }, [vehicles, sortBy])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchData()
  }

  const openAdd = () => {
    setEditing(null)
    reset({
      type: typeFilter,
      modelName: '',
      year: new Date().getFullYear(),
      price: 0,
      quantity: 0,
      imageUrl: '',
      description: '',
    })
    setModalOpen(true)
  }

  const openEdit = (v) => {
    setEditing(v)
    reset({
      type: v.type,
      modelName: v.modelName,
      year: v.year,
      price: v.price,
      quantity: v.quantity,
      imageUrl: v.imageUrl || v.image || '',
      description: v.description || '',
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
        modelName: data.modelName,
        year: Number(data.year),
        price: Number(data.price),
        quantity: Number(data.quantity),
        imageUrl: data.imageUrl?.trim() || undefined,
        description: data.description?.trim() || undefined,
      }
      if (editing?.id) {
        await vehiclesApi.updateVehicle(editing.id, payload)
        toast.success('Vehicle updated')
      } else {
        await vehiclesApi.createVehicle(payload)
        toast.success('Vehicle added')
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
      await vehiclesApi.deleteVehicle(deleteTarget.id)
      toast.success('Vehicle deleted')
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
                Card catalog · live from API · {displayList.length} vehicle(s)
              </p>
            </div>
            {isAdmin() && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] shadow-md rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add {typeFilter === 'BIKE' ? 'Bike' : 'Scooter'}
              </Button>
            )}
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            {!fixedType && (
              <VehicleCategoryTabs value={typeFilter} onValueChange={setTypeFilter} />
            )}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 min-w-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search by name or model..."
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
            <LoadingSpinner className="py-24" label="Loading vehicles..." />
          ) : displayList.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-600 text-lg font-medium">No vehicles found</p>
              <p className="text-zinc-400 text-sm mt-1">Try another search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayList.map((v, index) => (
                <ProductCard
                  key={v.id}
                  serialNumber={index + 1}
                  vehicle={v}
                  onEdit={isAdmin() ? openEdit : undefined}
                  onDelete={isAdmin() ? (vehicle) => setDeleteTarget(vehicle) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Vehicle' : `Add ${typeFilter === 'BIKE' ? 'Bike' : 'Scooter'}`}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
        submitLabel={editing ? 'Update' : 'Add'}
      >
        <div>
          <Label>Type</Label>
          <select {...register('type')} className="w-full h-11 px-3 border border-zinc-200 rounded-xl mt-1">
            <option value="BIKE">Motorcycle</option>
            <option value="SCOOTER">Scooter</option>
          </select>
        </div>
        <div>
          <Label>Model Name *</Label>
          <Input {...register('modelName')} className="mt-1" />
          {errors.modelName && (
            <p className="text-[#E60012] text-sm mt-1">{errors.modelName.message}</p>
          )}
        </div>
        <div>
          <Label>Year</Label>
          <Input type="number" {...register('year', { valueAsNumber: true })} className="mt-1" />
        </div>
        <div>
          <Label>Price (Rs)</Label>
          <Input type="number" {...register('price', { valueAsNumber: true })} className="mt-1" />
        </div>
        <div>
          <Label>Stock quantity</Label>
          <Input type="number" {...register('quantity', { valueAsNumber: true })} className="mt-1" />
        </div>
        <div>
          <Label>Image URL</Label>
          <Input
            {...register('imageUrl')}
            placeholder="e.g. /assets/images/bikes/bike-1.jpg"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Description</Label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Short description for the vehicle card"
            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y min-h-[80px]"
          />
        </div>
      </AddEditModal>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Vehicle"
        itemName={deleteTarget?.modelName}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Footer />
    </>
  )
}
