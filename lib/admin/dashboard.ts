import { prisma } from '@/lib/prisma'

export async function getKPIs() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const [totalBikes, totalScooters, totalParts, totalOrders, totalRevenue, paidOrders] = await Promise.all([
    prisma.vehicle.count({ where: { type: 'BIKE' } }),
    prisma.vehicle.count({ where: { type: 'SCOOTER' } }),
    prisma.part.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: {
        status: 'PAID',
        createdAt: { gte: lastMonth },
      },
    }),
  ])

  const lastMonthRevenue = await prisma.order.aggregate({
    where: {
      status: 'PAID',
      createdAt: { gte: lastMonth, lt: today },
    },
    _sum: { totalAmount: true },
  })

  const thisMonthRevenue = await prisma.order.aggregate({
    where: {
      status: 'PAID',
      createdAt: { gte: today },
    },
    _sum: { totalAmount: true },
  })

  const lastMonthOrdersCount = await prisma.order.count({
    where: {
      status: 'PAID',
      createdAt: { gte: lastMonth, lt: today },
    },
  })

  const thisMonthOrdersCount = await prisma.order.count({
    where: {
      status: 'PAID',
      createdAt: { gte: today },
    },
  })

  const lastMonthTotal = lastMonthRevenue._sum.totalAmount || 0
  const thisMonthTotal = thisMonthRevenue._sum.totalAmount || 0
  const revenueTrend = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  const lastMonthOrders = lastMonthOrdersCount
  const thisMonthOrders = thisMonthOrdersCount
  const ordersTrend = lastMonthOrders > 0 ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0

  return {
    totalBikes,
    totalScooters,
    totalParts,
    totalOrders,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    paidOrders,
    revenueTrend: Math.round(revenueTrend * 100) / 100,
    ordersTrend: Math.round(ordersTrend * 100) / 100,
    thisMonthRevenue: thisMonthTotal,
    thisMonthOrders,
  }
}

export async function getMonthlyRevenue() {
  const months = []
  const data = []

  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    date.setDate(1)
    date.setHours(0, 0, 0, 0)

    const nextMonth = new Date(date)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    months.push(monthName)

    const revenue = await prisma.order.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: date,
          lt: nextMonth,
        },
      },
      _sum: { totalAmount: true },
    })

    data.push(revenue._sum.totalAmount || 0)
  }

  return months.map((month, index) => ({
    month,
    revenue: data[index],
  }))
}

export async function getCategoryRevenue() {
  const bikeRevenue = await prisma.order.aggregate({
    where: {
      status: 'PAID',
      items: {
        some: {
          part: {
            type: 'BIKE_PART',
          },
        },
      },
    },
    _sum: { totalAmount: true },
  })

  const scooterRevenue = await prisma.order.aggregate({
    where: {
      status: 'PAID',
      items: {
        some: {
          part: {
            type: 'SCOOTER_PART',
          },
        },
      },
    },
    _sum: { totalAmount: true },
  })

  const appointmentRevenue = await prisma.appointment.aggregate({
    where: {
      status: 'COMPLETED',
      finalCost: { not: null },
    },
    _sum: { finalCost: true },
  })

  return [
    { name: 'Bike Parts', value: Math.round((bikeRevenue._sum.totalAmount || 0) * 100) / 100, color: '#E60012' },
    { name: 'Scooter Parts', value: Math.round((scooterRevenue._sum.totalAmount || 0) * 100) / 100, color: '#FF6B6B' },
    { name: 'Services', value: Math.round((appointmentRevenue._sum.finalCost || 0) * 100) / 100, color: '#4ECDC4' },
    { name: 'Others', value: 2500, color: '#95E1D3' },
  ]
}

export async function getLowStockParts() {
  const parts = await prisma.part.findMany({
    take: 5,
    orderBy: { quantity: 'asc' },
  })

  // Filter parts that are low stock (quantity <= minStock)
  const lowStockParts = parts
    .filter((part) => part.quantity <= part.minStock)
    .slice(0, 5)

  return lowStockParts.map((part) => ({
    id: part.id,
    name: part.partName,
    sku: part.sku,
    quantity: part.quantity,
    minStock: part.minStock,
    status: part.quantity <= part.minStock / 2 ? 'critical' : 'warning',
  }))
}

export async function getRecentAppointments() {
  const appointments = await prisma.appointment.findMany({
    where: {
      status: {
        in: ['PENDING', 'APPROVED', 'IN_PROGRESS'],
      },
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      services: true,
    },
  })

  return appointments.map((apt) => ({
    id: apt.id,
    clientUsername: apt.clientUsername,
    bikeModel: apt.bikeModel,
    preferredDate: apt.preferredDate.toISOString(),
    status: apt.status,
    estimatedCost: apt.estimatedCost,
    serviceCount: apt.services.length,
  }))
}
