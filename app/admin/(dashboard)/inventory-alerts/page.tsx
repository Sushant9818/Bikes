'use client'

import { AlertTriangle } from 'lucide-react'
import InventoryAlerts from '@/components/admin/InventoryAlerts'

export default function InventoryAlertsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-[#E60012]" />
          Inventory Alerts
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Monitor and manage low stock items
        </p>
      </div>

      <InventoryAlerts />
    </div>
  )
}
