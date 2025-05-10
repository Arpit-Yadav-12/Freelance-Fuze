import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPayment = async (req: Request, res: Response) => {
  const { amount, orderId } = req.body;
  
  // Validate required fields
  if (!amount || !orderId) {
    return res.status(400).json({ 
      error: 'Amount and orderId are required' 
    });
  }

  // Validate amount is a valid number
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return res.status(400).json({ 
      error: 'Amount must be a valid number' 
    });
  }

  try {
    // Create a transaction record
    const payment = await prisma.transaction.create({
      data: {
        amount: numericAmount,
        status: 'pending',
        orderId,
      },
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid' }
    });

    res.status(201).json({
      ...payment,
      orderId: payment.id,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Payment creation failed' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id } = req.body;
  
  try {
    // Update transaction status
    const payment = await prisma.transaction.update({
      where: { id: razorpay_order_id },
      data: { status: 'completed' },
    });
    
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.transaction.findMany();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const payment = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const payment = await prisma.transaction.update({
      where: { id },
      data: {
        status,
      },
    });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.transaction.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}; 