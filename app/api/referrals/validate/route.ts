import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const referralCode = await prisma.referralCode.findUnique({
      where: { code },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    if (!referralCode.isActive) {
      return NextResponse.json(
        { error: 'This referral code is no longer active' },
        { status: 400 }
      );
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (user?.id === referralCode.userId) {
        return NextResponse.json(
          { error: 'Cannot use your own referral code' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      valid: true,
      code: referralCode.code,
      referrer: referralCode.user,
      commissionRate: referralCode.commissionRate,
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}
