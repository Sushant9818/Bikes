import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const returnId = parseInt((await params).id);

    if (!returnId || isNaN(returnId)) {
      return NextResponse.json({ error: 'Invalid return ID' }, { status: 400 });
    }

    const return_ = await prisma.return.findUnique({
      where: { id: returnId },
      include: { order: true, user: true, items: true },
    });

    if (!return_) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    // Check access
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (user?.id !== return_.userId && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(return_);
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const returnId = parseInt((await params).id);

    if (!returnId || isNaN(returnId)) {
      return NextResponse.json({ error: 'Invalid return ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId || '' },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status, notes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const refundDate = status === 'REFUNDED' ? new Date() : null;

    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: {
        status,
        notes,
        refundDate,
      },
      include: {
        order: true,
        user: true,
        items: true,
      },
    });

    return NextResponse.json(updatedReturn);
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    );
  }
}
