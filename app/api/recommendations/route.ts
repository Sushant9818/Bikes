import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { limit = 8 } = Object.fromEntries(request.nextUrl.searchParams);

    // Get all parts with rating/popularity metrics
    const allParts = await prisma.part.findMany({
      include: {
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { cartItems: true, orderItems: true },
        },
      },
    });

    // Calculate scores for each part
    const partsWithScores = allParts.map((part) => {
      const avgRating = part.reviews.length > 0
        ? part.reviews.reduce((sum, r) => sum + r.rating, 0) / part.reviews.length
        : 0;

      const purchaseCount = part._count.orderItems || 0;
      const cartCount = part._count.cartItems || 0;
      const reviewCount = part.reviews.length;

      // Popularity score: purchases (weighted) + cart adds + reviews
      const popularityScore = (purchaseCount * 2) + cartCount + (reviewCount * 0.5);

      // Combined score: popularity + rating
      const score = popularityScore + (avgRating * 10);

      return {
        ...part,
        avgRating,
        purchaseCount,
        score,
      };
    });

    // If authenticated user: personalize based on history
    let recommendations = partsWithScores;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
        include: {
          orders: {
            include: {
              items: {
                include: { part: true },
              },
            },
            take: 20,
          },
        },
      });

      if (user) {
        // Get part types from user's purchase history
        const purchasedPartIds = new Set<number>();
        const userPartTypes = new Set<string>();

        user.orders.forEach(order => {
          order.items.forEach(item => {
            purchasedPartIds.add(item.partId);
            userPartTypes.add(item.part.type);
          });
        });

        // Boost score for parts in similar types (but not already purchased)
        recommendations = partsWithScores
          .filter(p => !purchasedPartIds.has(p.id))
          .map(p => ({
            ...p,
            score: userPartTypes.has(p.type) ? p.score * 1.5 : p.score,
          }));
      }
    }

    // Sort by score descending and take limit
    const topRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(String(limit)))
      .map(({ _count, avgRating, purchaseCount, score, reviews, ...part }) => ({
        ...part,
        avgRating: Math.round(avgRating * 10) / 10,
        purchaseCount,
      }));

    return NextResponse.json({ recommendations: topRecommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
