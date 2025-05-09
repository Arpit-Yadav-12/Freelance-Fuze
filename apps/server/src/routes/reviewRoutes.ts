import express from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController';
import { verifyClerkSession } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/:id', getReviewById);

// Protected routes
router.post('/', verifyClerkSession, createReview);
router.put('/:id', verifyClerkSession, updateReview);
router.delete('/:id', verifyClerkSession, deleteReview);

export default router; 