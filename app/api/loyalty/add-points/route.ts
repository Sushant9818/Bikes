import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const calculateTier = (points: number) => {
  if (points >= 10000) return 'PLATINUM';
  if (points >= 5000) return 'GOLD';
  if (points >= 1000) return 'SILVER';
  return 'BRONZE';
};

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

    const { targetUserId, points, reason, orderId } = await request.json();

    if (!targetUserId || !points || !reason) {
      return NextResponse.json(
        { error: 'Target user ID, points, and reason are required' },
        { status: 400 }
      );
    }

    let loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: targetUserId },
    });

    if (!loyalty) {
      loyalty = await prisma.loyaltyAccount.create({
        data: { userId: targetUserId },
      });
    }

    const newTotal = loyalty.totalPoints + points;
    const newTier = calculateTier(newTotal);

    const updated = await prisma.loyaltyAccount.update({
      where: { userId: targetUserId },
      data: {
        totalPoints: newTotal,
        availablePoints: loyalty.availablePoints + points,
        tier: newTier,
      },
    });

    // Log transaction
    await prisma.pointTransaction.create({
      data: {
        loyaltyId: loyalty.id,
        orderId,
        points,
        reason,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error adding points:', error);
    return NextResponse.json(
      { error: 'Failed to add points' },
      { status: 500 }
    );
  }
}
