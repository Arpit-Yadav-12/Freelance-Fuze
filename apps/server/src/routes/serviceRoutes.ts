import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { getServices, getServiceById, createService, updateService, deleteService, fixServiceCategories } from '../controllers/serviceController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyClerkSession } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  file?: Express.Multer.File;
}

interface Package {
  name: string;
  description: string;
  price: number;
  deliveryTime: number;
  features: string[];
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Upload image endpoint
router.post('/upload', verifyClerkSession, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL of the uploaded file
    const fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Public routes
router.get('/', getServices);
router.get('/:id', getServiceById);

// Protected routes
router.post('/', verifyClerkSession, createService);
router.put('/:id', verifyClerkSession, updateService);
router.delete('/:id', verifyClerkSession, deleteService);

// Admin route to fix categories
router.post('/fix-categories', verifyClerkSession, fixServiceCategories);

export default router; 