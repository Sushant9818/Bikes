import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partId = searchParams.get('partId');

    if (!partId) {
      return NextResponse.json({ error: 'Missing partId' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { partId: parseInt(partId) },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    return NextResponse.json({
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        userName: r.user.fullName || 'Anonymous',
        createdAt: r.createdAt,
      })),
      averageRating: parseFloat(avgRating as string),
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
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

    const { partId, rating, title, content } = await request.json();

    if (!partId || !rating || !title || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const part = await prisma.part.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check if user already reviewed this part
    const existing = await prisma.review.findUnique({
      where: {
        userId_partId: {
          userId: user.id,
          partId,
        },
      },
    });

    if (existing) {
      // Update existing review
      await prisma.review.update({
        where: { id: existing.id },
        data: { rating, title, content: content || null },
      });
    } else {
      // Create new review
      await prisma.review.create({
        data: {
          userId: user.id,
          partId,
          rating,
          title,
          content: content || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error posting review:', error);
    return NextResponse.json(
      { error: 'Failed to post review' },
      { status: 500 }
    );
  }
}
