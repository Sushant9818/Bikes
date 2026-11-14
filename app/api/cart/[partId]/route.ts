import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partId = Number((await params).partId);
    const { quantity } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    // Get user by clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update cart item quantity
    await prisma.cartItem.update({
      where: {
        userId_partId: {
          userId: user.id,
          partId,
        },
      },
      data: { quantity },
    });

    // Fetch updated cart
    const updatedCart = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        cartItems: {
          include: { part: true },
        },
      },
    });

    const items = updatedCart?.cartItems.map(cartItem => ({
      id: cartItem.id,
      partId: cartItem.partId,
      partName: cartItem.part.partName,
      quantity: cartItem.quantity,
      price: cartItem.price,
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partId = Number((await params).partId);

    // Get user by clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: {
        userId_partId: {
          userId: user.id,
          partId,
        },
      },
    });

    // Fetch updated cart
    const updatedCart = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        cartItems: {
          include: { part: true },
        },
      },
    });

    const items = updatedCart?.cartItems.map(cartItem => ({
      id: cartItem.id,
      partId: cartItem.partId,
      partName: cartItem.part.partName,
      quantity: cartItem.quantity,
      price: cartItem.price,
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
}
