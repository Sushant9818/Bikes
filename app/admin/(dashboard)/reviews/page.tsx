'use client'

import { MessageSquare } from 'lucide-react'
import ReviewsTable from '@/components/admin/ReviewsTable'

export default function AdminReviewsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-[#E60012]" />
          Reviews Management
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Manage and monitor customer reviews
        </p>
      </div>

      <ReviewsTable />
    </div>
  )
}
