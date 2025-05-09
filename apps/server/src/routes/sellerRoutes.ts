import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient, User, Profile, Service, Prisma } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();
const prisma = new PrismaClient();

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Middleware to verify Clerk session
const verifyClerkSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the JWT token
    const decoded = await clerkClient.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's email from Clerk
    const clerkUser = await clerkClient.users.getUser(decoded.sub);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return res.status(401).json({ error: 'User email not found' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = { userId: user.id, email: userEmail };
    next();
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Create seller profile
router.post('/profile', verifyClerkSession, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title, bio, skills, hourlyRate, category, portfolio, experience, education } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user already has a profile
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role to seller and update/create profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'seller',
        profile: existingUser.profile ? {
          update: {
            bio,
            skills: Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim()),
            hourlyRate: parseFloat(hourlyRate),
            category,
            portfolio,
            experience,
            education,
            // Initialize seller statistics if they don't exist
            averageRating: existingUser.profile.averageRating || 0,
            totalReviews: existingUser.profile.totalReviews || 0,
            completedGigs: existingUser.profile.completedGigs || 0,
            trophyLevel: existingUser.profile.trophyLevel || 'none'
          }
        } : {
          create: {
            bio,
            skills: Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim()),
            hourlyRate: parseFloat(hourlyRate),
            category,
            portfolio,
            experience,
            education,
            // Initialize seller statistics
            averageRating: 0,
            totalReviews: 0,
            completedGigs: 0,
            trophyLevel: 'none'
          }
        }
      },
      include: {
        profile: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Error creating seller profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get seller profile
router.get('/profile', verifyClerkSession, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        profile: {
          select: {
            bio: true,
            location: true,
            website: true,
            socialLinks: true,
            skills: true,
            hourlyRate: true,
            category: true,
            portfolio: true,
            experience: true,
            education: true,
            averageRating: true,
            totalReviews: true,
            completedGigs: true,
            trophyLevel: true,
            createdAt: true,
            updatedAt: true
          }
        },
        services: {
          include: {
            reviews: {
              select: {
                rating: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get seller services
router.get('/services', verifyClerkSession, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { services: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ services: user.services });
  } catch (error) {
    console.error('Error fetching seller services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 