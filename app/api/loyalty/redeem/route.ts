import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Conversion: 100 points = $1
const POINTS_PER_DOLLAR = 100;

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

    const { pointsToRedeem, orderId } = await request.json();

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json(
        { error: 'Valid points amount is required' },
        { status: 400 }
      );
    }

    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
    });

    if (!loyalty) {
      return NextResponse.json(
        { error: 'Loyalty account not found' },
        { status: 404 }
      );
    }

    if (loyalty.availablePoints < pointsToRedeem) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      );
    }

    const discountAmount = pointsToRedeem / POINTS_PER_DOLLAR;

    // Create redemption
    const redemption = await prisma.redemption.create({
      data: {
        loyaltyId: loyalty.id,
        orderId,
        pointsUsed: pointsToRedeem,
        discountAmount,
      },
    });

    // Update available points
    await prisma.loyaltyAccount.update({
      where: { userId: user.id },
      data: {
        availablePoints: loyalty.availablePoints - pointsToRedeem,
      },
    });

    return NextResponse.json({
      redemption,
      discountAmount,
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    return NextResponse.json(
      { error: 'Failed to redeem points' },
      { status: 500 }
    );
  }
}
