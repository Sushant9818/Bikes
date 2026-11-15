import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        cartItems: {
          include: { part: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const items = user.cartItems.map(cartItem => ({
      id: cartItem.id,
      partId: cartItem.partId,
      partName: cartItem.part.partName,
      quantity: cartItem.quantity,
      price: cartItem.price,
    }));

    return NextResponse.json({
      items,
      totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
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

    const { partId, quantity, price } = await request.json();

    if (!partId || !quantity || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if part exists
    const part = await prisma.part.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Add or update cart item
    await prisma.cartItem.upsert({
      where: {
        userId_partId: {
          userId: user.id,
          partId,
        },
      },
      create: {
        userId: user.id,
        partId,
        quantity,
        price,
      },
      update: {
        quantity: {
          increment: quantity,
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
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by clerkUserId
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Clear all cart items for user
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
