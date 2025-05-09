import express from 'express';
import { getPayments, getPaymentById, createPayment, verifyPayment, deletePayment } from '../controllers/paymentController';

const router = express.Router();

router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.post('/verify', verifyPayment);
router.delete('/:id', deletePayment);

export default router; 