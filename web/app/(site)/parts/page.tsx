'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useCart } from '@/cart/CartContext'
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
import type { Part } from '@prisma/client'

interface PartFormState {
  type: 'BIKE_PART' | 'SCOOTER_PART'
  partName: string
  compatibleModel: string
  price: number
  quantity: number
  imageUrl: string
}

const emptyForm: PartFormState = { type: 'BIKE_PART', partName: '', compatibleModel: '', price: 0, quantity: 0, imageUrl: '' }

export default function PartsPage() {
  const { user, isSignedIn } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'
  const { addToCart } = useCart()
  const router = useRouter()

  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'BIKE_PART' | 'SCOOTER_PART'>('BIKE_PART')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null)
  const [editing, setEditing] = useState<Part | null>(null)
  const [form, setForm] = useState<PartFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const params = new URLSearchParams({ type: typeFilter })
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    const res = await fetch(`/api/parts?${params}`)
    setParts(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [typeFilter])

  const displayList = useMemo(() => [...parts].sort((a, b) => a.id - b.id), [parts])

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm, type: typeFilter }); setModalOpen(true) }
  const openEdit = (p: Part) => {
    setEditing(p)
    setForm({ type: p.type, partName: p.partName, compatibleModel: p.compatibleModel ?? '', price: p.price, quantity: p.quantity, imageUrl: p.imageUrl ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, compatibleModel: form.compatibleModel || undefined, imageUrl: form.imageUrl || undefined }
    const url = editing ? `/api/parts/${editing.id}` : '/api/parts'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setModalOpen(false); await fetchData() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/parts/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setDeleteTarget(null); await fetchData() }
  }

  return (
    <>
      <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">{typeFilter === 'BIKE_PART' ? 'Suzuki Bike Parts' : 'Suzuki Scooter Parts'}</h1>
              <p className="text-zinc-600 text-sm mt-1">{displayList.length} part(s)</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Add Part
              </Button>
            )}
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <PartCategoryTabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'BIKE_PART' | 'SCOOTER_PART')} />
            <form onSubmit={(e) => { e.preventDefault(); fetchData() }} className="flex-1 flex gap-2 min-w-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input placeholder="Search by name or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
              </div>
              <Button type="submit" variant="outline" className="rounded-xl shrink-0">Search</Button>
            </form>
          </div>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading parts..." />
          ) : displayList.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="text-zinc-600 text-lg font-medium">No parts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayList.map((p, i) => (
                <PartCard
                  key={p.id}
                  serialNumber={i + 1}
                  part={p}
                  onEdit={isAdmin ? openEdit : undefined}
                  onDelete={isAdmin ? (part) => setDeleteTarget(part) : undefined}
                  onAddToCart={
                    !isAdmin
                      ? (part) => {
                          if (!isSignedIn) { router.push('/sign-in'); return }
                          addToCart(part)
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Part' : 'Add Part'} onSubmit={onSubmit} loading={saving} submitLabel={editing ? 'Update' : 'Add'}>
        <div>
          <Label>Category</Label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'BIKE_PART' | 'SCOOTER_PART' })} className="w-full h-11 px-3 border border-zinc-200 rounded-xl mt-1">
            <option value="BIKE_PART">Bike Part</option>
            <option value="SCOOTER_PART">Scooter Part</option>
          </select>
        </div>
        <div><Label>Part Name *</Label><Input value={form.partName} onChange={(e) => setForm({ ...form, partName: e.target.value })} className="mt-1" required /></div>
        <div><Label>Compatible Model</Label><Input value={form.compatibleModel} onChange={(e) => setForm({ ...form, compatibleModel: e.target.value })} className="mt-1" /></div>
        <div><Label>Price (Rs)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-1" /></div>
        <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="mt-1" /></div>
      </AddEditModal>

      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Part" itemName={deleteTarget?.partName} onConfirm={handleDelete} loading={deleting} />

      <Footer />
    </>
  )
}
