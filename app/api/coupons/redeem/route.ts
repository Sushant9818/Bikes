import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code required' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Increment usage count
    await prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usesCount: coupon.usesCount + 1 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json(
      { error: 'Failed to redeem coupon' },
      { status: 500 }
    );
  }
}
