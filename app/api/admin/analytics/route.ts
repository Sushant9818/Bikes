import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Overall stats
    const totalOrders = await prisma.order.count();
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
    });

    const paidOrders = await prisma.order.count({
      where: { status: 'PAID' },
    });

    // Order status breakdown
    const orderStatusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    // Revenue by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDate = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: { totalAmount: true },
      _count: true,
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'PAID',
      },
    });

    // Top selling parts
    const topParts = await prisma.orderItem.groupBy({
      by: ['partId', 'partName'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Customer metrics
    const totalCustomers = await prisma.user.count({
      where: { role: 'USER' },
    });

    const repeatCustomers = await prisma.user.findMany({
      where: {
        role: 'USER',
        orders: {
          some: {},
        },
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    const repeatCount = repeatCustomers.filter(c => c._count.orders > 1).length;

    // Average order value
    const totalRev = totalRevenue._sum.totalAmount || 0;
    const avgOrderValue = totalOrders > 0 ? totalRev / totalOrders : 0;

    return NextResponse.json({
      overview: {
        totalOrders,
        totalRevenue: totalRev,
        paidOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      orderStatusBreakdown: orderStatusBreakdown.reduce((acc, status) => {
        acc[status.status] = status._count;
        return acc;
      }, {} as Record<string, number>),
      revenueByDate: revenueByDate
        .map(entry => ({
          date: new Date(entry.createdAt).toISOString().split('T')[0],
          revenue: entry._sum.totalAmount ?? 0,
          orderCount: entry._count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      topParts: topParts.map(part => ({
        partId: part.partId,
        partName: part.partName,
        quantity: part._sum.quantity ?? 0,
        orderCount: part._count,
      })),
      customerMetrics: {
        totalCustomers,
        repeatCustomers: repeatCount,
        newCustomers: totalCustomers - repeatCount,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
