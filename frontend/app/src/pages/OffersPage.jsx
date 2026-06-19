import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'
import * as offersApi from '@/api/offers'
import Footer from '@/components/Footer'
import AddEditModal from '@/components/AddEditModal'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Tag, CalendarDays, Percent, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const offerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
})

function offerBadgeLabel(offer) {
  if (offer.discountPercent) return `${offer.discountPercent}% OFF`
  const today = new Date().toISOString().slice(0, 10)
  if (offer.endDate && offer.endDate < today) return 'Expired'
  if (offer.startDate && offer.startDate > today) return 'Upcoming'
  return 'Active'
}

function offerBadgeColor(offer) {
  const today = new Date().toISOString().slice(0, 10)
  if (offer.endDate && offer.endDate < today) return 'bg-zinc-400 text-white'
  if (offer.startDate && offer.startDate > today) return 'bg-blue-500 text-white'
  if (offer.discountPercent) return 'bg-green-600 text-white'
  return 'bg-[#E60012] text-white'
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function OffersPage() {
  const { isAdmin } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: { title: '', description: '', discountPercent: null, startDate: '', endDate: '', imageUrl: '' },
  })

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const data = await offersApi.getOffers()
      setOffers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOffers() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ title: '', description: '', discountPercent: null, startDate: '', endDate: '', imageUrl: '' })
    setModalOpen(true)
  }

  const openEdit = (offer) => {
    setEditing(offer)
    reset({
      title: offer.title,
      description: offer.description || '',
      discountPercent: offer.discountPercent ?? null,
      startDate: offer.startDate || '',
      endDate: offer.endDate || '',
      imageUrl: offer.imageUrl || '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        discountPercent: data.discountPercent != null && data.discountPercent !== '' ? Number(data.discountPercent) : null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        imageUrl: data.imageUrl?.trim() || null,
      }
      if (editing?.id) {
        await offersApi.updateOffer(editing.id, payload)
        toast.success('Offer updated')
      } else {
        await offersApi.createOffer(payload)
        toast.success('Offer added')
      }
      setModalOpen(false)
      await fetchOffers()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save offer'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await offersApi.deleteOffer(deleteTarget.id)
      toast.success('Offer deleted')
      setDeleteTarget(null)
      await fetchOffers()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="py-10 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Special Offers</h1>
              <p className="text-zinc-500 text-sm mt-1">Exclusive deals and discounts from Suzuki Nepal</p>
            </div>
            {isAdmin() && (
              <Button onClick={openAdd} className="bg-[#E60012] hover:bg-[#C5000F] rounded-xl shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Add Offer
              </Button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSpinner className="py-24" label="Loading offers..." />
          ) : offers.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Tag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium">No offers available right now</p>
              <p className="text-zinc-400 text-sm mt-1">Check back soon for exclusive deals.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Red accent bar */}
                  <div className="h-1 bg-[#E60012]" />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={offerBadgeColor(offer)}>
                            {offerBadgeLabel(offer)}
                          </Badge>
                          {offer.discountPercent && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              <Percent className="w-3 h-3" /> {offer.discountPercent}% Discount
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">{offer.title}</h2>
                        {offer.description && (
                          <p className="text-zinc-600 text-sm leading-relaxed mb-4">{offer.description}</p>
                        )}
                        {(offer.startDate || offer.endDate) && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {offer.startDate && <span>{formatDate(offer.startDate)}</span>}
                            {offer.startDate && offer.endDate && <span>→</span>}
                            {offer.endDate && <span>{formatDate(offer.endDate)}</span>}
                          </div>
                        )}
                      </div>

                      {/* Admin actions */}
                      {isAdmin() && (
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(offer)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl text-red-600 hover:bg-red-50 border-red-200" onClick={() => setDeleteTarget(offer)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Store Location Map */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-[#E60012]" />
            <h2 className="text-xl font-bold text-zinc-900">Visit Our Showroom</h2>
          </div>
          <p className="text-zinc-500 text-sm mb-6">
            Balkumari, Lalitpur, Nepal ·{' '}
            <a
              href="https://www.openstreetmap.org/?mlat=27.6697&mlon=85.3261#map=16/27.6697/85.3261"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E60012] hover:underline font-medium"
            >
              Open in maps →
            </a>
          </p>
          <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
            <iframe
              title="Suzuki Motorcycle Nepal — Balkumari, Lalitpur"
              src="https://www.openstreetmap.org/export/embed.html?bbox=85.3161%2C27.6647%2C85.3361%2C27.6747&layer=mapnik&marker=27.6697%2C85.3261"
              width="100%"
              height="380"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              allowFullScreen
            />
          </div>
          <p className="text-zinc-400 text-xs mt-2">
            Map data ©{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
              OpenStreetMap
            </a>{' '}
            contributors
          </p>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Offer' : 'Add Offer'}
        onSubmit={handleSubmit(onSubmit)}
        loading={saving}
        submitLabel={editing ? 'Update' : 'Add'}
      >
        <div>
          <Label>Title *</Label>
          <Input {...register('title')} placeholder="e.g. Festival Season 10% Off" className="mt-1" />
          {errors.title && <p className="text-[#E60012] text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Label>Description</Label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Details about this offer..."
            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-xl text-sm resize-y min-h-[80px]"
          />
        </div>
        <div>
          <Label>Discount % (optional)</Label>
          <Input type="number" {...register('discountPercent', { valueAsNumber: true })} placeholder="e.g. 10" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Date</Label>
            <Input type="date" {...register('startDate')} className="mt-1" />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" {...register('endDate')} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Image URL (optional)</Label>
          <Input {...register('imageUrl')} placeholder="/assets/images/offer.jpg" className="mt-1" />
        </div>
      </AddEditModal>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Offer"
        itemName={deleteTarget?.title}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Footer />
    </>
  )
}
