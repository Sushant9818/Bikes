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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const returns = await prisma.return.findMany({
      where: { userId: user.id },
      include: {
        order: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ returns });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { orderId, reason, items } = await request.json();

    if (!orderId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order ID, reason, and items are required' },
        { status: 400 }
      );
    }

    // Fetch order to calculate return amount
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate return amount
    let returnAmount = 0;
    for (const returnItem of items) {
      const orderItem = order.items.find(oi => oi.id === returnItem.orderItemId);
      if (orderItem) {
        returnAmount += orderItem.price * returnItem.quantity;
      }
    }

    // Create return
    const newReturn = await prisma.return.create({
      data: {
        orderId,
        userId: user.id,
        reason,
        returnAmount,
        items: {
          create: items,
        },
      },
      include: {
        order: true,
        items: true,
      },
    });

    return NextResponse.json(newReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return' },
      { status: 500 }
    );
  }
}
