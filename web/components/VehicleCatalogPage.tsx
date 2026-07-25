'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search } from 'lucide-react'
import type { Vehicle } from '@prisma/client'

interface VehicleFormState {
  type: 'BIKE' | 'SCOOTER'
  modelName: string
  year: number
  price: number
  quantity: number
  imageUrl: string
  description: string
}

interface VehicleCatalogPageProps {
  type: 'BIKE' | 'SCOOTER'
  heading: string
  addLabel: string
}

export default function VehicleCatalogPage({ type, heading, addLabel }: VehicleCatalogPageProps) {
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'

  const emptyForm: VehicleFormState = { type, modelName: '', year: new Date().getFullYear(), price: 0, quantity: 0, imageUrl: '', description: '' }

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState<VehicleFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({ type })
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    const res = await fetch(`/api/vehicles?${params}`)
    setVehicles(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [type])

  const displayList = useMemo(() => [...vehicles].sort((a, b) => a.id - b.id), [vehicles])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (v: Vehicle) => {
    setEditing(v)
    setForm({ type: v.type, modelName: v.modelName, year: v.year, price: v.price, quantity: v.quantity, imageUrl: v.imageUrl ?? '', description: v.description ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, imageUrl: form.imageUrl || undefined, description: form.description || undefined }
    const url = editing ? `/api/vehicles/${editing.id}` : '/api/vehicles'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setModalOpen(false); await fetchData() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/vehicles/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setDeleteTarget(null); await fetchData() }
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{heading}</h1>
              <p className="text-zinc-600 text-sm mt-1">{displayList.length} vehicle(s)</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> {addLabel}
              </Button>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); fetchData() }}
            className="mb-8 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Button type="submit" variant="outline" className="rounded-xl shrink-0">Search</Button>
          </form>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading vehicles..." />
          ) : displayList.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-600 text-lg font-medium">No vehicles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayList.map((v, i) => (
                <ProductCard
                  key={v.id}
                  serialNumber={i + 1}
                  vehicle={v}
                  onEdit={isAdmin ? openEdit : undefined}
                  onDelete={isAdmin ? (vehicle) => setDeleteTarget(vehicle) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Vehicle' : addLabel} onSubmit={onSubmit} loading={saving} submitLabel={editing ? 'Update' : 'Add'}>
        <div><Label>Model Name *</Label><Input value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })} className="mt-1" required /></div>
        <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Price (Rs)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Stock quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/assets/images/bikes/bike-1.jpg" className="mt-1" /></div>
        <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y min-h-[80px]" /></div>
      </AddEditModal>

      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Vehicle" itemName={deleteTarget?.modelName} onConfirm={handleDelete} loading={deleting} />

      <Footer />
    </>
  )
}
