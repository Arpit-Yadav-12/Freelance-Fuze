import express from 'express';
import { verifyClerkSession } from '../middleware/auth';
import { getProfile, deleteProfile } from '../controllers/profileController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyClerkSession);

// Get profile
router.get('/', getProfile);

// Delete profile
router.delete('/', deleteProfile);

export default router; 