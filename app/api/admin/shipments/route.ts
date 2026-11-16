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

    const shipments = await prisma.shipment.findMany({
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ shipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { orderId, trackingNumber, provider, shippingCost } = await request.json();

    if (!orderId || !trackingNumber) {
      return NextResponse.json(
        { error: 'Order ID and tracking number are required' },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculate estimated delivery (3-5 days for standard)
    const estimatedDelivery = new Date();
    const daysToAdd = provider === 'EXPRESS' ? 1 : provider === 'OVERNIGHT' ? 0 : 3;
    estimatedDelivery.setDate(estimatedDelivery.getDate() + daysToAdd);

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        trackingNumber,
        provider: provider || 'STANDARD',
        shippingCost: shippingCost || 0,
        estimatedDelivery,
        status: 'SHIPPED',
      },
      include: { order: true },
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
