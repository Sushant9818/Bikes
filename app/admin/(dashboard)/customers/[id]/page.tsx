import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CustomerDetail from '@/components/admin/CustomerDetail'
import { ApiError } from '@/lib/api-error'
import CustomerErrorUI from '@/components/admin/CustomerErrorUI'

type Params = { params: Promise<{ id: string }> }

interface Customer {
  id: number
  fullName: string | null
  email: string
  phoneNumber: string | null
  role: string
  createdAt: Date
  orders: Array<{
    id: number
    status: string
    totalAmount: number
    createdAt: Date
  }>
}

async function getCustomer(id: string): Promise<Customer> {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!user) {
    throw new ApiError(404, 'Customer not found')
  }
  return user as Customer
}

function CustomerDetailLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#E60012]" />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading customer...</p>
      </div>
    </div>
  )
}

export default async function CustomerDetailPage({ params }: Params) {
  const { id } = await params
  let customer: Customer | null = null
  let error: string | null = null

  try {
    customer = await getCustomer(id)
  } catch (err) {
    error = err instanceof ApiError ? err.message : 'Failed to load customer'
  }

  if (error) {
    return <CustomerErrorUI error={error} customerId={id} />
  }

  // Calculate stats from paid orders only
  const paidOrders = customer!.orders.filter((o) => o.status === 'PAID')
  const totalOrders = paidOrders.length
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
  const lastOrderDate = paidOrders.length > 0 ? paidOrders[0].createdAt : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Customer Details</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">{customer?.fullName || 'Customer'} - {customer?.email}</p>
          </div>
        </div>
      </div>

      {/* Detail Content */}
      <Suspense fallback={<CustomerDetailLoader />}>
        <CustomerDetail
          id={customer!.id}
          name={customer!.fullName}
          email={customer!.email}
          phone={customer!.phoneNumber}
          role={customer!.role}
          createdAt={customer!.createdAt}
          stats={{
            totalOrders,
            totalSpent,
            avgOrderValue,
            lastOrderDate,
          }}
        />
      </Suspense>
    </div>
  )
}
