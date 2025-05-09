import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Validate rating is between 1 and 5
const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getReviewById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  const { rating, comment, serviceId, orderId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isValidRating(rating)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if user has completed an order for this service
    const completedOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        serviceId,
        status: 'completed',
        paymentStatus: 'paid'
      }
    });

    if (!completedOrder) {
      return res.status(403).json({ error: 'You can only review services you have purchased and completed' });
    }

    // Check for existing review for this order
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        orderId
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this order' });
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        serviceId,
        orderId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true
          }
        }
      }
    });

    // Update seller's average rating
    await updateSellerRating(serviceId);

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to update seller's average rating
async function updateSellerRating(serviceId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      userId: true,
      reviews: {
        select: {
          rating: true
        }
      }
    }
  });

  if (service) {
    const sellerId = service.userId;
    const sellerServices = await prisma.service.findMany({
      where: { userId: sellerId },
      select: {
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Calculate average rating across all seller's services
    const allRatings = sellerServices.flatMap(s => s.reviews.map(r => r.rating));
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((acc, rating) => acc + rating, 0) / allRatings.length
      : 0;

    // Update seller's profile with average rating
    await prisma.profile.update({
      where: { userId: sellerId },
      data: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: allRatings.length
      }
    });
  }
}

export const updateReview = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isValidRating(rating)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id },
      select: {
        userId: true,
        service: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: true
          }
        }
      }
    });

    // Recalculate seller's average rating
    const sellerId = existingReview.service.userId;
    const sellerServices = await prisma.service.findMany({
      where: { userId: sellerId },
      select: {
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    const allRatings = sellerServices.flatMap(s => s.reviews.map(r => r.rating));
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((acc, rating) => acc + rating, 0) / allRatings.length
      : 0;

    await prisma.profile.update({
      where: { userId: sellerId },
      data: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: allRatings.length
      }
    });

    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.review.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getServiceReviews = async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { serviceId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.review.count({ where: { serviceId } })
    ]);

    res.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 