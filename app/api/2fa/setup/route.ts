import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecret } from '@/lib/2fa/2fa';

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

    // Check if already enabled
    const existing = await prisma.twoFactorAuth.findUnique({
      where: { userId: user.id },
    });

    if (existing?.enabled) {
      return NextResponse.json(
        { error: '2FA already enabled' },
        { status: 400 }
      );
    }

    const { secret, qrCode, backupCodes } = await generateSecret(user.email);

    // Create or update 2FA record
    const twoFactor = await prisma.twoFactorAuth.upsert({
      where: { userId: user.id },
      update: { secret, backupCodes },
      create: {
        userId: user.id,
        secret,
        backupCodes,
      },
    });

    return NextResponse.json({
      secret: twoFactor.secret,
      qrCode,
      backupCodes: backupCodes.split(', '),
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
