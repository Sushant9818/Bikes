import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code, cartTotal } = await request.json();

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

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'This coupon is no longer valid' },
        { status: 400 }
      );
    }

    // Check expiry date
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      );
    }

    // Check max uses
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check minimum amount
    if (coupon.minAmount && cartTotal < coupon.minAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount of ₹${coupon.minAmount} required for this coupon`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountPercent) {
      discount = (cartTotal * coupon.discountPercent) / 100;
    } else if (coupon.discountFixed) {
      discount = coupon.discountFixed;
    }

    const finalAmount = Math.max(0, cartTotal - discount);

    return NextResponse.json({
      valid: true,
      couponCode: coupon.code,
      discountPercent: coupon.discountPercent || null,
      discountFixed: coupon.discountFixed || null,
      discountAmount: discount,
      originalAmount: cartTotal,
      finalAmount,
      description: coupon.description,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
