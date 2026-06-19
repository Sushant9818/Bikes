import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'
import * as vehiclesApi from '@/api/vehicles'
import DataTable, { QuantityBadge } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatNPR } from '@/utils/currency'

const vehicleSchema = z.object({
  modelName: z.string().min(1, 'Model name is required'),
  type: z.enum(['BIKE', 'SCOOTER']),
  brand: z.string().default('Suzuki'),
  year: z.number().min(2020).max(2030),
  price: z.number().min(0),
  quantity: z.number().min(0),
  imageUrl: z.string().optional().or(z.literal('')),
})

const COLUMNS = [
  { key: 'id', label: 'ID' },
  {
    key: 'type',
    label: 'Type',
    render: (v) => (v === 'BIKE' ? 'Motorcycle' : 'Scooter'),
  },
  { key: 'modelName', label: 'Model' },
  { key: 'year', label: 'Year' },
  {
    key: 'price',
    label: 'Price',
    render: (v) => (v != null ? formatNPR(v) : '-'),
  },
  {
    key: 'quantity',
    label: 'Stock',
    render: (v, row) => <QuantityBadge value={v} />,
  },
]

export default function VehiclesPage() {
  const { isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('BIKE')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editing, setEditing] = useState(null)

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
      brand: 'Suzuki',
      year: new Date().getFullYear(),
      price: 0,
      quantity: 0,
      imageUrl: '',
    },
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { type: typeFilter }
      if (searchQuery.trim()) params.q = searchQuery.trim()
      const data = await vehiclesApi.getVehicles(params)
      setVehicles(data)
    } catch {
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [typeFilter])

  const filteredAndSorted = useMemo(() => {
    let filtered = vehicles.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          v.modelName?.toLowerCase().includes(q) ||
          v.brand?.toLowerCase().includes(q)
        )
      }
      return true
    })

    if (sortBy === 'recent') {
      filtered.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    } else if (sortBy === 'lowStock') {
      filtered.sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
    }

    return filtered
  }, [vehicles, searchQuery, sortBy])

  const openAdd = () => {
    setEditing(null)
    reset({
      type: 'BIKE',
      modelName: '',
      brand: 'Suzuki',
      year: new Date().getFullYear(),
      price: 0,
      quantity: 0,
      imageUrl: '',
    })
    setModalOpen(true)
  }

  const openEdit = (v) => {
    setEditing(v)
    reset({
      type: v.type,
      modelName: v.modelName,
      brand: v.brand || 'Suzuki',
      year: v.year,
      price: v.price,
      quantity: v.quantity,
      imageUrl: v.imageUrl || v.image || '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    if (!isAdmin()) {
      toast.error('Admin access required')
      return
    }

    try {
      const payload = {
        ...data,
        price: Number(data.price),
        quantity: Number(data.quantity),
        year: Number(data.year),
        imageUrl: data.imageUrl?.trim() || undefined,
      }

      if (editing?.id) {
        await vehiclesApi.updateVehicle(editing.id, payload)
        toast.success('Vehicle updated')
      } else {
        await vehiclesApi.createVehicle(payload)
        toast.success('Vehicle added')
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    if (!isAdmin()) {
      toast.error('Admin access required')
      return
    }

    try {
      await vehiclesApi.deleteVehicle(id)
      toast.success('Vehicle deleted')
      setVehicles((prev) => prev.filter((v) => v.id !== id))
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-zinc-900">Vehicles</h2>
        {isAdmin() && (
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        )}
      </div>

      <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="BIKE">Motorcycles</TabsTrigger>
          <TabsTrigger value="SCOOTER">Scooters</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-11 px-4 border border-zinc-200 rounded-xl text-sm"
        >
          <option value="recent">Most recent</option>
          <option value="price">Price: Low to High</option>
          <option value="lowStock">Low Stock</option>
        </select>
      </div>

      <DataTable
        columns={COLUMNS}
        data={filteredAndSorted}
        loading={loading}
        emptyMessage="No vehicles found."
        showActions={true}
        isAdmin={isAdmin()}
        onEdit={isAdmin() ? openEdit : undefined}
        onDelete={isAdmin() ? (v) => setDeleteTarget(v) : undefined}
      />

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Type</Label>
              <select
                {...register('type')}
                className="w-full h-11 px-3 border border-zinc-200 rounded-xl mt-1"
              >
                <option value="BIKE">Motorcycle</option>
                <option value="SCOOTER">Scooter</option>
              </select>
            </div>
            <div>
              <Label>Model Name *</Label>
              <Input {...register('modelName')} className="mt-1" />
              {errors.modelName && (
                <p className="text-red-600 text-sm mt-1">{errors.modelName.message}</p>
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
              <Label>Quantity</Label>
              <Input type="number" {...register('quantity', { valueAsNumber: true })} className="mt-1" />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input {...register('imageUrl')} placeholder="e.g. /assets/images/bikes/bike-1.jpg" className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Vehicle</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-600">
              Delete &quot;{deleteTarget.modelName}&quot;?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteTarget.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
