import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { clerkClient, ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  auth?: {
    userId: string;
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key') as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

// Use Clerk's built-in requireAuth middleware
export const verifyClerkSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    // Find user by email in our database
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user info to request using our database's unique ID
    req.user = { 
      id: user.id, 
      email: userEmail, 
      role: user.role 
    };
    next();
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const isSeller = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.role || req.user.role !== 'seller') {
    return res.status(403).json({ error: 'Access denied. Seller role required.' });
  }
  next();
};

export const isBuyer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.role || req.user.role !== 'buyer') {
    return res.status(403).json({ error: 'Access denied. Buyer role required.' });
  }
  next();
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return res.status(401).json({ error: 'User not found in Clerk' });
    }

    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        }
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await clerkClient.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await clerkClient.users.getUser(decoded.sub);
    req.user = {
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      role: 'user' // Add a default role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}; 