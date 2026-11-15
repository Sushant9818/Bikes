import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Generate unique referral code
function generateCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

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

    const codes = await prisma.referralCode.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { referrals: true } },
      },
    });

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: { code: true, referee: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ codes, referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
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

    // Check limit
    const existingCodes = await prisma.referralCode.count({
      where: { userId: user.id },
    });

    if (existingCodes >= 5) {
      return NextResponse.json(
        { error: 'Max 5 referral codes per user' },
        { status: 400 }
      );
    }

    const code = generateCode();

    const referralCode = await prisma.referralCode.create({
      data: {
        userId: user.id,
        code,
      },
    });

    return NextResponse.json(referralCode, { status: 201 });
  } catch (error) {
    console.error('Error creating referral code:', error);
    return NextResponse.json(
      { error: 'Failed to create referral code' },
      { status: 500 }
    );
  }
}
