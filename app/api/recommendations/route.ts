import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');

    // Get all parts with stats
    const parts = await prisma.part.findMany({
      include: {
        reviews: { select: { rating: true } },
        _count: { select: { orderItems: true } },
      },
      take: limit * 2,
    });

    // Calculate scores
    const partsWithScores = parts.map(part => {
      const avgRating = part.reviews.length > 0
        ? part.reviews.reduce((sum, r) => sum + r.rating, 0) / part.reviews.length
        : 0;

      const purchaseCount = part._count.orderItems || 0;
      const score = (purchaseCount * 2) + (avgRating * 10);

      return {
        id: part.id,
        partName: part.partName,
        imageUrl: part.imageUrl,
        price: part.price,
        avgRating: Math.round(avgRating * 10) / 10,
        purchaseCount,
        score,
      };
    });

    // Sort by score and limit
    const recommendations = partsWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...rest }) => rest);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations', recommendations: [] },
      { status: 500 }
    );
  }
}
