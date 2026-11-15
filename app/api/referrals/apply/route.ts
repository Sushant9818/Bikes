import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const { code, orderId, orderAmount } = await request.json();

    if (!code || !orderId) {
      return NextResponse.json(
        { error: 'Code and order ID are required' },
        { status: 400 }
      );
    }

    const referralCode = await prisma.referralCode.findUnique({
      where: { code },
    });

    if (!referralCode || !referralCode.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive referral code' },
        { status: 400 }
      );
    }

    // Check if already used for this order
    const existing = await prisma.referral.findFirst({
      where: { orderId, codeId: referralCode.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Code already applied to this order' },
        { status: 400 }
      );
    }

    // Calculate commission
    const commissionEarned = (orderAmount * referralCode.commissionRate) / 100;

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        codeId: referralCode.id,
        referrerId: referralCode.userId,
        refereeId: user.id,
        orderId,
        commissionEarned,
        status: 'PENDING',
      },
    });

    // Update referral code stats
    await prisma.referralCode.update({
      where: { id: referralCode.id },
      data: {
        totalEarnings: { increment: commissionEarned },
        totalReferrals: { increment: 1 },
      },
    });

    return NextResponse.json({
      referral,
      commissionEarned,
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    );
  }
}
