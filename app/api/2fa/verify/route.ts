import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/2fa/2fa';

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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId: user.id },
    });

    if (!twoFactor) {
      return NextResponse.json(
        { error: '2FA not setup' },
        { status: 400 }
      );
    }

    const valid = verifyToken(twoFactor.secret, token);

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId: user.id },
      data: {
        enabled: true,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}
