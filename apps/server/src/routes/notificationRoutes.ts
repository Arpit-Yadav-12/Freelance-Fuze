import express from 'express';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../controllers/notificationController';
import { verifyClerkSession } from '../middleware/auth';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', verifyClerkSession, getNotifications);

// Mark a specific notification as read
router.post('/:id/read', verifyClerkSession, markNotificationAsRead);

// Mark all notifications as read
router.post('/read-all', verifyClerkSession, markAllNotificationsAsRead);

export default router; 