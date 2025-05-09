import express from 'express';
import { getOrders, getOrderById, createOrder, updateOrderStatus, deleteOrder, cancelOrder } from '../controllers/orderController';
import { verifyClerkSession } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyClerkSession);

// Get all orders for the authenticated user
router.get('/', getOrders);

// Get a specific order
router.get('/:id', getOrderById);

// Create a new order
router.post('/', createOrder);

// Update order status (accept/reject/complete)
router.put('/:id/status', updateOrderStatus);

// Cancel an order
router.post('/:id/cancel', cancelOrder);

// Delete an order
router.delete('/:id', deleteOrder);

export default router; 