'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Footer from '@/components/Footer'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import type { Offer } from '@prisma/client'

interface OfferFormState {
  title: string
  description: string
  discountPercent: string
  startDate: string
  endDate: string
  imageUrl: string
}

const emptyForm: OfferFormState = { title: '', description: '', discountPercent: '', startDate: '', endDate: '', imageUrl: '' }

function offerBadgeLabel(offer: Offer): string {
  if (offer.discountPercent) return `${offer.discountPercent}% OFF`
  const today = new Date().toISOString().slice(0, 10)
  const end = offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : null
  const start = offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : null
  if (end && end < today) return 'Expired'
  if (start && start > today) return 'Upcoming'
  return 'Active'
}

export default function OffersPage() {
  const { user } = useUser()
  const isAdmin = (user?.publicMetadata?.role as string | undefined) === 'ADMIN'

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [form, setForm] = useState<OfferFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchOffers = async () => {
    setLoading(true)
    const res = await fetch('/api/offers')
    setOffers(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchOffers() }, [])

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (offer: Offer) => {
    setEditing(offer)
    setForm({
      title: offer.title,
      description: offer.description ?? '',
      discountPercent: offer.discountPercent?.toString() ?? '',
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : '',
      imageUrl: offer.imageUrl ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || null,
      discountPercent: form.discountPercent ? Number(form.discountPercent) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      imageUrl: form.imageUrl || null,
    }
    const url = editing ? `/api/offers/${editing.id}` : '/api/offers'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setModalOpen(false); await fetchOffers() }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/offers/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setDeleteTarget(null); await fetchOffers() }
  }

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Special Offers</h1>
              <p className="text-zinc-500 text-sm mt-1">Exclusive deals and discounts from Suzuki Nepal</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Add Offer
              </Button>
            )}
          </div>

          {loading ? (
            <LoadingSpinner className="py-24" label="Loading offers..." />
          ) : offers.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Tag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium">No offers available right now</p>
            </div>
          ) : (
            <div className="space-y-5">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="h-1 bg-[#E60012]" />
                  <div className="p-6 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Badge className="mb-3 bg-[#E60012] text-white">{offerBadgeLabel(offer)}</Badge>
                      <h2 className="text-xl font-bold text-zinc-900 mb-2">{offer.title}</h2>
                      {offer.description && <p className="text-zinc-600 text-sm leading-relaxed">{offer.description}</p>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(offer)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-red-600 hover:bg-red-50 border-red-200" onClick={() => setDeleteTarget(offer)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddEditModal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Offer' : 'Add Offer'} onSubmit={onSubmit} loading={saving} submitLabel={editing ? 'Update' : 'Add'}>
        <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" required /></div>
        <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y min-h-[80px]" /></div>
        <div><Label>Discount % (optional)</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
          <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1" /></div>
        </div>
        <div><Label>Image URL (optional)</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="mt-1" /></div>
      </AddEditModal>

      <ConfirmDeleteDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete Offer" itemName={deleteTarget?.title} onConfirm={handleDelete} loading={deleting} />

      <Footer />
    </>
  )
}
