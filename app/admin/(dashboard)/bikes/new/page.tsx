import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import BikeForm from '@/components/admin/forms/BikeForm'

export default function NewBikePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bikes"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Add New Bike</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Create a new Suzuki bike listing</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 lg:p-8">
        <BikeForm />
      </div>
    </div>
  )
}
