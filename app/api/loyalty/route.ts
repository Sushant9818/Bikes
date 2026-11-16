import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Calculate tier based on points
const calculateTier = (points: number) => {
  if (points >= 10000) return 'PLATINUM';
  if (points >= 5000) return 'GOLD';
  if (points >= 1000) return 'SILVER';
  return 'BRONZE';
};

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

    let loyalty = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.id },
      include: {
        transactions: { take: 10, orderBy: { createdAt: 'desc' } },
        redemptions: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    // Create if doesn't exist
    if (!loyalty) {
      loyalty = await prisma.loyaltyAccount.create({
        data: { userId: user.id },
        include: {
          transactions: { take: 10, orderBy: { createdAt: 'desc' } },
          redemptions: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });
    }

    return NextResponse.json(loyalty);
  } catch (error) {
    console.error('Error fetching loyalty account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty account' },
      { status: 500 }
    );
  }
}
