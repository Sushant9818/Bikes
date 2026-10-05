'use client'

import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

export default function PermissionDeniedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
            <Lock className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Access Denied
        </h1>

        {/* Subheading */}
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
          Permission Denied
        </p>

        {/* Description */}
        <p className="text-slate-500 dark:text-slate-500 mb-8">
          You don't have the required permissions to access this resource. If you believe this is an error, please contact the administrator.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        {/* Additional info */}
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-8">
          Error Code: 403 Forbidden
        </p>
      </div>
    </div>
  )
}
