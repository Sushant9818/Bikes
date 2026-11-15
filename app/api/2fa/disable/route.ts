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

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password confirmation is required' },
        { status: 400 }
      );
    }

    // Disable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId: user.id },
      data: {
        enabled: false,
        verifiedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
