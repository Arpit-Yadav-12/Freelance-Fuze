import express, { Request, Response } from 'express';
import { register, login } from '../controllers/authController';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/register', register);
router.post('/login', login);

// Verify user exists
router.get('/verify-user', async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Create user after Clerk signup
router.post('/create-user', async (req: Request, res: Response) => {
  try {
    const { clerkId, email, firstName, lastName } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`.trim(),
        role: 'buyer',
        clerkId,
        profile: {
          create: {
            bio: '',
            location: '',
            skills: []
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Update Clerk user's public metadata with our database userId
    await clerkClient.users.updateUser(clerkId, {
      publicMetadata: {
        userId: user.id
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 